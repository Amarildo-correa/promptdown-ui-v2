# External Integrations

## API Integrations

### Promptdown API (`api/openapi.yaml`)

**Purpose:** Contrato canônico do feed público — posts paginados e likes.
**Location:** `api/openapi.yaml` (OpenAPI **3.0.3**, `info.version: "1.0.0"`).

> **Drift vs. ADR-0001:** o ADR descreve o contrato em `docs/api/openapi.yaml` com **OpenAPI 3.1.0**.
> O arquivo real está em `api/openapi.yaml` com **OpenAPI 3.0.3**. Esta divergência está registrada
> em CONCERNS.md — `api/openapi.yaml@3.0.3` é a fonte canônica real a partir desta migração.

**Authentication:** `bearerAuth` (HTTP Bearer, JWT) definido em `components.securitySchemes`, usado em `PATCH /posts/{id}`.

**Key endpoints:**

| Endpoint            | Método | Auth | Descrição                                  |
| -------------------- | ------ | ---- | -------------------------------------------- |
| `/posts`             | GET    | não  | Lista paginada de posts (`_page`, `_limit`)  |
| `/posts/{id}`        | PATCH  | sim (`bearerAuth`) | Atualiza campos do post (ex.: `likes`) |

**Schemas:** `Post`, `PostPatch`, `ServerError`, `UnauthorizedError`, `ValidationError` — todos em `api/openapi.yaml#/components/schemas`.

**Validation:** `.spectral.yaml` define `extends: spectral:oas` — ruleset padrão do Spectral. Script `lint:api` **não existe** em `package.json` (gap — ver CONCERNS.md).

**Server implementation:** `api/server.js`, `api/database.json`, `api/middleware/*` — **decidido, não implementado**. Nenhum servidor real roda este contrato ainda.

## Authentication

**Modelo atual:** cookie `HttpOnly; SameSite=Lax; Path=/` via `json-server-auth` + middleware fino de tradução cookie ↔ `Authorization: Bearer`.

**Fonte canônica:** `.specs/features/auth-cookie-httponly/design.md` — inclui:
- `api/middleware/cookie-auth.js` (`injectAuthHeader`, `handleAuthCookies`)
- `public/js/lib/auth.js` (`fetchCurrentUser`, `isAuthenticated`)
- `public/js/api.js` (`login`, `register`, `logout`, chamadas com `credentials: "include"`)
- `public/js/app.js` (`requireAuth()` guard de rota)
- Proxy de dev: `bs-config.js` (browser-sync + `http-proxy-middleware`), unificando `localhost:5173` e `:3001`

**Status:** Draft — nenhuma parte implementada (`.specs/features/auth-cookie-httponly/tasks.md`: 8 tarefas, 0 concluídas).

**Modelo superseded (NÃO usar):** versão anterior baseada em `sessionStorage`/`localStorage` para o JWT (mencionada no ADR-0001 § Autenticação) — substituída pelo modelo de cookie `HttpOnly` acima. `localStorage`/`sessionStorage` para JWT é proibido (ver CONVENTIONS.md § Hard Constraints).

## Markdown Rendering (biblioteca client-side)

**Service:** `marked` (parser CommonMark) + `dompurify` (>=3.3.3, sanitização) + Trusted Types policy `'md-renderer'`.
**Purpose:** Renderizar `Post.body` (Markdown) como HTML seguro no client.
**Implementation:** `public/js/lib/md-policy.js` + `public/js/components/MarkdownRenderer.js` — **decidido, não implementado** (Status: Draft em `.specs/features/markdown-rendering/design.md`).
**Module resolution:** Import Maps + builds ESM locais em `public/vendor/` (`marked.esm.js`, `purify.es.mjs`) — decisão registrada em `.specs/project/STATE.md` (sem CDN, sem bundler).
**Configuration:** `PURIFY_CONFIG` com `ALLOWED_TAGS` restrito (sem `<script>`, `<style>`, `<iframe>`, `<img>`); `MUST NOT` definir `SAFE_FOR_XML: false` — `true` é o default seguro do DOMPurify (>=3.1.3).

## Webhooks

Nenhum webhook identificado no código ou nas specs.

## Background Jobs

Nenhum job em background identificado. `api/middleware/delay.js` (simulação de latência) é mencionado no ADR mas não implementado.

## Fonts / Static Assets (CDN, planejado)

- Google Fonts (Inter, Roboto Mono) — `docs/DESIGN.md`, não implementado em HTML (sem `public/index.html`).
- Ícones Tabler via `cdn.jsdelivr.net` — `docs/DESIGN.md`, não implementado.
