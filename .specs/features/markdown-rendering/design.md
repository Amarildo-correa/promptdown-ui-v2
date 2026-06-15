# Markdown Rendering — Design

**Spec**: `.specs/features/markdown-rendering/spec.md`
**Status**: Draft

---

## Architecture Overview

Pipeline de renderização Markdown seguro com Trusted Types como enforcement layer:

```
body (string)
    │
    ▼
marked.parse(body)          ← CommonMark parser, output: HTML string
    │
    ▼
policy.createHTML(html)     ← Trusted Types policy 'md-renderer'
    │                          internamente: DOMPurify.sanitize(html, ALLOWED_TAGS)
    ▼
element.innerHTML = TrustedHTML   ← browser aceita apenas TrustedHTML
    │                               com CSP: require-trusted-types-for 'script'
    ▼
DOM node formatado          ← retornado pelo componente MarkdownRenderer
```

**Enforcement triplo:**
1. `DOMPurify.sanitize()` — remove tags/atributos maliciosos no nível da string
2. Trusted Types policy — único ponto onde HTML entra no DOM; strings brutas → TypeError
3. CSP `require-trusted-types-for 'script'` — o browser bloqueia qualquer `innerHTML = string`
   fora da policy, tornando impossível contornar acidentalmente

---

## Module Resolution — Blocker Arquitetural

O projeto não usa bundler (sem Vite, Webpack, Rollup). Bare specifiers como
`import { marked } from 'marked'` não são resolvidos pelo browser sem ajuda.

**Decisão: Import Maps + builds ESM locais em `public/vendor/`**

```html
<!-- public/index.html -->
<script type="importmap">
{
  "imports": {
    "marked":    "/vendor/marked.esm.js",
    "dompurify": "/vendor/purify.es.mjs"
  }
}
</script>
```

Ambas as bibliotecas já fornecem builds ESM prontos para browser:
- `node_modules/marked/lib/marked.esm.js` → copiar para `public/vendor/marked.esm.js`
- `node_modules/dompurify/dist/purify.es.mjs` → copiar para `public/vendor/purify.es.mjs`

**Por que não CDN?**
- CDN externo introduz dependência de rede e novo `script-src` no CSP
- Vendor local funciona offline e é controlável via `package-lock.json`

**Por que não `<script src>` global?**
- Globais (`window.marked`, `window.DOMPurify`) poluem o namespace e são incompatíveis
  com o padrão ESM do projeto (`"type": "module"` no `package.json`)

**Import Maps são Baseline** desde 2023 — suportados por todos os browsers relevantes.

**Tarefa adicionada**: T0 no `tasks.md` — copiar vendors e criar import map.

---

## Code Reuse Analysis

### Componentes existentes a reutilizar

| Componente | Localização | Como reutilizar |
| ---------- | ----------- | --------------- |
| Padrão `<template>` factory | `PostCard.js` (pattern) | MarkdownRenderer segue o mesmo padrão de template cloning |
| `document.importNode(template.content, true)` | PostCard.js:214 | Mesmo padrão para criar o wrapper do renderer |
| `showErrorToast` | `app.js` | Exibir erro se marked.parse() lançar exceção inesperada |
| Design tokens CSS | `tokens.css` | Todos os tokens de cor, tipografia e espaçamento para estilizar Markdown |

### Integration Points

| Sistema | Como integrar |
| ------- | ------------- |
| `public/js/views/post.js` | Substituir `.textContent = post.body` por `MarkdownRenderer(post.body)` |
| `public/js/views/PostCard.js` (P2) | Substituir `.textContent = post.body` por preview inline truncado |
| `.specs/codebase/ARCHITECTURE.md` | Novo Identified Pattern "Markdown Rendering / Trusted Types policy" |
| `.specs/codebase/CONVENTIONS.md` | Nova linha em "Hard Constraints" (`innerHTML` com Markdown → policy `md-renderer`) |
| `docs/api/openapi.yaml` | Atualizar `description` do campo `body` no schema `Post` |

---

## Components

### `public/js/lib/md-policy.js` — Trusted Types + DOMPurify policy

- **Purpose**: Única fonte de verdade para renderização segura de HTML gerado de Markdown
- **Location**: `public/js/lib/md-policy.js`
- **Interface**:

```js
/**
 * Converte uma string Markdown em TrustedHTML sanitizado.
 * É o ÚNICO ponto da codebase onde innerHTML recebe HTML gerado de Markdown.
 *
 * @param {string} markdownSource - Texto Markdown do post
 * @returns {TrustedHTML|string} TrustedHTML em browsers com Trusted Types API;
 *                               string sanitizada em browsers sem suporte (fallback)
 */
export function renderMarkdown(markdownSource)
```

**Nota de segurança**: `PURIFY_CONFIG` não define a opção `SAFE_FOR_XML`. O
default do DOMPurify (`true`, >=3.1.3) é o comportamento seguro; definir
`false` reabriria vetores de XSS via comentários HTML maliciosos. A
verificação em `tasks.md` (`grep SAFE_FOR_XML md-policy.js` → 0 matches)
garante que a opção nunca seja tocada — incluindo em comentários.

**Implementação interna:**

```js
import DOMPurify from 'dompurify'
import { marked } from 'marked'

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'h1','h2','h3','h4','h5','h6',
    'p','br','hr',
    'strong','em','del','code','pre',
    'ul','ol','li',
    'a','blockquote',
  ],
  ALLOWED_ATTR: ['href', 'title'],
  ALLOW_DATA_ATTR: false,
  // MUST NOT: 'target' em ALLOWED_ATTR — previne abertura de novas janelas via Markdown
}

// Feature detect — Trusted Types é Baseline fev/2026 mas é prudente checar
const policy = typeof trustedTypes !== 'undefined'
  ? trustedTypes.createPolicy('md-renderer', {
      createHTML: (s) => DOMPurify.sanitize(s, PURIFY_CONFIG),
    })
  : null

export function renderMarkdown(markdownSource) {
  if (!markdownSource || !markdownSource.trim()) return ''

  let html
  try {
    html = marked.parse(String(markdownSource))
  } catch (err) {
    console.error('[MarkdownRenderer] marked.parse failed:', err)
    return null // sinal para MarkdownRenderer usar fallback textContent
  }

  if (policy) {
    return policy.createHTML(html)   // TrustedHTML
  }
  return DOMPurify.sanitize(html, PURIFY_CONFIG) // fallback: string sanitizada
}
```

- **Dependencies**: `marked` (npm), `dompurify` (npm)
- **Reuses**: Padrão de `lib/` existente (sanitize.js, esc.js)

---

### `public/js/components/MarkdownRenderer.js` — Factory component

- **Purpose**: Componente que recebe `body` string e retorna `Element` com Markdown renderizado,
  seguindo o mesmo padrão factory dos outros componentes
- **Location**: `public/js/components/MarkdownRenderer.js`
- **Interface**:

```js
/**
 * Renderiza uma string Markdown como nó DOM seguro.
 * Segue o Component Pattern do ADR: recebe dado, retorna Element.
 *
 * @param {string|null} markdownSource - Conteúdo Markdown do post
 * @returns {Element} <div class="markdown-body"> com HTML renderizado
 *                    ou com textContent como fallback em caso de erro
 */
export function MarkdownRenderer(markdownSource)
```

**Implementação interna:**

```js
import { renderMarkdown } from '../lib/md-policy.js'

const template = document.createElement('template')
template.innerHTML = `<div class="markdown-body"></div>`

export function MarkdownRenderer(markdownSource) {
  const node = document.importNode(template.content, true)
  const container = node.querySelector('.markdown-body')

  const trustedHtml = renderMarkdown(markdownSource)

  if (trustedHtml === null) {
    // fallback: marked.parse lançou exceção — exibe texto plano
    container.textContent = markdownSource ?? ''
    return node.firstElementChild
  }

  if (trustedHtml === '') {
    return node.firstElementChild // body vazio — container vazio OK
  }

  // ÚNICO ponto de innerHTML nesta codebase — trustedHtml é TrustedHTML ou string DOMPurify
  container.innerHTML = trustedHtml

  return node.firstElementChild  // MUST retornar Element (não DocumentFragment)
}
```

- **Contract**: Retorna `Element` — segue `MUST retornar DocumentFragment ou Element` do ADR
- **Dependencies**: `md-policy.js`
- **Reuses**: Padrão de `<template>` factory idêntico ao `PostCard.js`

---

### `public/css/components/markdown.css` — Estilos para Markdown renderizado

- **Purpose**: Estilizar os elementos HTML gerados pelo Markdown usando design tokens
- **Location**: `public/css/components/markdown.css`
- **Regras**:
  - MUST usar `var(--token)` em todos os valores — zero hardcoded
  - MUST usar `rem` para fontes e espaçamento — zero `px` em fonte/spacing
  - MUST respeitar `prefers-color-scheme` via tokens semânticos já mapeados em `tokens.css`
  - MUST respeitar `prefers-reduced-motion` (já coberto pelo reset em tokens.css)

```css
.markdown-body { ... }            /* container */
.markdown-body h1–h6 { ... }     /* títulos com var(--color-heading), var(--text-xl..2xl) */
.markdown-body p { ... }          /* parágrafos com var(--space-3) margin-bottom */
.markdown-body code { ... }       /* inline code: var(--color-code-bg), var(--font-code) */
.markdown-body pre { ... }        /* code blocks: var(--color-code-bg), overflow-x: auto */
.markdown-body a { ... }          /* links: var(--color-accent), sem underline padrão */
.markdown-body blockquote { ... } /* quotes: border-left var(--color-border-strong) */
.markdown-body ul, ol { ... }     /* listas com var(--space-3) padding-left */
```

---

## ARCHITECTURE.md Update — Pattern a adicionar em `.specs/codebase/ARCHITECTURE.md`

### Posição no documento
Adicionar como novo Identified Pattern "Markdown Rendering / Trusted Types
policy" em `.specs/codebase/ARCHITECTURE.md`, seguindo o mesmo formato
Location/Purpose/Implementation/Status dos demais patterns (planejado).

### Conteúdo do novo pattern

```markdown
### Markdown Rendering

| Dimensão       | Decisão                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------- |
| **O quê**      | `MUST` usar `marked.js` + `DOMPurify (>=3.3.3)` + Trusted Types policy para renderizar Markdown |
| **Policy**     | `MUST` criar policy com nome `'md-renderer'` — único ponto de `innerHTML` para HTML dinâmico  |
| **DOMPurify**  | `MUST NOT` usar `SAFE_FOR_XML: false` — `true` é o default seguro (>=3.1.3); desativá-lo reabre vetores de XSS via comentários HTML |
| **CSP**        | `MUST` adicionar `trusted-types md-renderer` ao Content-Security-Policy                        |
| **Fallback**   | `MUST` detectar `'trustedTypes' in window` — usar DOMPurify direto se API ausente             |
| **ALLOWED_TAGS** | `MUST` restringir tags permitidas — sem `<script>`, `<style>`, `<iframe>`, `<img>`           |
| **Proibido**   | `MUST NOT` usar `innerHTML = string` diretamente fora da policy para conteúdo de Markdown     |
```

### Atualização em CONVENTIONS.md / CLAUDE.md

Esta linha vai primeiro em `.specs/codebase/CONVENTIONS.md` § Hard Constraints
(versão completa) e depois, condensada, em `CLAUDE.md` § Restrições Absolutas —
conforme a regra permanente do playbook de migração ("Toda nova regra MUST →
primeiro em CONVENTIONS.md, depois condensada em CLAUDE.md"):

```markdown
| `innerHTML` com conteúdo de Markdown | MUST usar policy Trusted Types 'md-renderer' com DOMPurify |
```

---

## OpenAPI Update — `docs/api/openapi.yaml`

### Mudança no schema `Post`

```yaml
# Antes:
body: { type: string, minLength: 10, maxLength: 5000 }

# Depois:
body:
  type: string
  minLength: 10
  maxLength: 5000
  description: >
    Conteúdo completo do post em CommonMark Markdown.
    Renderizado no cliente via marked.js + DOMPurify.
    Tags HTML no conteúdo são sanitizadas antes da renderização.
```

---

## Error Handling Strategy

| Cenário | Handling | User Impact |
| ------- | -------- | ----------- |
| `marked.parse()` lança exceção | `console.error` + retorna `null` → fallback para `.textContent` | Usuário vê texto plano não formatado |
| `DOMPurify.sanitize()` retorna `''` (payload 100% malicioso) | Container vazio | Usuário vê área em branco (melhor que XSS) |
| `markdownSource` é `null`/`undefined` | Guard no início de `renderMarkdown` → retorna `''` | Container vazio sem erro |
| `trustedTypes` não disponível no browser | Feature detect → DOMPurify direto como string | Mesmo resultado visual, sem Trusted Types enforcement |

---

## Tech Decisions

| Decisão | Escolha | Rationale |
| ------- | ------- | --------- |
| Parser Markdown | `marked.js` | CommonMark compliance, ~50kb, sem dependências, usado por GitHub |
| Sanitização | `DOMPurify >=3.3.3` | Único com suporte nativo a Trusted Types; Cure53-maintained |
| Enforcement | Trusted Types policy | Adoção do mecanismo que o ADR já mandava avaliar; Baseline fev/2026 |
| ALLOWED_TAGS | Lista restrita sem `<img>` | Previne hotlinking, rastreamento por pixel, e vetores CSS injection |
| `<a>` sem `target` em ALLOWED_ATTR | Intencional | Links externos não abrem nova aba sem `rel="noopener"` — P3 |
| Localização da policy | `lib/md-policy.js` | Separado do componente: policy é security concern, não UI concern |
