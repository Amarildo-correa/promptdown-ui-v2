# design.md — Feed Público

> Fonte: `notes/ssd-exemplo-feed.md`
> Convenções: `CLAUDE.md` § Restrições Absolutas + `.specs/codebase/ARCHITECTURE.md`
> Requisitos: ver `spec.md` nesta pasta

---

## Decisões arquiteturais

Todas seguem os padrões registrados em `.specs/codebase/ARCHITECTURE.md` (Identified Patterns):

| Decisão                                            | Referência                                                                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Componente `PostCard` usa template-cloning factory | `.specs/codebase/ARCHITECTURE.md#component-pattern--template-cloning-factory-components-planejado` — `document.importNode`, e `.specs/codebase/CONVENTIONS.md` § Hard Constraints (`MUST NOT` `innerHTML` com variáveis nem `cloneNode`) |
| View retorna `{ destroy() }` com unsubscribe       | `.specs/codebase/ARCHITECTURE.md#view-lifecycle-e-cleanup-planejado` — memory leak progressivo por rota                |
| Skeleton exibido **antes** de qualquer `await`     | `.specs/codebase/ARCHITECTURE.md#lazy-loading-de-rotas-planejado` — `MUST` chamar `showSkeleton(app)` antes do `await` |
| Like de usuário não autenticado → `/login`         | `.specs/codebase/ARCHITECTURE.md#autenticação--fluxo-modelo-atual` → `.specs/features/auth-cookie-httponly/design.md` — `MUST` redirecionar para `/login` se `isAuthenticated()` retornar `false` |
| Erros exibidos com `role="alert"`                  | `.specs/codebase/ARCHITECTURE.md#error-handling-global-planejado` — `MUST NOT` deixar erro silencioso                  |
| `document.title` atualizado no handler da rota     | `.specs/codebase/ARCHITECTURE.md#roteamento--history-api-router-planejado` — `MUST` atualizar `document.title` a cada navegação |

---

## Mapa de componentes

```
FeedView (views/feed.js)
├── showSkeleton(app)          ← lib/skeleton.js (antes do await)
├── getPosts()                 ← api.js → GET /posts
├── PostCard(post, { onLike }) ← components/PostCard.js
│   ├── truncate(title, 120)   ← lib/truncate.js
│   ├── formatDate(createdAt)  ← lib/date.js
│   └── onLike handler
│       ├── isAuthenticated()  ← lib/auth.js
│       ├── navigate('/login') ← router.js (se não autenticado)
│       └── likePost(id)       ← api.js → PATCH /posts/:id
└── { destroy() }              ← cancela subscriptions do store
```

---

## Contrato da View

```js
/**
 * @param {Element} container — elemento #app
 * @returns {Promise<{ destroy: Function }>}
 */
export async function FeedView(container) { ... }
```

**Pré-condições:**

- `container` é o elemento `#app` existente no DOM
- `showSkeleton` deve ser chamado **antes** de qualquer `await`
- A rota `/` registra `document.title = "Feed — Promptdown"` antes de chamar `FeedView`

**Pós-condições:**

- Container contém `<ul class="feed-list">` com `<li>` por post, ou `<p class="error">` em falha
- Retorna objeto `{ destroy }` que cancela todas as subscriptions

---

## Contrato do componente `PostCard`

```js
/**
 * @param {{ id: number, title: string, body: string, user: object,
 *           likes: number, createdAt: string }} post
 * @param {{ onLike: (id: number) => void }} handlers
 * @returns {DocumentFragment}
 */
export function PostCard(post, { onLike } = {}) { ... }
```

**Regras:**

- `MUST` usar `document.importNode(template.content, true)` — `MUST NOT` usar `cloneNode`
- `MUST` usar `.textContent` para todos os dados dinâmicos
- `MUST` adicionar `addEventListener` antes de inserir no DOM
- `MUST` truncar título a 120 chars via `truncate.js` (→ FP-004)
- `MUST` formatar data via `date.js` e setar atributo `datetime` (→ FP-005)

---

## Modelo de dados

```js
// Estrutura de post conforme docs/api/openapi.yaml #/components/schemas/Post
{
  id: number,          // integer
  title: string,       // minLength: 3, maxLength: 120
  body: string,        // minLength: 10, maxLength: 5000
  userId: number,      // integer — referência ao autor
  user: {              // expandido via _expand=user ou join manual
    id: number,
    name: string,
    username: string
  },
  likes: number,       // integer, minimum: 0
  createdAt: string    // format: date-time (ISO 8601)
}
```

---

## Fluxo de interação — Like

```
Usuário clica em "Like"
    │
    ├─ isAuthenticated() === false
    │       └─ navigate('/login')       [→ FP-007]
    │
    └─ isAuthenticated() === true
            ├─ likePost(id)             PATCH /posts/:id { likes: n+1 }
            ├─ Resposta 200 → atualizar contador no DOM via .textContent  [→ FP-008]
            └─ Resposta erro → showErrorToast(message)                    [→ FP-009]
```

---

## CSS — escopo da feature

Arquivo: `public/css/components/feed.css`

**Regras derivadas de `CLAUDE.md` § Restrições Absolutas (CSS):**

- `MUST` usar apenas `var(--token)` — sem valores hardcoded (→ FP-NF04)
- `MUST NOT` usar `border-radius`, `box-shadow`, `text-shadow`, gradientes
- `MUST` usar `rem` para tamanho de fonte e espaçamento
- `MUST NOT` usar `px` em fonte ou espaçamento (exceto `border: 1px`)
- `MUST` respeitar `prefers-reduced-motion` em qualquer animação (→ FP-NF03)
- `MUST` garantir área clicável ≥ 24×24 px no botão de like (→ FP-NF02)

```css
/* public/css/components/feed.css */
.feed-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    max-width: var(--content-width);
    margin-inline: auto;
}

.post-card {
    padding: var(--space-4);
    border: var(--border);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
}

.post-card__title {
    font-size: var(--text-lg);
    color: var(--color-heading);
    margin: 0;
}

.post-card__author {
    font-size: var(--text-sm);
    color: var(--color-muted);
}

.post-card__body {
    font-size: var(--text-base);
    color: var(--color-text);
    margin: 0;
}

.post-card__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
}

.post-card__date {
    font-size: var(--text-xs);
    color: var(--color-subtle);
}

.post-card__like {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-sm);
    color: var(--color-accent);
    background: transparent;
    border: 1px solid var(--color-accent);
    cursor: pointer;
    min-width: 2.5rem;
    min-height: 1.5rem; /* ≥24px — WCAG 2.5.8 → FP-NF02 */
}
```

---

## Rastreabilidade design → spec

| Decisão de design                            | Requisito(s) satisfeitos |
| -------------------------------------------- | ------------------------ |
| `showSkeleton` antes do `await`              | FP-002                   |
| `PostCard` com template-cloning              | FP-003                   |
| `truncate.js` no título                      | FP-004                   |
| `date.js` + atributo `datetime`              | FP-005                   |
| `isAuthenticated()` guard no like            | FP-007                   |
| `likePost` + `.textContent` no contador      | FP-008                   |
| `<p class="error">` em falha                 | FP-009                   |
| `unsubs` + `destroy()`                       | FP-010                   |
| `document.title` na rota                     | FP-011                   |
| `#route-announcer` via `announceRouteChange` | FP-012                   |
| `prefers-reduced-motion` no CSS              | FP-NF03                  |
| `var(--token)` no CSS                        | FP-NF04                  |
| `min-height: 1.5rem` no botão like           | FP-NF02                  |
