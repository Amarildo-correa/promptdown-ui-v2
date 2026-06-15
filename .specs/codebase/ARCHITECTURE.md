# Architecture

**Pattern:** SPA modular vanilla JS (feature/layer-based) — **decidido, não implementado**. O código atual contém apenas uma função utilitária isolada (`public/js/lib/truncate.js`) e seu teste.

## High-Level Structure

```
public/js/
├── components/   ← funções (props) → nó DOM            [planejado]
├── views/         ← orquestram componentes + api.js      [planejado]
├── lib/           ← utilitários puros                     [truncate.js existe; demais planejados]
├── router.js       ← History API router                   [planejado]
├── app.js          ← bootstrap, registra rotas             [planejado]
├── store.js        ← Proxy + pub/sub                       [planejado]
public/css/         ← tokens + componentes                  [planejado — docs/DESIGN.md é a fonte]
api/
├── server.js        ← JSON Server bootstrap                [planejado]
├── middleware/       ← sanitize, delay, cookie-auth         [planejado]
└── database.json     ← persistência em arquivo              [planejado]
api/openapi.yaml      ← contrato OpenAPI 3.0.3 (REAL, existe)
```

## Identified Patterns

### Utility function (lib puro)

**Location:** `public/js/lib/`
**Purpose:** Funções puras testáveis isoladamente, sem dependência de DOM ou estado global.
**Implementation:** Função exportada com JSDoc de tipos, sem efeitos colaterais.
**Example:** `public/js/lib/truncate.js` — `truncate(text, maxLength)`, testada em `tests/unit/truncate.test.js`.

### Component Pattern — Template-cloning factory components (planejado)

**Location:** `public/js/components/` (não existe ainda)
**Purpose:** Componente = função `(props) => DOM node`, sem framework.
**Implementation:** `document.createElement("template")` uma vez no módulo; cada chamada usa `document.importNode(template.content, true)`; dados via `.textContent`; eventos via `addEventListener` antes de inserir no DOM.
**Status:** decidido, não implementado. `MUST NOT` usar `innerHTML` com variáveis nem `cloneNode`.

### Roteamento — History API router (planejado)

**Location:** `public/js/router.js` (não existe ainda)
**Purpose:** Navegação client-side sem reload, com lazy loading de views.
**Implementation:** `route(path, loader)` registra `{ pattern, loader }`; `navigate(path)` chama `pushState` + `resolve()`; `resolve()` casa a URL atual contra os patterns e chama `loader()` (import dinâmico estático — `MUST NOT` usar template strings em `import()`); listener global de clique intercepta `<a>` internos.
**Status:** decidido, não implementado. `MUST NOT` usar hash routing.

### State Management — Proxy + pub/sub (planejado)

**Location:** `public/js/store.js` (não existe ainda)
**Purpose:** Estado global reativo sem biblioteca externa.
**Implementation:** `state` é um `Proxy` cujo `set` trap chama `notifySubscribers`; `subscribe(selector, cb)` registra callbacks por chave (ou `"*"`); `getSnapshot()` retorna `structuredClone(state)`.
**Status:** decidido, não implementado. `MUST NOT` usar Redux/Zustand/MobX.

### View Lifecycle e Cleanup (planejado)

**Location:** `public/js/views/*.js` (não existe ainda)
**Purpose:** Evitar memory leaks de subscriptions ativas em views descartadas.
**Implementation:** Toda view exportada `MUST` retornar `{ destroy: Function }` ou `null`; acumula unsubscribes de `subscribe()` em array local; router chama `activeView?.destroy?.()` antes de montar a próxima view.
**Status:** decidido, não implementado.

### Error Handling Global (planejado)

**Location:** `public/js/app.js` (não existe ainda)
**Purpose:** Capturar erros não tratados e exibir feedback visual.
**Implementation:** Listeners de `unhandledrejection` e `error` registrados antes de qualquer rota; `showErrorToast(message)` cria elemento com `role="alert"` e `aria-live="assertive"`; `MUST NOT` usar `alert()`.
**Status:** decidido, não implementado.

### Lazy Loading de Rotas (planejado)

**Location:** `public/js/router.js` + `public/js/lib/skeleton.js` (não existem ainda)
**Purpose:** Code-splitting nativo via `import()` dinâmico, com skeleton antes de qualquer `await`.
**Implementation:** `showSkeleton(app)` chamado antes do `await loader()` e do `await` de dados da API; fallback de erro em `catch` do `import()`.
**Status:** decidido, não implementado.

## Data Flow

### Segurança XSS — pipeline de dados

```
Form (client) → sanitizeText() [lib/sanitize.js] → fetch (credentials: include)
    → sanitizeMiddleware [api/middleware/sanitize.js] → JSON Server (persistência)
    → GET /posts → PostCard / MarkdownRenderer → .textContent ou policy Trusted Types
```

- Client-side: `sanitizeText()` + `validateLength()` antes de qualquer `fetch` — defesa em profundidade, não substitui validação server-side.
- Server-side: `sanitizeMiddleware` intercepta POST/PUT/PATCH, sobrescreve `req.body[field]` in-place, retorna `422 { errors }` em caso de violação.
- Saída: `MUST NOT` usar `innerHTML` com variáveis, exceto via policy Trusted Types `'md-renderer'` (ver `.specs/features/markdown-rendering/design.md`).
- **Status:** todo o pipeline acima é decidido, não implementado — nenhum arquivo citado existe além de `api/openapi.yaml` (contrato).

### Autenticação — fluxo (modelo atual)

Ver `.specs/features/auth-cookie-httponly/design.md` para o fluxo completo (cookie `HttpOnly` + proxy de dev + `injectAuthHeader`/`handleAuthCookies`). Este é o modelo de referência atual — substitui qualquer menção a `sessionStorage`/`localStorage` para token.

## Code Organization

**Approach:** feature/layer-based — `components/` (UI), `views/` (orquestração + rotas), `lib/` (utilitários puros), `store.js` (estado), `router.js`/`app.js` (bootstrap). Backend separado em `api/` com `server.js` + `middleware/`.

**Structure:** ver `.specs/codebase/STRUCTURE.md` para o mapeamento completo de "onde as coisas vivem".

**Module boundaries:** componentes não acessam estado global diretamente (recebem via parâmetro); views orquestram `api.js` + `store.js` + componentes; `lib/` não depende de DOM nem de `store.js`.
