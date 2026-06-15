# Promptdown UI v2

SPA modular em JavaScript vanilla (sem framework, sem bundler) que aplica arquitetura e
práticas de repositórios de produção a um blog/feed de posts — produto real + laboratório
de estudo. Usuários leem e publicam posts em Markdown (feed público + área autenticada),
com acessibilidade WCAG 2.2 AA e segurança XSS-safe (Trusted Types/DOMPurify).

## Estado atual

Quase nada está implementado: apenas `public/js/lib/truncate.js` (+ teste) e o contrato
`api/openapi.yaml` (OpenAPI 3.0.3). Milestone v1 = `feed-publico` + `auth-cookie-httponly`
funcionando com gates passando (`markdown-rendering` fica para depois). Ver
`.specs/project/ROADMAP.md` para status detalhado por feature.

## Comandos

Reais (`package.json` hoje):

```bash
npm run test            # vitest run
npm run test:coverage   # vitest run --coverage
```

Planejados, ainda **não existem**: `serve`, `api`, `lint`, `lint:api`, `format`,
`mock:api`, `test:e2e`, `test:a11y`. Ver `.specs/codebase/CONCERNS.md` para detalhes e
`.specs/codebase/TESTING.md` para a matriz de cobertura por tipo de teste.

## Restrições Absolutas (MUST / MUST NOT)

> Versão condensada. Lista completa + exemplos em
> `.specs/codebase/CONVENTIONS.md § Hard Constraints`. Toda nova regra `MUST` entra
> primeiro lá (completo), depois condensada aqui.

| Proibido                                     | Alternativa obrigatória                                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| TypeScript (`.ts`, `tsconfig.json`)          | JavaScript puro — JSDoc opcional para hints de tipo                                                                 |
| Hash routing (`#/rota`)                      | History API — `pushState` + `popstate`                                                                              |
| `innerHTML` com variáveis                    | `.textContent` + `<template>` + `createElement`                                                                     |
| `cloneNode(true)` em `<template>`            | `document.importNode(template.content, true)`                                                                       |
| Valores hardcoded em CSS (`#181a18`, `16px`) | Tokens CSS — `var(--color-bg)`, `1rem`                                                                              |
| `px` em fonte ou espaçamento                 | `rem`                                                                                                               |
| Framework CSS (Bootstrap, Tailwind, etc.)    | CSS vanilla com `tokens.css`                                                                                        |
| Framework JS (React, Vue, Svelte, etc.)      | Component Pattern vanilla — ver `.specs/codebase/ARCHITECTURE.md`                                                   |
| `var` para declaração de variáveis           | `const` / `let`                                                                                                     |
| `==` para comparação                         | `===` sempre                                                                                                        |
| `border-radius`                              | Proibido — decisão de design do sistema visual                                                                      |
| `box-shadow`, `text-shadow`, gradientes      | Proibido — apenas cores sólidas                                                                                     |
| Store como objeto simples mutável            | Proxy + pub/sub — ver `.specs/codebase/ARCHITECTURE.md § State Management`                                          |
| Ausência de focus management em navegação    | `main.focus()` + route announcer após cada troca de rota                                                            |
| `unsafe-inline` no CSP                       | `strict-dynamic` + nonce — proibido mesmo em desenvolvimento                                                        |
| Subscription de store sem cleanup na view    | `destroy()` com `unsubs.forEach(fn => fn())` antes de trocar de view                                                |
| View sem retorno de `{ destroy }`            | Toda view `MUST` retornar contrato de lifecycle ou `null`                                                           |
| `import()` com template string dinâmica      | Usar string literal estática — `import("./views/feed.js")`                                                          |
| `unhandledrejection` sem handler global      | `window.addEventListener("unhandledrejection", ...)` em `app.js`                                                    |
| Endpoint sem entrada em `api/openapi.yaml`   | Contrato `MUST` ser atualizado antes de implementar a rota                                                          |
| Merge de PR com CI vermelho                  | Branch protection exige CI verde — `MUST NOT` merge sem CI aprovado                                                 |
| `localStorage`/`sessionStorage` para JWT     | Cookie `HttpOnly; SameSite=Lax; Path=/` — ver `.specs/features/auth-cookie-httponly/design.md`                      |
| View privada sem `requireAuth()` no início   | `MUST` chamar `requireAuth()` antes de render de view autenticada                                                   |
| `innerHTML` com conteúdo de Markdown         | `MUST` usar policy Trusted Types `'md-renderer'` com DOMPurify — ver `.specs/features/markdown-rendering/design.md` |

## Convenções rápidas

**Estrutura de pastas** (ver `.specs/codebase/STRUCTURE.md`):

- `public/js/lib/` — utilitários puros sem DOM (ex.: `truncate.js`)
- `public/js/components/`, `public/js/views/`, `public/js/api.js`, `public/js/store.js`,
  `public/js/router.js`, `public/js/app.js` — planejados, ainda não existem
- `api/openapi.yaml` — contrato real (OpenAPI 3.0.3); `api/server.js` e
  `api/middleware/*` planejados
- `tests/unit/` — único diretório de teste existente
- `.specs/features/{auth-cookie-httponly,feed-publico,markdown-rendering}/` — specs ativas

**Padrão de testes** (ver `.specs/codebase/TESTING.md`):

- Vitest (`describe`/`it`/`expect`), um `describe` por função exportada
- Arquivo `tests/unit/*.test.js` espelha o módulo de origem em `public/js/lib/`
- Casos cobrem: comportamento normal, edge cases (entrada vazia/nula/não-string) e
  regressões nomeadas
- Gate rápido: `npm run test` · Gate completo (antes de concluir tarefa):
  `npm run test:coverage`

## Ponteiros

- `.specs/project/{PROJECT,ROADMAP,STATE}.md` — visão, milestones, memória persistente
- `.specs/codebase/{STACK,ARCHITECTURE,CONVENTIONS,STRUCTURE,TESTING,INTEGRATIONS,CONCERNS}.md`
  — mapeamento detalhado do codebase
- `docs/DESIGN.md` — design tokens e regras de verificação visual
- `api/openapi.yaml` + `.spectral.yaml` — contrato de API
- `.specs/features/` — especificações de features ativas
