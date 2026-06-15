# Markdown Rendering — Tasks

**Design**: `.specs/features/markdown-rendering/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 0: Prerequisite (Sequential)

Module resolution sem bundler — deve rodar antes de qualquer código de feature.

```
T0
```

### Phase 1: Foundation (Sequential)

Dependências externas e documentação antes de qualquer código de feature.

```
T0 → T1 → T2 → T3
```

### Phase 2: Core Implementation (Parallel OK)

Com a policy e o ADR prontos, os componentes podem ser escritos em paralelo.

```
        ┌→ T4 [P] ─┐
T3 ─────┤            ├──→ T7
        └→ T5 [P] ─┘

T3 ─────────────────────→ T6
```

### Phase 3: Integration (Sequential)

Integração na view e gate de segurança final.

```
T7 → T8 → T9
```

---

## Task Breakdown

### T0: Instalar deps e criar Import Map + vendor ESM

**What**: Instalar `marked` e `dompurify`, copiar seus builds ESM para `public/vendor/` e criar
`<script type="importmap">` no `public/index.html` para que bare specifiers funcionem no browser
sem bundler
**Where**: `package.json`, `public/vendor/`, `public/index.html`
**Depends on**: None
**Reuses**: Padrão ESM do projeto (`"type": "module"` em package.json)
**Requirement**: MDR-01, MDR-03, MDR-07

**Done when**:

- [ ] `marked` e `dompurify@>=3.3.3` em `dependencies` no `package.json`
- [ ] `public/vendor/marked.esm.js` existe (copiado de `node_modules/marked/lib/marked.esm.js`)
- [ ] `public/vendor/purify.es.mjs` existe (copiado de `node_modules/dompurify/dist/purify.es.mjs`)
- [ ] `public/index.html` contém `<script type="importmap">` com entradas para `"marked"` e `"dompurify"`
- [ ] O import map aparece **antes** de qualquer `<script type="module">` no `<head>`
- [ ] Verificação no browser: `import { marked } from 'marked'` não lança erro de módulo não encontrado
- [ ] Verificação no browser: `import DOMPurify from 'dompurify'` não lança erro

**Tests**: none
**Gate**: none (setup step — verificado manualmente no browser)

**Verify**:
```bash
# Confirmar builds ESM existem nos locais esperados
ls public/vendor/
# Confirmar import map no index.html
grep -A 10 "importmap" public/index.html
```

**Nota**: `public/vendor/` deve ser adicionado ao `.gitignore` se os vendors forem gerados por
script, ou versionado se forem arquivos estáveis. Decisão a tomar em T0.

---

### T1: Atualizar ARCHITECTURE.md/CONVENTIONS.md/CLAUDE.md com pattern Markdown Rendering

**What**: Adicionar Identified Pattern "Markdown Rendering / Trusted Types policy" em
`.specs/codebase/ARCHITECTURE.md` conforme design.md, adicionar entrada na tabela
"Hard Constraints" de `.specs/codebase/CONVENTIONS.md` e a versão condensada na
tabela "Restrições Absolutas" de `CLAUDE.md`
**Where**: `.specs/codebase/ARCHITECTURE.md`, `.specs/codebase/CONVENTIONS.md`, `CLAUDE.md`
**Depends on**: None
**Reuses**: Formato Location/Purpose/Implementation/Status dos demais Identified
Patterns de `ARCHITECTURE.md`; formato de tabela de `CONVENTIONS.md` § Hard
Constraints / `CLAUDE.md` § Restrições Absolutas
**Requirement**: MDR-08

**Done when**:

- [ ] Identified Pattern "Markdown Rendering / Trusted Types policy" existe em
  `.specs/codebase/ARCHITECTURE.md` com tabela de dimensões: O quê, Policy, DOMPurify,
  CSP, Fallback, ALLOWED_TAGS, Proibido
- [ ] Tabela "Hard Constraints" de `.specs/codebase/CONVENTIONS.md` contém entrada para
  `innerHTML com conteúdo de Markdown`
- [ ] Tabela "Restrições Absolutas" de `CLAUDE.md` contém a versão condensada da mesma regra
- [ ] `grep "md-renderer" .specs/codebase/ARCHITECTURE.md .specs/codebase/CONVENTIONS.md CLAUDE.md` retorna resultado

**Tests**: none
**Gate**: none (documentation)

**Verify**:
```bash
grep -n "md-renderer" .specs/codebase/ARCHITECTURE.md .specs/codebase/CONVENTIONS.md CLAUDE.md
grep -n "Markdown Rendering" .specs/codebase/ARCHITECTURE.md
```

---

### T3: Atualizar openapi.yaml com description Markdown no campo body

**What**: Adicionar `description` explícita de Markdown ao campo `body` no schema `Post` do OpenAPI
**Where**: `docs/api/openapi.yaml`
**Depends on**: None
**Reuses**: Estrutura de schema existente
**Requirement**: MDR-09

**Done when**:

- [ ] Schema `Post.body` tem campo `description` com texto que menciona "Markdown"
- [ ] `npm run lint:api` passa sem erros (Spectral)
- [ ] Estrutura YAML permanece válida (sem erros de indentação)

**Tests**: none
**Gate**: `npm run lint:api`

**Verify**:
```bash
npm run lint:api
grep -A 5 "body:" docs/api/openapi.yaml
```

---

### T4: Criar `public/js/lib/md-policy.js` com testes XSS [P]

**What**: Criar módulo de Trusted Types policy + DOMPurify + função `renderMarkdown`, incluindo
testes Vitest com corpus de XSS payloads obrigatórios (MDR-03 a MDR-07)
**Where**: `public/js/lib/md-policy.js` + `tests/unit/md-policy.test.js`
**Depends on**: T0
**Reuses**: Padrão de `public/js/lib/sanitize.js` (estrutura de módulo lib)
**Requirement**: MDR-03, MDR-04, MDR-05, MDR-06, MDR-07

**Done when**:

- [ ] `renderMarkdown(markdownSource)` exportada de `public/js/lib/md-policy.js`
- [ ] Feature detect `'trustedTypes' in window` antes de `trustedTypes.createPolicy`
- [ ] `PURIFY_CONFIG` define `ALLOWED_TAGS` restrito (lista do design.md)
- [ ] `SAFE_FOR_XML` NUNCA aparece no arquivo (grep deve retornar 0 matches)
- [ ] `renderMarkdown(null)` retorna `''` sem TypeError
- [ ] `renderMarkdown('')` retorna `''` sem TypeError
- [ ] Testes Vitest cobrem os 7 payloads XSS obrigatórios:
  - `<script>alert(1)</script>` → script removido
  - `<img src=x onerror=alert(1)>` → tag removida (img não está em ALLOWED_TAGS)
  - `<a href="javascript:alert(1)">x</a>` → href removido
  - `</noscript><img src=x onerror=alert(1)>` → payload neutralizado
  - `<div onmouseover=alert(1)>x</div>` → evento inline removido
  - `<svg><script>alert(1)</script></svg>` → script removido
  - `<iframe src="javascript:alert(1)"></iframe>` → tag removida
- [ ] `npm test` passa com cobertura de branches ≥ 80% para `md-policy.js`
- [ ] Test count: ≥ 12 testes pass (XSS corpus + casos normais + edge cases)

**Tests**: unit
**Gate**: `npm test -- --coverage`

**Verify**:
```bash
npm test tests/unit/md-policy.test.js
grep -n "SAFE_FOR_XML" public/js/lib/md-policy.js  # MUST retornar 0 matches
```

---

### T5: Criar `public/js/components/MarkdownRenderer.js` [P]

**What**: Criar factory component que recebe string Markdown e retorna `Element` com HTML
renderizado, seguindo o Component Pattern do ADR
**Where**: `public/js/components/MarkdownRenderer.js`
**Depends on**: T0
**Reuses**: Padrão de template factory de `PostCard.js` (template + importNode)
**Requirement**: MDR-01, MDR-02, MDR-10

**Done when**:

- [ ] `MarkdownRenderer(markdownSource)` exportada do arquivo
- [ ] Usa `document.createElement('template')` + `document.importNode(template.content, true)`
      (padrão do ADR — MUST NOT usar cloneNode)
- [ ] Retorna `Element` (não `DocumentFragment`, não `string`)
- [ ] `container.innerHTML = trustedHtml` é o ÚNICO ponto de innerHTML no arquivo
- [ ] Fallback para `.textContent` quando `renderMarkdown` retorna `null`
- [ ] `MarkdownRenderer(null)` retorna Element com container vazio
- [ ] `MarkdownRenderer('')` retorna Element com container vazio
- [ ] `grep -c "innerHTML" public/js/components/MarkdownRenderer.js` retorna exatamente `1`

**Tests**: unit (integração com md-policy)
**Gate**: `npm test`

**Verify**:
```bash
grep -n "innerHTML" public/js/components/MarkdownRenderer.js  # MUST ser exatamente 1 linha
npm test tests/unit/MarkdownRenderer.test.js
```

---

### T6: Criar `public/css/components/markdown.css`

**What**: Criar CSS para estilizar o conteúdo Markdown renderizado usando design tokens
**Where**: `public/css/components/markdown.css`
**Depends on**: T3
**Reuses**: `public/css/tokens.css` (todos os valores via `var(--token)`)
**Requirement**: MDR-11

**Done when**:

- [ ] Arquivo cobre todos os elementos do ALLOWED_TAGS: h1–h6, p, code, pre, ul, ol, li, a, blockquote, hr
- [ ] Zero valores hardcoded (`grep -n "#\|[0-9]px\|[0-9]em" markdown.css` retorna apenas border: 1px
      e outline-offset permitidos pelo ADR)
- [ ] Todos os valores de cor usam `var(--color-*)` de `tokens.css`
- [ ] Todos os valores de fonte/espaçamento usam `var(--text-*)`, `var(--space-*)`, `rem`
- [ ] `.markdown-body a` define `color: var(--color-accent)` e não contém href estilos perigosos
- [ ] `.markdown-body pre` tem `overflow-x: auto` para code blocks longos
- [ ] CSS não contém `border-radius`, `box-shadow`, `text-shadow` (proibidos pelo ADR)

**Tests**: none
**Gate**: `npm run lint` (ESLint não verifica CSS, mas lint do CSS pode ser adicionado)

**Verify**:
```bash
grep -n "border-radius\|box-shadow\|text-shadow" public/css/components/markdown.css  # 0 matches
grep -n "var(--" public/css/components/markdown.css  # deve ter muitos matches
```

---

### T7: Integrar MarkdownRenderer na PostView

**What**: Substituir renderização de texto plano do `body` na PostView pelo componente
MarkdownRenderer, incluindo import do CSS de Markdown
**Where**: `public/js/views/post.js`
**Depends on**: T4, T5
**Reuses**: `public/js/views/post.js` (modificação) + `MarkdownRenderer.js` (import)
**Requirement**: MDR-01, MDR-02

**Done when**:

- [ ] PostView importa `MarkdownRenderer` de `../components/MarkdownRenderer.js`
- [ ] A linha que usava `.textContent = post.body` para o conteúdo principal é substituída por
      `container.append(MarkdownRenderer(post.body))`
- [ ] CSS `markdown.css` é referenciado no `index.html` (ou importado via mecanismo existente)
- [ ] PostView ainda retorna `{ destroy }` com cleanup correto (contrato de lifecycle do ADR)
- [ ] E2E test: navegar para `/post/:id` com post Markdown → DOM contém `<h1>`, `<strong>` ou
      `<em>` conforme o conteúdo
- [ ] E2E test: `<script>` no body → não executa (verificar ausência de `window.__xss` definida)

**Tests**: e2e (Playwright)
**Gate**: `npm run test:e2e`

**Verify**:
```bash
npm run test:e2e -- --grep "PostView Markdown"
# Navegar para /post/1 (assumindo que post 1 tem Markdown no body)
# Inspecionar DOM: deve conter .markdown-body com elementos formatados
```

---

### T8: Adicionar CSS de Markdown ao index.html

**What**: Referenciar `markdown.css` no `public/index.html` para que os estilos carreguem
**Where**: `public/index.html`
**Depends on**: T6
**Reuses**: Padrão de import de CSS existente no `<head>`
**Requirement**: MDR-11

**Done when**:

- [ ] `<link rel="stylesheet" href="/css/components/markdown.css">` existe no `<head>`
- [ ] Link é adicionado após os outros `link` de CSS de componentes (ordem consistente)
- [ ] Página carrega sem erros de 404 no console para o CSS

**Tests**: none
**Gate**: none

**Verify**:
```bash
grep "markdown.css" public/index.html
```

---

### T9: Atualizar data de post de teste com Markdown no body

**What**: Garantir que `api/database.json` tem ao menos um post com conteúdo Markdown real no
`body` para que os testes E2E e o dev manual possam verificar a feature
**Where**: `api/database.json`
**Depends on**: T7
**Reuses**: Estrutura existente de posts em database.json
**Requirement**: MDR-01

**Done when**:

- [ ] Ao menos um post em `api/database.json` tem `body` com conteúdo CommonMark completo:
      - Um `# Título` (h1)
      - Um `**texto em negrito**`
      - Um `_itálico_`
      - Um bloco de código com ` ``` `
      - Uma lista com `- item`
      - Um link `[texto](https://example.com)`
- [ ] O body de teste NÃO contém payloads XSS (dados de teste são legíveis)

**Tests**: none
**Gate**: none

**Verify**:
```bash
# Iniciar servidor e abrir /post/:id do post de teste no browser
npm run api &
npm run serve &
# Navegar para http://localhost:5173/post/ID_DO_POST_TESTE
```

---

## Parallel Execution Map

```
Phase 0 (Prerequisite):
  T0  (install + vendor ESM + import map)

Phase 1 (Foundation — Sequential):
  T0 completo, então T1 e T2 (docs — independentes entre si):
    T0 ──→ T1 (ADR)
    T0 ──→ T2 (OpenAPI)
    T0 ──→ T3 (OpenAPI lint — pode rodar em paralelo com T1)

Phase 2 (Core — Parallel):
  T0 completo, então:
    ├── T4 [P]  (md-policy.js + XSS tests)
    └── T5 [P]  (MarkdownRenderer.js)
  T2/T3 completos, então:
    └── T6 [P]  (markdown.css — pode rodar em paralelo com T4/T5)

Phase 3 (Integration — Sequential):
  T4 + T5 completos, então:
    T7 ──→ T8 ──→ T9
  T6 deve estar completo antes de T8
```

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T0: Install + vendor ESM + import map | 1 setup completo de module resolution | ✅ Granular (3 arquivos coesos) |
| T1: Atualizar ADR | 1 documento, 1 seção | ✅ Granular |
| T3: Atualizar OpenAPI | 1 campo em 1 arquivo | ✅ Granular |
| T4: md-policy.js + XSS tests | 1 módulo lib + seus testes co-locados | ✅ Granular |
| T5: MarkdownRenderer.js | 1 componente + seus testes | ✅ Granular |
| T6: markdown.css | 1 arquivo CSS | ✅ Granular |
| T7: Integrar PostView | 1 view modificada + E2E | ✅ Granular |
| T8: index.html CSS link | 1 linha em 1 arquivo | ✅ Granular |
| T9: Dados de teste | 1 post em database.json | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram Mostra | Status |
| ---- | ----------------- | -------------- | ------ |
| T0 | None | início da Phase 0 | ✅ Match |
| T1 | T0 | seta de T0 → T1 (ADR) | ✅ Match |
| T2 | T0 | seta de T0 → T2 (OpenAPI) | ✅ Match |
| T3 | T0 | seta de T0 → T3 (OpenAPI lint) | ✅ Match |
| T4 [P] | T0 | seta de T0 → T4 | ✅ Match |
| T5 [P] | T0 | seta de T0 → T5 | ✅ Match |
| T6 [P] | T3 | seta de T3 → T6 | ✅ Match |
| T7 | T4, T5 | T4+T5 → T7 | ✅ Match |
| T8 | T6 | seta de T6 → T8 (via T7→T8→T9) | ✅ Match |
| T9 | T7 | T7 → T8 → T9 | ✅ Match |

---

## Test Co-location Validation

| Task | Layer Criada/Modificada | Matrix Requer | Task Says | Status |
| ---- | ----------------------- | ------------- | --------- | ------ |
| T0 | vendor files + importmap | none | none | ✅ OK |
| T1 | .specs/codebase + CLAUDE.md | none | none | ✅ OK |
| T2 | docs/OpenAPI | none (lint:api como gate) | none | ✅ OK |
| T4 | lib/md-policy.js | unit (lib/ → ≥80%) | unit | ✅ OK |
| T5 | components/MarkdownRenderer.js | unit | unit | ✅ OK |
| T6 | CSS component | none | none | ✅ OK |
| T7 | views/post.js | e2e | e2e | ✅ OK |
| T8 | index.html (1 linha) | none | none | ✅ OK |
| T9 | database.json (dados) | none | none | ✅ OK |
