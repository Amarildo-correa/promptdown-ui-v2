# spec.md — Autenticação via Cookie HttpOnly

> Convenções: `CLAUDE.md` § Restrições Absolutas (`localStorage`/`sessionStorage` para JWT
> proibido) + `.specs/codebase/ARCHITECTURE.md#autenticação--fluxo-modelo-atual`
> Auto-sized: **Large**

---

## Problem Statement

A especificação original de autenticação do laboratório (`json-server-auth` +
JWT em `sessionStorage`) expõe o token a qualquer script executado na página,
ampliando o impacto de uma vulnerabilidade XSS. A decisão do projeto (ver
`CLAUDE.md` § Restrições Absolutas) é mover o JWT para um cookie
`HttpOnly; SameSite=Lax`, eliminando esse vetor sem esperar pelo `backend-api/`
real (PRD v0.6.0). Esta spec implementa essa mudança: middleware de cookie no
`api/server.js`, proxy de dev para unificar origem, e ajustes em `auth.js` /
`api.js` / `app.js` no frontend.

---

## Goals

- [ ] JWT nunca é exposto a JavaScript no cliente — entregue exclusivamente via cookie `HttpOnly`
- [ ] Sessão funciona em dev sem HTTPS, via proxy que unifica `localhost:5173` e `localhost:3001`
- [ ] `isAuthenticated()` / `requireAuth()` continuam protegendo views privadas, agora de forma assíncrona

---

## Out of Scope

| Feature                             | Reason                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Refresh token / rotação de segredos | Fora do escopo de laboratório — fica para `backend-api/` (PRD v0.6.0)                                                    |
| Blacklist de JWTs revogados         | Idem — exige storage server-side persistente                                                                             |
| HTTPS local / `SameSite=None`       | Resolvido pelo proxy (same-origin); não necessário neste laboratório                                                     |
| Telas de login/register (UI)        | Já especificadas em outras features — esta spec cobre apenas a camada de sessão (API + `lib/auth.js` + `api.js` + guard) |

---

## User Stories

### P1: Sessão autenticada via cookie HttpOnly ⭐ MVP

**User Story**: Como usuário do Promptdown, quero fazer login/registro e ter
minha sessão mantida de forma segura, sem que o token JWT fique acessível a
scripts da página.

**Why P1**: É o núcleo da mudança — sem isso, login/register/logout/`/me` não
funcionam com o novo modelo de cookie.

**Acceptance Criteria**:

1. WHEN o usuário faz `POST /api/login` ou `POST /api/register` com credenciais
   válidas THEN o servidor SHALL responder com `Set-Cookie: jsa_token=...;
HttpOnly; SameSite=Lax; Path=/` e o body da resposta SHALL conter apenas
   `{ user }` (sem `accessToken`)
2. WHEN o cookie `jsa_token` está presente e válido THEN `GET /api/me` SHALL
   responder `200 { user }`
3. WHEN o cookie `jsa_token` está ausente ou inválido THEN `GET /api/me` SHALL
   responder `401`
4. WHEN o usuário chama `POST /api/posts` (ou outra rota protegida) com o
   cookie `jsa_token` válido THEN o middleware `injectAuthHeader` SHALL
   popular `Authorization: Bearer <token>` e `json-server-auth` SHALL
   autorizar normalmente
5. WHEN o usuário chama `POST /api/logout` THEN o servidor SHALL responder
   `Set-Cookie: jsa_token=; Max-Age=0` e requisições subsequentes a `/api/me`
   SHALL retornar `401`

**Independent Test**: Com `api/server.js` rodando, fazer login via `curl -i`,
inspecionar o header `Set-Cookie` (flags `HttpOnly`/`SameSite=Lax`), confirmar
ausência de `accessToken` no body, depois chamar `/api/me` reutilizando o
cookie e `/api/logout` para encerrar.

---

### P2: Proxy de desenvolvimento same-origin

**User Story**: Como desenvolvedor, quero que `localhost:5173` (frontend) e
`localhost:3001` (API) sejam tratados como a mesma origem em dev, para que o
cookie `SameSite=Lax` seja enviado sem precisar de HTTPS local.

**Why P2**: Sem o proxy, o cookie HttpOnly do P1 simplesmente não chega ao
backend em dev (cross-origin) — mas o P1 já é testável via `curl`/Postman
diretamente em `:3001`, por isso fica como P2 e não bloqueia o MVP.

**Acceptance Criteria**:

1. WHEN o dev server inicia via `npm run serve` THEN ele SHALL usar
   `bs-config.js` com proxy de `/api/*` para `http://localhost:3001`
2. WHEN o browser faz `fetch("/api/login", { credentials: "include" })` a
   partir de `localhost:5173` THEN a requisição SHALL chegar a `:3001` via
   proxy e o `Set-Cookie` de resposta SHALL ser aplicado à origem
   `localhost:5173`
3. WHEN o usuário inspeciona DevTools → Application → Cookies após login
   THEN o cookie `jsa_token` SHALL aparecer associado a `localhost` com flag
   `HttpOnly` marcada e SHALL NOT ser legível via `document.cookie` no console

**Independent Test**: Subir `npm run mock:api` (ou `api/server.js`) e
`npm run serve`, fazer login pela UI em `localhost:5173`, confirmar via
DevTools que o cookie está presente e `HttpOnly`.

---

### P3: Guard de rota assíncrono

**User Story**: Como usuário não autenticado, quero ser redirecionado para
`/login` ao tentar acessar uma view privada, mesmo que a verificação de sessão
exija uma chamada de rede.

**Why P3**: Depende de P1 (`/api/me`) e P2 (proxy) estarem funcionando; é a
"última milha" que conecta a nova sessão ao roteamento existente.

**Acceptance Criteria**:

1. WHEN uma view privada chama `await requireAuth()` e `/api/me` retorna `401`
   THEN o router SHALL navegar para `/login` e a view SHALL retornar `null`
2. WHEN `/api/me` retorna `200 { user }` THEN `requireAuth()` SHALL retornar
   `true` e a view SHALL renderizar normalmente
3. WHEN `fetchCurrentUser()` é chamado THEN o resultado SHALL ser armazenado em
   `currentUser` do `store.js` para evitar chamadas repetidas de `/api/me` na
   mesma navegação

**Independent Test**: Sem login, navegar para uma rota privada (ex:
`/new-post`) e confirmar redirecionamento para `/login`; após login, repetir e
confirmar que a view renderiza.

---

## Edge Cases

- WHEN o cookie `jsa_token` expira (após `maxAge` de 24h) THEN `/api/me`
  SHALL responder `401` e `requireAuth()` SHALL redirecionar para `/login`
- WHEN `POST /api/login` recebe credenciais inválidas THEN o servidor SHALL
  responder `400` e SHALL NOT setar `Set-Cookie`
- WHEN `POST /api/logout` é chamado sem sessão ativa (sem cookie) THEN o
  servidor SHALL responder `200 { ok: true }` de forma idempotente
- WHEN o JWT do cookie foi assinado com um `JWT_SECRET` diferente do atual
  (ex: secret rotacionado manualmente) THEN `GET /api/me` SHALL responder
  `401` (verificação `jwt.verify` falha) em vez de lançar erro não tratado
- WHEN uma rota protegida (`json-server-auth`) recebe requisição sem cookie e
  sem header `Authorization` THEN `injectAuthHeader` SHALL apenas chamar
  `next()` sem popular o header, e `json-server-auth` SHALL responder `401`
  normalmente

---

## Requirement Traceability

| Requirement ID | Story                                                     | Phase  | Status  |
| -------------- | --------------------------------------------------------- | ------ | ------- |
| AUTH-01        | P1: Set-Cookie em login/register                          | Design | Pending |
| AUTH-02        | P1: `GET /me`                                             | Design | Pending |
| AUTH-03        | P1: `injectAuthHeader` em rotas protegidas                | Design | Pending |
| AUTH-04        | P1: `POST /logout`                                        | Design | Pending |
| AUTH-05        | P2: `bs-config.js` proxy `/api`                           | Design | Pending |
| AUTH-06        | P3: `fetchCurrentUser` / `isAuthenticated` assíncronos    | Design | Pending |
| AUTH-07        | P3: `requireAuth()` assíncrono + guard nas views privadas | Design | Pending |

**ID format:** `AUTH-NN`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 7 total, 0 mapped to tasks, 7 unmapped ⚠️

---

## Success Criteria

- [ ] `curl` contra `api/server.js` confirma `Set-Cookie: jsa_token=...; HttpOnly; SameSite=Lax` em login/register e ausência de `accessToken` no body
- [ ] `GET /api/me` retorna `200`/`401` corretamente com/sem cookie válido
- [ ] Login pela UI em `localhost:5173` resulta em cookie `HttpOnly` visível no DevTools, sem leitura via `document.cookie`
- [ ] Navegar para view privada sem sessão redireciona para `/login`; com sessão, renderiza
