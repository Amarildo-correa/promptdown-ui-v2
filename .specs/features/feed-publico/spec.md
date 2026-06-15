# spec.md — Feed Público

> Fonte: `notes/ssd-exemplo-feed.md`
> Convenções: `CLAUDE.md` § Restrições Absolutas + `.specs/codebase/CONVENTIONS.md`
> Auto-sized: **Large**

---

## Visão geral

O Feed Público é a rota raiz (`/`) do Promptdown. Exibe uma lista paginada de
posts ordenada por data de criação decrescente. É a primeira tela que qualquer
visitante — autenticado ou não — vê ao acessar a aplicação.

---

## Escopo

**In-scope**

- Listagem de posts via `GET /posts`
- Skeleton loader enquanto a API responde
- Card de post com título, autor, corpo (truncado), data e contador de likes
- Botão de like (visível a todos; ação restrita a usuários autenticados)
- Paginação via parâmetros `_page` e `_limit`
- Acessibilidade WCAG 2.2 AA em toda a view
- Anúncio de rota para screen readers

**Out-of-scope**

- Criação de post (feature separada: `new-post`)
- Filtragem por tag ou autor (fase 2)
- Feed personalizado baseado em follows (fase 3)
- Notificações em tempo real (WebSocket — fora do escopo atual)

---

## Requisitos Funcionais

| ID     | Requisito                                                                                                        | Critério de aceite                                                                   |
| ------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| FP-001 | A view `MUST` buscar posts via `GET /posts?_page=1&_limit=20` ao montar                                          | Network tab mostra a requisição com os parâmetros corretos ao navegar para `/`       |
| FP-002 | A view `MUST` exibir skeleton com 3 cards antes de qualquer `await` de módulo ou dado                            | Skeleton visível entre 0 ms e a resposta da API mesmo com conexão rápida             |
| FP-003 | Cada post `MUST` ser renderizado com `PostCard` retornando `DocumentFragment`                                    | Inspetor DOM não mostra wrapper desnecessário; `innerHTML` não é usado com variáveis |
| FP-004 | O título do post `MUST` ser truncado em 120 caracteres com preservação de fronteira de palavra via `truncate.js` | Titles com >120 chars aparecem com `…` sem cortar palavras no meio                   |
| FP-005 | A data `MUST` ser exibida em formato `pt-BR` via `date.js` com atributo `datetime` no ISO 8601                   | `<time datetime="2026-06-11T00:00:00Z">11 de junho de 2026</time>`                   |
| FP-006 | O botão de like `MUST` mostrar o contador atual e aceitar clique                                                 | Contador reflete o valor de `post.likes`; clique dispara o handler                   |
| FP-007 | Se o usuário não estiver autenticado, o clique em like `MUST` redirecionar para `/login`                         | `navigate('/login')` chamado; URL muda para `/login`                                 |
| FP-008 | Se autenticado, o clique em like `MUST` enviar `PATCH /posts/:id` com `{ likes: n+1 }` e atualizar a UI          | Contador incrementa na UI sem reload; requisição aparece no network                  |
| FP-009 | Em caso de erro na API, a view `MUST` exibir mensagem de erro e `MUST NOT` deixar container vazio                | `<p class="error">` com texto descritivo substituindo o skeleton                     |
| FP-010 | A view `MUST` retornar `{ destroy() }` cancelando subscriptions do store                                         | Heap Snapshot após 10 navegações não mostra crescimento do Map de subscribers        |
| FP-011 | `document.title` `MUST` ser `"Feed — Promptdown"` ao ativar a rota                                               | `document.title` verificado no console após navegar para `/`                         |
| FP-012 | O route announcer `MUST` ser atualizado com o título da página após a view montar                                | `#route-announcer` contém `"Feed — Promptdown"` após navegação                       |

---

## Requisitos Não-Funcionais

| ID      | Requisito                                                                                                             | Critério de aceite                                                        |
| ------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| FP-NF01 | A view `MUST` ter conformidade WCAG 2.2 nível AA                                                                      | `npx playwright test tests/a11y` passa sem violações em `/`               |
| FP-NF02 | Área clicável de todos os botões `MUST` ser ≥ 24×24 px                                                                | Ferramenta de acessibilidade não reporta violação de `2.5.8`              |
| FP-NF03 | A animação do skeleton `MUST` respeitar `prefers-reduced-motion`                                                      | Com `prefers-reduced-motion: reduce`, skeleton não anima                  |
| FP-NF04 | Nenhum valor CSS hardcoded `MUST NOT` aparecer na folha de estilo do feed                                             | Lint CSS (ou inspeção manual) mostra apenas `var(--token)`                |
| FP-NF05 | A view `MUST` funcionar sem JavaScript desabilitado apenas no fallback de mensagem — não precisa ser funcional sem JS | Fora do escopo de SPA — documentado explicitamente                        |
| FP-NF06 | Cobertura de testes unitários em `lib/` referenciados pela feature `MUST` ser ≥ 80%                                   | `npm run test:coverage` mostra ≥ 80% em `lib/truncate.js` e `lib/date.js` |

---

## Contratos de API referenciados

Endpoint documentado em `docs/api/openapi.yaml` (fonte canônica):

```yaml
GET /posts?_page={page}&_limit={limit}
Resposta 200: Post[]
Resposta 500: { error: string }

PATCH /posts/{id}
Body: { likes: integer }
Resposta 200: Post
Resposta 401: Unauthorized
Resposta 422: { errors: { likes: string } }
```

**Regra (`CLAUDE.md` § Restrições Absolutas):** `MUST NOT` implementar chamada
sem entrada correspondente em `api/openapi.yaml`. Atualizar o contrato antes
de implementar `PATCH /posts/:id` se o endpoint não existir ainda.
