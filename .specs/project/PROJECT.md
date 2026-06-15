# Promptdown UI v2

**Vision:** SPA modular em JavaScript vanilla (sem framework, sem bundler) que aplica
arquitetura e práticas de repositórios de produção (big tech) a um projeto de blog/feed
de posts — servindo tanto como produto real quanto como laboratório de estudo.

**For:** Usuários que leem e publicam posts em formato Markdown (feed público + área autenticada).

**Solves:** Demonstra como construir um frontend modular, acessível (WCAG 2.2 AA) e
seguro (XSS-safe via Trusted Types/DOMPurify) sem dependência de frameworks ou bundlers,
usando padrões nativos da plataforma (ESM, Import Maps, History API, Proxy).

## Goals

- **v1 = Feed + Autenticação funcionando end-to-end**: rota `/` (Feed Público) lista posts
  via `GET /posts` com paginação, like e acessibilidade AA; sessão via cookie `HttpOnly`
  (login/register/logout/`/me`) protege rotas privadas — ambas as features com gates
  (`npm run test:coverage`) passando.
- **Markdown rendering fica para depois do v1** — feature já especificada
  (`.specs/features/markdown-rendering/`), mas não bloqueia o marco inicial.

## Tech Stack

**Core:**

- Framework: nenhum — JavaScript vanilla, ESM (`"type": "module"`)
- Language: JavaScript (sem TypeScript — decisão permanente)
- Runtime: Node.js (CI usa Node 22 — planejado)
- Package manager: npm

**Key dependencies:**

- Vitest ^2.0.0 + `@vitest/coverage-v8` (testes/cobertura — únicos configurados hoje)
- JSON Server + `json-server-auth` (mock de API/autenticação — planejado)
- `marked` + `dompurify` (markdown rendering — planejado, feature pós-v1)
- Playwright + `@axe-core/playwright` (E2E/a11y — planejado)

## Scope

**v1 includes:**

- Feed Público (`/`): listagem paginada de posts, skeleton loader, like, acessibilidade AA
- Autenticação via cookie `HttpOnly` (P1 da spec): login/register/logout, `GET /api/me`,
  `injectAuthHeader` em rotas protegidas
- Guard de rota assíncrono para views privadas (P3 da spec de auth)

**Explicitly out of scope (v1):**

- Markdown rendering (feature completa, ver `.specs/features/markdown-rendering/`)
- Backend real (`backend-api/` PRD v0.6.0) — continua usando JSON Server como mock
- Tooling de CI/CD, lint, format, E2E e a11y automatizados (ESLint, Playwright, GitHub
  Actions, husky — todos planejados em `.specs/codebase/CONCERNS.md`)
- Itens P2/P3 das specs existentes: proxy de dev same-origin (P2 auth), preview markdown
  no card (P2), GFM/syntax highlighting (P3)
- Refresh token, rotação de segredos, blacklist de JWT

## Constraints

- Timeline: sem prazo fixo — ritmo incremental por sessão
- Technical: vanilla JS only (sem framework/bundler), `MUST NOT` usar `innerHTML` com
  variáveis (ver `.specs/codebase/CONVENTIONS.md § Hard Constraints`)
- Natureza do projeto: produção real + estudo — práticas e arquitetura seguem padrões de
  repositórios big tech, mesmo em escala de laboratório
