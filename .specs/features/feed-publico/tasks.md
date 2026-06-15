# tasks.md — Feed Público

> Fonte: `notes/ssd-exemplo-feed.md`
> Spec: `.specs/features/feed-publico/spec.md`
> Design: `.specs/features/feed-publico/design.md`

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
| 9     | 8       | 0           | 1    | 0       |

---

## T01 — Contrato OpenAPI: `GET /posts` e `PATCH /posts/:id`

**Status:** `[x] done`

| Campo          | Valor                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| **What**       | Adicionar/verificar entradas `GET /posts` e `PATCH /posts/:id` em `docs/api/openapi.yaml`    |
| **Where**      | `docs/api/openapi.yaml`                                                                      |
| **Depends on** | —                                                                                            |
| **Reuses**     | Schema `Post` já definido no arquivo (se existir)                                            |
| **Done when**  | `npm run lint:api` passa sem erros; endpoints documentados com params, responses 200/401/422 |
| **Tests**      | `npm run lint:api`                                                                           |
| **Gate**       | `npm run lint:api` — zero erros do Spectral                                                  |

**Rastreabilidade:** FP-001, FP-008 (contratos de API referenciados em `spec.md`)

---

## T02 — `lib/truncate.js` com testes unitários `[P]`

**Status:** `[x] done`

| Campo          | Valor                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------ |
| **What**       | Implementar `truncate(text, maxLength)` preservando fronteira de palavra; adicionar suite Vitest |
| **Where**      | `public/js/lib/truncate.js`, `tests/unit/truncate.test.js`                                       |
| **Depends on** | —                                                                                                |
| **Reuses**     | Padrão de test de `tests/unit/sanitize.test.js` (ADR § Tooling)                                  |
| **Done when**  | Retorna string ≤ `maxLength` chars terminada em `…` se truncada; não corta palavras no meio      |
| **Tests**      | `npm run test -- truncate`                                                                       |
| **Gate**       | `npm run test:coverage` mostra ≥ 80% em `lib/truncate.js`                                        |

**Rastreabilidade:** FP-004, FP-NF06

---

## T03 — `lib/date.js` com testes unitários `[P]`

**Status:** `[ ] pending`

| Campo          | Valor                                                                               |
| -------------- | ----------------------------------------------------------------------------------- |
| **What**       | Implementar `formatDate(isoString)` retornando string pt-BR; adicionar suite Vitest |
| **Where**      | `public/js/lib/date.js`, `tests/unit/date.test.js`                                  |
| **Depends on** | —                                                                                   |
| **Reuses**     | Padrão de test de `tests/unit/sanitize.test.js` (ADR § Tooling)                     |
| **Done when**  | `formatDate("2026-06-11T00:00:00Z")` retorna `"11 de junho de 2026"`                |
| **Tests**      | `npm run test -- date`                                                              |
| **Gate**       | `npm run test:coverage` mostra ≥ 80% em `lib/date.js`                               |

**Rastreabilidade:** FP-005, FP-NF06

---

## T04 — `api.js`: funções `getPosts()` e `likePost(id)` `[P]`

**Status:** `[ ] pending`

| Campo          | Valor                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| **What**       | Adicionar `getPosts({ page, limit })` e `likePost(id)` à camada HTTP                                          |
| **Where**      | `public/js/api.js`                                                                                            |
| **Depends on** | T01                                                                                                           |
| **Reuses**     | Helper `authHeaders()` já existente em `api.js` (ADR § Autenticação)                                          |
| **Done when**  | `getPosts()` faz `GET /posts?_page=1&_limit=20`; `likePost` faz `PATCH /posts/:id` com header `Authorization` |
| **Tests**      | Teste manual via `npm run mock:api` + `fetch` no console                                                      |
| **Gate**       | `npm run lint` passa; funções exportadas verificáveis via DevTools Network                                    |

**Rastreabilidade:** FP-001, FP-008

---

## T05 — Componente `PostCard` atualizado

**Status:** `[ ] pending`

| Campo          | Valor                                                                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**       | Atualizar `PostCard` para usar `truncate.js`, `date.js` e handler `onLike` com guard de auth                                                                               |
| **Where**      | `public/js/components/PostCard.js`                                                                                                                                         |
| **Depends on** | T02, T03                                                                                                                                                                   |
| **Reuses**     | Template-cloning factory pattern do ADR; `isAuthenticated()` de `lib/auth.js`; `navigate()` de `router.js`                                                                 |
| **Done when**  | Título truncado a 120 chars; data em pt-BR com atributo `datetime`; clique em like redireciona para `/login` se não autenticado; `MUST NOT` usar `innerHTML` com variáveis |
| **Tests**      | Teste visual manual; `npm run lint`                                                                                                                                        |
| **Gate**       | `npm run lint` passa; inspetor DOM não mostra `innerHTML` com dado dinâmico                                                                                                |

**Rastreabilidade:** FP-003, FP-004, FP-005, FP-006, FP-007

---

## T06 — View `FeedView` com skeleton, paginação e lifecycle

**Status:** `[ ] pending`

| Campo          | Valor                                                                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**       | Implementar `FeedView` com skeleton antes do `await`, loop de `PostCard`, tratamento de erro e retorno `{ destroy }`                                                       |
| **Where**      | `public/js/views/feed.js`                                                                                                                                                  |
| **Depends on** | T04, T05                                                                                                                                                                   |
| **Reuses**     | `showSkeleton()` de `lib/skeleton.js`; padrão `unsubs` de `store.js`; `showErrorToast()` de `app.js`                                                                       |
| **Done when**  | Skeleton aparece imediatamente; lista de posts renderiza após API responder; erro exibe `<p class="error">`; `destroy()` limpa subscriptions (verificar via Heap Snapshot) |
| **Tests**      | `npm run test:e2e -- feed`; Heap Snapshot manual (DevTools → Memory)                                                                                                       |
| **Gate**       | `npm run test:e2e -- feed` passa; Network tab mostra `GET /posts?_page=1&_limit=20`                                                                                        |

**Rastreabilidade:** FP-001, FP-002, FP-009, FP-010, FP-011, FP-012

---

## T07 — CSS do feed `[P]`

**Status:** `[ ] pending`

| Campo          | Valor                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| **What**       | Criar `public/css/components/feed.css` com estilos de `.feed-list` e `.post-card`                          |
| **Where**      | `public/css/components/feed.css`                                                                           |
| **Depends on** | T05                                                                                                        |
| **Reuses**     | Tokens de `public/css/tokens.css`; convenção `rem`; proibições do ADR (sem `border-radius`, `px` em fonte) |
| **Done when**  | Visual coerente com design system; sem valores CSS hardcoded; `min-height: 1.5rem` no botão like           |
| **Tests**      | Inspeção visual em dark e light theme; `prefers-reduced-motion` verificado                                 |
| **Gate**       | `npm run lint` passa; nenhum valor CSS hardcoded encontrado em `feed.css`                                  |

**Rastreabilidade:** FP-NF02, FP-NF03, FP-NF04

---

## T08 — Testes E2E do feed

**Status:** `[ ] pending`

| Campo          | Valor                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| **What**       | Adicionar testes Playwright cobrindo: lista visível, clique abre detalhe, like redireciona não autenticado    |
| **Where**      | `tests/e2e/feed.spec.js`                                                                                      |
| **Depends on** | T06                                                                                                           |
| **Reuses**     | Estrutura de `tests/e2e/feed.spec.js` existente (ADR § Playwright)                                            |
| **Done when**  | 3 cenários passando: feed exibe posts, clique navega para `/post/:id`, like não autenticado vai para `/login` |
| **Tests**      | `npm run test:e2e -- feed`                                                                                    |
| **Gate**       | `npm run test:e2e -- feed` — todos os testes verdes                                                           |

**Rastreabilidade:** FP-001, FP-003, FP-007

---

## T09 — Testes de acessibilidade `[P]`

**Status:** `[ ] pending`

| Campo          | Valor                                                                            |
| -------------- | -------------------------------------------------------------------------------- |
| **What**       | Adicionar rota `/` em `tests/a11y/routes.spec.js` e verificar zero violações axe |
| **Where**      | `tests/a11y/routes.spec.js`                                                      |
| **Depends on** | T06                                                                              |
| **Reuses**     | Padrão `AxeBuilder` de `tests/a11y/routes.spec.js` (ADR § Playwright + axe-core) |
| **Done when**  | `results.violations` é array vazio para a rota `/`                               |
| **Tests**      | `npm run test:a11y`                                                              |
| **Gate**       | `npm run test:a11y` — zero violações WCAG 2.2 AA                                 |

**Rastreabilidade:** FP-NF01, FP-NF02

---

## Diagrama de dependências

```
T01 ──────────────────────────────────────────────┐
T02 ──────────────────┐                           │
T03 ──────────────────┤                           │
                      ▼                           ▼
                     T05 ──────┐         T04 ────┤
                                ▼                 ▼
                               T06 ──────────────┤
                     T07 ──────┘
                                ├── T08
                                └── T09
```

**Paralelismo no início:** T01, T02, T03 rodam juntos (sem dependências entre si).
**Gargalo central:** T06 só inicia após T04 e T05.
**Paralelismo no fim:** T07, T08 e T09 iniciam após T06 (T07 pode iniciar após T05).

---

## Gate final (CI completo)

Executar após T08 e T09 concluídos:

```bash
npm run lint:api && npm run lint && npm run test:coverage && npm run test:e2e && npm run test:a11y
```

`MUST NOT` fazer merge sem CI verde (ADR § CI/CD Pipeline).
