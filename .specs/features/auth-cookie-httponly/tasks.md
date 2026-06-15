# tasks.md — Autenticação via Cookie HttpOnly

**Design**: `.specs/features/auth-cookie-httponly/design.md`
**Status**: Draft

---

## Legenda

- `[ ] pending` — não iniciado
- `[~] in_progress` — em andamento
- `[x] done` — concluído e gate passou
- `[!] blocked` — bloqueado (detalhar abaixo da tarefa)
- `[P]` — pode iniciar em paralelo com a tarefa anterior

---

## Status geral

| Total | Pending | In progress | Done | Blocked |
| ----- | ------- | ----------- | ---- | ------- |
| 8     | 8       | 0           | 0    | 0       |

---

## T01 — Dependências, `bs-config.js` e script `serve` `[P]`

**Status:** `[ ] pending`

| Campo          | Valor                                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| **What**       | Instalar `json-server-auth`, `cookie`, `jsonwebtoken` (deps) e `http-proxy-middleware` (devDep); criar `bs-config.js`; atualizar script `serve` em `package.json` |
| **Where**      | `package.json`, `bs-config.js` (novo)                                                                              |
| **Depends on** | —                                                                                                                  |
| **Reuses**     | —                                                                                                                  |
| **Done when**  | `npm install` instala as 4 deps; `bs-config.js` exporta config com proxy `/api` → `http://localhost:3001`; `npm run serve` usa `--config bs-config.js` |
| **Tests**      | none                                                                                                                |
| **Gate**       | `npm run serve` inicia sem erro e serve `public/` na porta 5173                                                   |

**Rastreabilidade:** AUTH-05

---

## T02 — `api/database.json`: coleção `users` `[P]`

**Status:** `[ ] pending`

| Campo          | Valor                                                                |
| -------------- | ----------------------------------------------------------------------- |
| **What**       | Adicionar coleção `users: []` ao `api/database.json` (criar arquivo se não existir, mantendo `posts`) |
| **Where**      | `api/database.json`                                                  |
| **Depends on** | —                                                                     |
| **Reuses**     | Estrutura atual de `api/database.json` (coleção `posts`)             |
| **Done when**  | `api/database.json` contém `{ "users": [], "posts": [...] }` válido  |
| **Tests**      | none                                                                  |
| **Gate**       | `node -e "JSON.parse(require('fs').readFileSync('api/database.json'))"` não lança erro |

**Rastreabilidade:** AUTH-01 (pré-requisito de `json-server-auth`)

---

## T03 — `api/middleware/cookie-auth.js` com testes unitários

**Status:** `[ ] pending`

| Campo          | Valor                                                                                                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**       | Implementar `injectAuthHeader` e `handleAuthCookies` conforme `design.md` (seção "Components → api/middleware/cookie-auth.js"); adicionar suite Vitest com mocks de `req`/`res`     |
| **Where**      | `api/middleware/cookie-auth.js`, `tests/unit/cookie-auth.test.js`                                                                                                                    |
| **Depends on** | T01 (deps `cookie`, `jsonwebtoken`)                                                                                                                                                  |
| **Reuses**     | Padrão de testes Vitest já usado no projeto (`npm run test`)                                                                                                                         |
| **Done when**  | `injectAuthHeader` popula `req.headers.authorization` a partir do cookie `jsa_token`, e não faz nada se o cookie ausente; `handleAuthCookies` trata `/me` (200 com user válido / 401 sem cookie ou JWT inválido), `/logout` (Set-Cookie com `Max-Age=0`), e `/login`+`/register` (Set-Cookie HttpOnly com o `accessToken`, body sem `accessToken`); `tests/unit/cookie-auth.test.js` define `process.env.JWT_SECRET` (ex: via `vi.stubEnv` ou setup file) **antes** de importar o módulo — `cookie-auth.js` lança `Error` no import se a env var estiver ausente (ver `design.md`) |
| **Tests**      | unit                                                                                                                                                                                  |
| **Gate**       | `npm run test -- cookie-auth` — todos os testes verdes                                                                                                                              |

**Rastreabilidade:** AUTH-01, AUTH-02, AUTH-03, AUTH-04

---

## T04 — `api/server.js`: montagem da cadeia de middlewares

**Status:** `[ ] pending`

| Campo          | Valor                                                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **What**       | Criar/atualizar `api/server.js` com a ordem de middlewares definida em `design.md`: `defaults → bodyParser → delay → db → injectAuthHeader → auth → handleAuthCookies → sanitize → router` |
| **Where**      | `api/server.js`                                                                                                                      |
| **Depends on** | T02, T03                                                                                                                            |
| **Reuses**     | `sanitizeMiddleware` (`api/middleware/sanitize.js`), `delayMiddleware` (`api/middleware/delay.js`) — se não existirem, criar como no-op mínimos documentados no ADR original |
| **Done when**  | `node api/server.js` inicia em `:3001`; `POST /api/register` retorna `Set-Cookie: jsa_token=...; HttpOnly; SameSite=Lax` e body `{ user }` sem `accessToken`; `GET /api/me` com o cookie retorna `200 { user }`; sem cookie retorna `401`; `POST /api/logout` expira o cookie |
| **Tests**      | none (cobertura unitária já em T03; este task é integração manual)                                                                  |
| **Gate**       | Fluxo `curl` do "Independent Test" de AUTH-01 (spec.md P1) executado manualmente com sucesso                                       |

**Verify:**

```bash
node api/server.js &
curl -i -c cookies.txt -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" -d '{"email":"a@b.com","password":"12345678"}'
# Esperado: Set-Cookie: jsa_token=...; HttpOnly; SameSite=Lax; Path=/
# Body: {"user":{"id":...,"email":"a@b.com"}}  (sem accessToken)

curl -i -b cookies.txt http://localhost:3001/me
# Esperado: 200 {"user":{...}}

curl -i -b cookies.txt -X POST http://localhost:3001/logout
curl -i -b cookies.txt http://localhost:3001/me
# Esperado: 401
```

**Rastreabilidade:** AUTH-01, AUTH-02, AUTH-03, AUTH-04

---

## T05 — `docs/api/openapi.yaml`: `/me`, `/logout` e `AuthResponse` `[P]`

**Status:** `[ ] pending`

| Campo          | Valor                                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **What**       | Adicionar paths `/me` (GET) e `/logout` (POST) e atualizar schema `AuthResponse` para remover `accessToken`, conforme `design.md` (Data Models) |
| **Where**      | `docs/api/openapi.yaml`                                                                                                                     |
| **Depends on** | —                                                                                                                                            |
| **Reuses**     | Schema `AuthPayload` existente (sem alteração)                                                                                              |
| **Done when**  | `/me` documenta respostas `200 AuthResponse` e `401`; `/logout` documenta `200`; `AuthResponse` tem apenas `{ user: { id, email } }`        |
| **Tests**      | none                                                                                                                                          |
| **Gate**       | `npm run lint:api` (se existir) sem erros; caso não exista o script, validar YAML com `node -e "require('yaml').parse(require('fs').readFileSync('docs/api/openapi.yaml','utf8'))"` |

**Rastreabilidade:** AUTH-01, AUTH-02, AUTH-04

---

## T06 — `public/js/lib/auth.js`: `fetchCurrentUser` / `isAuthenticated` `[P]`

**Status:** `[ ] pending`

| Campo          | Valor                                                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **What**       | Substituir a implementação baseada em `sessionStorage` por `fetchCurrentUser()` e `isAuthenticated()` assíncronos via `GET /api/me`, conforme `design.md` |
| **Where**      | `public/js/lib/auth.js`, `tests/unit/auth.test.js`                                                                            |
| **Depends on** | —                                                                                                                              |
| **Reuses**     | Nenhum — `getToken`/`setToken`/`clearToken` são removidos                                                                     |
| **Done when**  | `fetchCurrentUser()` retorna `user` quando `fetch("/api/me")` responde `200`, e `null` quando responde `401`; `isAuthenticated()` reflete o mesmo |
| **Tests**      | unit (mockar `global.fetch`)                                                                                                  |
| **Gate**       | `npm run test -- auth` — todos os testes verdes                                                                               |

**Rastreabilidade:** AUTH-06

---

## T07 — `public/js/api.js`: `login`, `register`, `logout` com `credentials: "include"` `[P]`

**Status:** `[ ] pending`

| Campo          | Valor                                                                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**       | Reescrever `login()`/`register()` para retornar apenas `{ user }`, adicionar `logout()`, remover `authHeaders()`, e adicionar `credentials: "include"` em chamadas autenticadas (ex: `createPost`) |
| **Where**      | `public/js/api.js`, `tests/unit/api.test.js`                                                                                                  |
| **Depends on** | —                                                                                                                                               |
| **Reuses**     | Estrutura existente de `api.js` (demais funções `GET`/`PATCH` não relacionadas a auth permanecem)                                              |
| **Done when**  | `login`/`register` lançam erro em `!res.ok` e retornam `{ user }`; `logout()` faz `POST /api/logout`; toda chamada autenticada inclui `credentials: "include"` e nenhuma usa `authHeaders` |
| **Tests**      | unit (mockar `global.fetch`)                                                                                                                  |
| **Gate**       | `npm run test -- api` — todos os testes verdes                                                                                                |

**Rastreabilidade:** AUTH-01, AUTH-04

---

## T08 — `public/js/app.js`: `requireAuth()` assíncrono e guard em views privadas

**Status:** `[ ] pending`

| Campo          | Valor                                                                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**       | Tornar `requireAuth()` `async`, usando `isAuthenticated()` de `lib/auth.js`; atualizar a(s) view(s) privada(s) existente(s) para `await requireAuth()` |
| **Where**      | `public/js/app.js`, view(s) privada(s) existente(s) (ex: `public/js/views/new-post.js`), `tests/unit/app.test.js`                              |
| **Depends on** | T06                                                                                                                                             |
| **Reuses**     | `navigate()` de `router.js`; estrutura de rotas existente                                                                                      |
| **Done when**  | `requireAuth()` retorna `Promise<boolean>`; quando `isAuthenticated()` resolve `false`, chama `navigate('/login')` e retorna `false`; views privadas usam `if (!(await requireAuth())) return null;` |
| **Tests**      | unit (mockar `isAuthenticated` e `navigate`)                                                                                                   |
| **Gate**       | `npm run test -- app` — todos os testes verdes                                                                                                 |

**Rastreabilidade:** AUTH-07

---

## Diagrama de dependências

```
T01 ──┐
T02 ──┼──→ T04
T03 ──┘
T05 [P] ─────────────────────────
T06 ──→ T08
T07 [P] ─────────────────────────
```

**Paralelismo no início:** T01, T02, T05, T06, T07 não têm dependências entre si.
**T03** depende de T01 (deps `cookie`/`jsonwebtoken` instaladas).
**T04** (integração do servidor) só inicia após T02 e T03.
**T08** depende de T06 (precisa de `isAuthenticated()` novo).

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows           | Status   |
| ---- | ------------------------ | ------------------------ | -------- |
| T01  | —                         | —                         | ✅ Match |
| T02  | —                         | —                         | ✅ Match |
| T03  | T01                       | T01 → T03                 | ✅ Match |
| T04  | T02, T03                  | T02 → T04, T03 → T04      | ✅ Match |
| T05  | —                         | —                         | ✅ Match |
| T06  | —                         | —                         | ✅ Match |
| T07  | —                         | —                         | ✅ Match |
| T08  | T06                       | T06 → T08                 | ✅ Match |

---

## Test Co-location Validation

> Não existe `.specs/codebase/TESTING.md` neste projeto. A matriz abaixo segue
> o padrão já em uso (`npm run test` / Vitest) observado em
> `.specs/features/feed-publico/tasks.md`. Camadas de `lib/` e `api.js`
> recebem testes unitários; integração de servidor (`api/server.js`) é
> verificada manualmente via `curl` (T04), pois o projeto não tem harness de
> integração HTTP configurado.

| Task | Code Layer Created/Modified         | Matrix Requires (convenção do projeto) | Task Says | Status |
| ---- | -------------------------------------- | ----------------------------------------- | --------- | ------ |
| T01  | Config (`bs-config.js`, `package.json`) | none                                        | none      | ✅ OK  |
| T02  | Config (`api/database.json`)            | none                                        | none      | ✅ OK  |
| T03  | `api/middleware/cookie-auth.js`         | unit (lib-like, lógica pura)               | unit      | ✅ OK  |
| T04  | `api/server.js` (composição/integração) | manual (sem harness de integração)         | none + verify manual | ✅ OK  |
| T05  | Documentação (`openapi.yaml`)           | none                                        | none      | ✅ OK  |
| T06  | `public/js/lib/auth.js`                  | unit                                        | unit      | ✅ OK  |
| T07  | `public/js/api.js`                       | unit                                        | unit      | ✅ OK  |
| T08  | `public/js/app.js`                       | unit                                        | unit      | ✅ OK  |

---

## Gate final

Executar após T01–T08 concluídos:

```bash
npm run test:coverage
```

mais o fluxo manual de T04 (curl) e a verificação visual de T01/T05 descritas
acima. `MUST NOT` considerar a feature concluída sem o gate final verde.
