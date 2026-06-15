# Code Conventions

## Naming Conventions

**Files:**
Observado em `public/js/lib/truncate.js`: camelCase para utilitários (`truncate.js`), arquivos de teste como `*.test.js` em `tests/unit/`. Convenções planejadas (ADR, não implementadas): `PascalCase` para componentes (`PostCard.js`), `kebab-case`/lowerCamel para views (`feed.js`, `post.js`).

**Functions/Methods:**
camelCase. Exemplo real: `truncate(text, maxLength)` em `public/js/lib/truncate.js`.

**Variables:**
camelCase. Exemplo real: `slice`, `lastSpace`, `cut` em `truncate.js`.

**Constants:**
Não há exemplo real ainda. Planejado: `UPPER_SNAKE_CASE` para configs (`RULES`, `COOKIE_NAME`, `JWT_SECRET`).

## Code Organization

**Import/Dependency Declaration:**
ESM (`import`/`export`), sem CommonJS. Exemplo real: `tests/unit/truncate.test.js` importa `{ describe, it, expect }` de `vitest` e `{ truncate }` via caminho relativo `../../public/js/lib/truncate.js`.

**File Structure:**
`truncate.js` exporta uma única função pura com JSDoc completo (`@param`, `@returns`) precedendo a declaração. Sem classes, sem estado de módulo.

## Type Safety/Documentation

**Approach:** JavaScript puro com JSDoc para hints de tipo (`@param {string} text`, `@returns {string}`). `TypeScript` (`.ts`, `tsconfig.json`) é proibido — ver Hard Constraints.
Exemplo real: bloco JSDoc completo em `public/js/lib/truncate.js:1-8`.

## Error Handling

**Pattern:** Funções `lib/` retornam valores-sentinela em vez de lançar para entradas inválidas. Exemplo real: `truncate(text, maxLength)` retorna `""` se `text` não for string (`public/js/lib/truncate.js:10`), em vez de lançar `TypeError`.
Padrões de error handling para fetch/UI (try/catch + `showErrorToast`, `unhandledrejection` global) são decididos mas não implementados — ver ARCHITECTURE.md § Error Handling Global.

## Comments/Documentation

**Style:** JSDoc para funções exportadas (`@param`, `@returns`). Comentários inline curtos para explicar decisões não-óbvias (ex.: por que um valor sentinela é retornado). Sem blocos de comentário extensos.

---

## Hard Constraints (MUST / MUST NOT)

> Fonte: `docs/adr/ADR-0001-arquitetura-base.md` § "Restrições Absolutas" (cópia completa — única fonte
> para `CLAUDE.md` § Restrições Absolutas, gerado na Etapa 1). `MUST NOT` violar nenhuma destas regras;
> qualquer PR que viole uma delas `MUST` ser rejeitado.

| Proibido                                        | Alternativa obrigatória                                                     |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| TypeScript (`.ts`, `tsconfig.json`)             | JavaScript puro — JSDoc opcional para hints de tipo                         |
| Hash routing (`#/rota`)                         | History API — `pushState` + `popstate`                                      |
| `innerHTML` com variáveis                       | `.textContent` + `<template>` + `createElement`                             |
| `cloneNode(true)` em `<template>`               | `document.importNode(template.content, true)`                               |
| Valores hardcoded em CSS (`#181a18`, `16px`)    | Tokens CSS — `var(--color-bg)`, `1rem`                                      |
| `px` em fonte ou espaçamento                    | `rem`                                                                       |
| Framework CSS (Bootstrap, Tailwind, etc.)       | CSS vanilla com `tokens.css`                                                |
| Framework JS (React, Vue, Svelte, etc.)         | Component Pattern vanilla — ver ARCHITECTURE.md                             |
| `var` para declaração de variáveis              | `const` / `let`                                                             |
| `==` para comparação                            | `===` sempre                                                                |
| `border-radius`                                 | Proibido — decisão de design do sistema visual                              |
| `box-shadow`, `text-shadow`, gradientes         | Proibido — apenas cores sólidas                                             |
| Store como objeto simples mutável               | Proxy + pub/sub — ver ARCHITECTURE.md § State Management                    |
| Ausência de focus management em navegação       | `main.focus()` + route announcer após cada troca de rota                    |
| `unsafe-inline` no CSP                          | `strict-dynamic` + nonce — proibido mesmo em desenvolvimento                |
| Subscription de store sem cleanup na view       | `destroy()` com `unsubs.forEach(fn => fn())` antes de trocar de view        |
| View sem retorno de `{ destroy }`               | Toda view `MUST` retornar contrato de lifecycle ou `null`                   |
| `import()` com template string dinâmica         | Usar string literal estática — `import("./views/feed.js")`                  |
| `unhandledrejection` sem handler global         | `window.addEventListener("unhandledrejection", ...)` registrado em `app.js` |
| Endpoint sem entrada em `api/openapi.yaml`      | Contrato `MUST` ser atualizado antes de qualquer implementação de rota      |
| Merge de PR com CI vermelho                     | Branch protection rule exige CI verde — `MUST NOT` merge sem CI aprovado    |
| `localStorage`/`sessionStorage` para armazenar JWT | Cookie `HttpOnly; SameSite=Lax; Path=/` — ver `.specs/features/auth-cookie-httponly/design.md` |
| View privada sem `requireAuth()` no início      | `MUST` chamar `requireAuth()` antes de qualquer render de view autenticada  |
| `innerHTML` com conteúdo de Markdown            | `MUST` usar policy Trusted Types `'md-renderer'` com DOMPurify — ver `.specs/features/markdown-rendering/design.md` |

> Toda nova regra `MUST` entra primeiro nesta tabela (completo), depois condensada em `CLAUDE.md § Restrições Absolutas`.
