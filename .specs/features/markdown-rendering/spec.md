# Markdown Rendering — Especificação

**Status**: Draft
**Feature path**: `.specs/features/markdown-rendering/`
**Pesquisa base**: `refs/feature-markdown-render.md`
**Convenções**: `CLAUDE.md` § Restrições Absolutas + `.specs/codebase/ARCHITECTURE.md`
+ `.specs/codebase/CONVENTIONS.md`

---

## Problem Statement

O campo `body` dos posts é declarado no `openapi.yaml` como "Conteúdo completo do post em
Markdown", mas é exibido como texto plano. Usuários escrevem `**negrito**`, `# título` e blocos
de código que aparecem como caracteres literais. A falta de renderização reduz a legibilidade e
contradiz o contrato da API.

---

## Tensão Arquitetural Central — Resolução Explícita

### O conflito

O ADR (`Component Pattern`) proíbe `innerHTML` com variáveis:
> `MUST NOT usar innerHTML com variáveis em nenhum ponto da base de código`

Renderizar Markdown **requer** inserir HTML gerado no DOM. Usar `.textContent` ou `<template>`
estático não resolve — o HTML é dinâmico por natureza.

### A decisão

**Adotar Trusted Types + DOMPurify** como exceção controlada e auditável ao `MUST NOT innerHTML`.

**Justificativa:**

O próprio ADR antecipa essa decisão:
> `MUST avaliar require-trusted-types-for 'script' — elimina classe inteira de DOM XSS`

Trusted Types agora é **Baseline cross-browser** desde fevereiro de 2026 (Firefox 126 completou
suporte). A combinação Trusted Types + DOMPurify transforma a proibição de `innerHTML com
variáveis` em `innerHTML ONLY via TrustedHTML`:

1. `trustedTypes.createPolicy('md-renderer', { createHTML: s => DOMPurify.sanitize(s) })` — único
   ponto de criação de TrustedHTML na codebase
2. `element.innerHTML = policy.createHTML(html)` — o browser exige `TrustedHTML`; strings brutas
   → `TypeError`
3. Com `require-trusted-types-for 'script'` no CSP: qualquer `innerHTML = string` em QUALQUER
   lugar da codebase quebra com TypeError — a restrição do ADR vira garantia do runtime

**Isso não viola o espírito do ADR** — é sua evolução natural. A proibição original previne XSS
via `innerHTML` descuidado; Trusted Types previne XSS via `innerHTML` sistemicamente.

### Nova regra a adicionar no ADR

```
| Markdown rendering  | MUST NOT usar innerHTML diretamente com HTML gerado de Markdown.
|                     | MUST usar Trusted Types policy nomeada 'md-renderer' cujo createHTML
|                     | passa a saída por DOMPurify.sanitize() com ALLOWED_TAGS restrito.
|                     | MUST NOT definir SAFE_FOR_XML: false com DOMPurify para conteúdo externo
|                     | — `true` é o default seguro (>=3.1.3); desativá-lo reabre vetores de XSS.
|                     | O nome da policy MUST estar no CSP: trusted-types md-renderer.
```

---

## Goals

- [ ] Campo `body` dos posts renderiza Markdown formatado na view de detalhe (PostView)
- [ ] Renderização é XSS-safe: nenhum payload de script, event handler ou `javascript:` executa
- [ ] Trusted Types policy única e auditável — nenhum `innerHTML` direto fora dela
- [ ] ADR atualizado com nova regra antes da implementação
- [ ] OpenAPI atualizado com description explícita de Markdown no campo `body`

---

## Out of Scope

| Feature | Razão |
| ------- | ----- |
| Editor Markdown (preview ao digitar) | Feature separada — escopo é renderização de leitura |
| GFM (GitHub Flavored Markdown: tabelas, strikethrough, task lists) | P3 — core CommonMark é suficiente para MVP |
| Syntax highlighting em blocos de código | Dependência extra (highlight.js/prism); P3 |
| Renderização no PostCard (feed) | PostCard exibe preview truncado — texto plano adequado; P2 |
| Sanitização server-side de Markdown | Server já valida `body` como texto; client renderiza |
| Suporte a imagens externas (`![](url)`) | `ALLOWED_TAGS` restrito não incluirá `<img>` — P3 |

---

## User Stories

### P1: Leitura formatada de post ⭐ MVP

**User Story**: Como leitor, quero ver o `body` de um post renderizado com formatação Markdown
(títulos, negrito, itálico, código, listas, links) para que o conteúdo seja legível.

**Why P1**: Sem isso, a feature não existe. É o único deliverable de valor para o usuário.

**Acceptance Criteria**:

1. WHEN a PostView é carregada com um post cujo `body` contém Markdown THEN o sistema SHALL
   renderizar HTML formatado no DOM (h1–h6, strong, em, code, pre, ul, ol, li, a, blockquote)
2. WHEN o `body` é texto plano sem sintaxe Markdown THEN o sistema SHALL exibir o texto sem
   tags desnecessárias (nenhuma degradação de leitura)
3. WHEN o `body` está vazio ou é null THEN o sistema SHALL renderizar um container vazio sem erro
4. WHEN o `body` contém sintaxe Markdown inválida ou incompleta THEN o sistema SHALL fazer
   best-effort rendering sem lançar exceção

**Independent Test**: Criar post com body `# Título\n\n**negrito** e _itálico_` via API e
abrir `/post/:id` — deve exibir `<h1>`, `<strong>`, `<em>` no DOM.

---

### P1: Segurança — XSS neutralizado ⭐ MVP

**User Story**: Como desenvolvedor, quero que payloads XSS no campo `body` não sejam executados
para que o sistema seja seguro contra injeção via conteúdo de post.

**Why P1**: Sem garantia de segurança, a feature não pode ser shipada. Testes XSS são gate de
aceite obrigatório.

**Acceptance Criteria**:

1. WHEN `body` contém `<script>alert(1)</script>` THEN o sistema SHALL não executar o script
   (tag `<script>` removida pelo DOMPurify)
2. WHEN `body` contém `<img src=x onerror=alert(1)>` THEN o sistema SHALL não executar o handler
   (atributo `onerror` removido)
3. WHEN `body` contém `<a href="javascript:alert(1)">link</a>` THEN o sistema SHALL não executar
   o href (URL `javascript:` removida)
4. WHEN `body` contém `</noscript><img src=x onerror=alert(1)>` THEN o sistema SHALL não executar
   (payload neutralizado pelo DOMPurify com SAFE_FOR_XML no default `true`)
5. WHEN `require-trusted-types-for 'script'` está ativo no CSP THEN o sistema SHALL lançar
   `TypeError` em qualquer tentativa de `innerHTML = string` fora da policy

**Independent Test**: Testes unitários Vitest com corpus de XSS payloads contra a função de
sanitização. Todos devem retornar HTML sem execução de script.

---

### P1: ARCHITECTURE.md/CONVENTIONS.md e contrato atualizados ⭐ MVP

**User Story**: Como desenvolvedor, quero que o `ARCHITECTURE.md`/`CONVENTIONS.md`
e o OpenAPI reflitam a decisão de Markdown rendering para que futuras
contribuições não violem a regra por desconhecimento.

**Why P1**: `ARCHITECTURE.md` e `CONVENTIONS.md` são a fonte canônica de
patterns e regras `MUST`. Implementar sem atualizá-los seria inconsistência
arquitetural — viola o próprio princípio de "contrato antes de código".

**Acceptance Criteria**:

1. WHEN um desenvolvedor lê `.specs/codebase/ARCHITECTURE.md` THEN o documento SHALL conter
   um Identified Pattern "Markdown Rendering / Trusted Types policy" com a regra de
   Trusted Types policy
2. WHEN um agente de IA lê `docs/api/openapi.yaml` THEN o schema do campo `body` SHALL descrever
   explicitamente que o conteúdo é Markdown (via `description` no schema)
3. WHEN a seção "Hard Constraints" de `.specs/codebase/CONVENTIONS.md` (e a versão
   condensada em `CLAUDE.md` § Restrições Absolutas) é consultada THEN SHALL listar
   a regra de Markdown rendering como restrição

**Independent Test**: `grep -n "md-renderer" .specs/codebase/ARCHITECTURE.md
.specs/codebase/CONVENTIONS.md CLAUDE.md` retorna resultado.
`grep -n "Markdown" docs/api/openapi.yaml` retorna resultado.

---

### P2: Preview Markdown no PostCard

**User Story**: Como leitor do feed, quero ver um preview com formatação mínima no card de post
(pelo menos negrito/itálico) para que o conteúdo pareça mais rico no feed.

**Why P2**: Agrega valor visual, mas o feed com texto plano truncado é funcional. Depende de T3
(MarkdownRenderer) estar pronto.

**Acceptance Criteria**:

1. WHEN PostCard renderiza o `body` de um post THEN o sistema SHALL exibir texto truncado com
   formatação inline preservada (negrito, itálico) mas sem block elements (h1, pre, blockquote)
2. WHEN o preview é truncado THEN o sistema SHALL não quebrar tags HTML no meio do truncamento

**Independent Test**: Feed exibe post com `**negrito**` como `<strong>negrito</strong>` no card.

---

### P3: GFM e syntax highlighting

**User Story**: Como leitor, quero ver tabelas GitHub Flavored Markdown e código com syntax
highlighting para posts técnicos mais ricos.

**Why P3**: Requer extensões marked.js (marked-gfm) e biblioteca de highlighting. Escopo desnecessário para MVP.

**Acceptance Criteria**:

1. WHEN `body` contém tabela Markdown THEN o sistema SHALL renderizar `<table>` formatada
2. WHEN `body` contém bloco de código com linguagem THEN o sistema SHALL aplicar syntax highlighting

---

## Edge Cases

- WHEN `body` é `null` ou `undefined` THEN MarkdownRenderer SHALL renderizar container vazio sem TypeError
- WHEN `body` tem >5000 caracteres THEN MarkdownRenderer SHALL renderizar completamente (server já valida max)
- WHEN `body` contém apenas espaços/newlines THEN MarkdownRenderer SHALL renderizar container vazio
- WHEN `body` contém HTML literal (não Markdown) THEN DOMPurify SHALL remover tags não permitidas
- WHEN browser não suporta Trusted Types API THEN o sistema SHALL detectar e usar `innerHTML` com
  DOMPurify diretamente como fallback (feature detect: `'trustedTypes' in window`)
- WHEN marked.parse() lança exceção THEN MarkdownRenderer SHALL capturar, logar via `console.error`
  e renderizar `body` como texto plano via `.textContent` como fallback
- WHEN DOMPurify.sanitize() retorna string vazia (payload 100% malicioso) THEN MarkdownRenderer
  SHALL renderizar container vazio sem erro

---

## Requirement Traceability

| Req ID  | Descrição                                              | Story                    | Status  |
| ------- | ------------------------------------------------------ | ------------------------ | ------- |
| MDR-01  | Renderizar Markdown CommonMark na PostView             | P1: Leitura formatada    | Pending |
| MDR-02  | Fallback para texto plano em body inválido/vazio       | P1: Leitura formatada    | Pending |
| MDR-03  | XSS: `<script>` neutralizado                          | P1: Segurança XSS        | Pending |
| MDR-04  | XSS: event handlers inline neutralizados              | P1: Segurança XSS        | Pending |
| MDR-05  | XSS: `javascript:` em href neutralizado               | P1: Segurança XSS        | Pending |
| MDR-06  | XSS: payload `</noscript><img onerror>` neutralizado (SAFE_FOR_XML default) | P1: Segurança XSS        | Pending |
| MDR-07  | Trusted Types policy única 'md-renderer'              | P1: Segurança XSS        | Pending |
| MDR-08  | Atualizar ARCHITECTURE.md/CONVENTIONS.md/CLAUDE.md com regra de Markdown rendering | P1: ARCHITECTURE.md atualizado | Pending |
| MDR-09  | Atualizar openapi.yaml: body.description = Markdown   | P1: Contrato atualizado  | Pending |
| MDR-10  | MarkdownRenderer retorna Element (contrato Component) | P1: Leitura formatada    | Pending |
| MDR-11  | CSS markdown usa var(--token) — zero hardcoded        | P1: Leitura formatada    | Pending |
| MDR-12  | Preview inline no PostCard (P2)                       | P2: Preview no card      | Pending |

---

## Success Criteria

- [ ] PostView exibe Markdown formatado — `<h1>`, `<strong>`, `<em>`, `<code>`, `<pre>`, `<ul>`, `<a>` no DOM
- [ ] Corpus de 7 XSS payloads (MDR-03 a MDR-06) → zero execução em testes Vitest
- [ ] `grep "innerHTML" public/js/components/MarkdownRenderer.js` → único match, dentro da policy
- [ ] ADR contém seção "Markdown Rendering" com regra `md-renderer`
- [ ] `npm test` passa com cobertura ≥ 80% para `public/js/lib/md-policy.js`
