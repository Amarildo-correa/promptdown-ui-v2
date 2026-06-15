# Roadmap

## Milestone atual: v1 — Feed + Autenticação

Marco define "v1 pronto" como `feed-publico` e `auth-cookie-httponly` implementadas
com gates passando. `markdown-rendering` fica para o marco seguinte.

## Features

| Feature                | Status  | Prioridade  | Observações                                                                                       |
| ---------------------- | ------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `feed-publico`         | PLANNED | P1 (v1)     | tasks.md: 1/9 done (T01 — contrato OpenAPI). Demais 8 tasks pendentes.                            |
| `auth-cookie-httponly` | PLANNED | P1 (v1)     | tasks.md: 0/8 done. P1 (sessão via cookie) é o core; P2 (proxy dev) e P3 (guard async) também v1. |
| `markdown-rendering`   | PLANNED | P1 (pós-v1) | tasks.md: T0-T9, nenhuma done. P1 da spec (leitura formatada + XSS-safe) fica para depois do v1.  |

**Nota sobre prioridades:** as prioridades P1/P2/P3 dentro de cada `spec.md` indicam
importância _dentro da feature_. A ordenação acima reflete a decisão deste roadmap:
`markdown-rendering` é P1 na própria spec, mas adiada como milestone (decisão do
usuário em 2026-06-13 — ver `.specs/project/PROJECT.md § Goals`).

## Future Considerations

- **Syntax highlighting (P3 — markdown-rendering)**: Prism.js ou highlight.js, ambos com
  build browser sem bundler; depende do blocker de module resolution (já resolvido via
  Import Maps + `public/vendor/`). Ver `.specs/project/STATE.md § Ideias Deferidas`.
- **GFM (tabelas, strikethrough, task lists)**: extensão `marked-gfm`, P3 de
  `markdown-rendering` — fora do escopo do MVP de markdown.
- **Preview Markdown no PostCard (P2 — markdown-rendering)**: depende de T3
  (MarkdownRenderer) estar pronto; agrega valor visual ao feed mas não é bloqueante.
- **Proxy de dev same-origin (P2 — auth-cookie-httponly)**: `bs-config.js` +
  `npm run serve`; sem ele, P1 de auth ainda é testável via `curl`/Postman direto em `:3001`.
- **Tooling planejado (fora do v1)**: ESLint+Prettier, husky+lint-staged, Spectral
  (lint:api/mock:api), GitHub Actions CI, browser-sync (`serve`) — todos documentados
  como gaps em `.specs/codebase/CONCERNS.md`.
- **Backend real (`backend-api/` PRD v0.6.0)**: substituiria JSON Server; refresh
  token e blacklist de JWT (out-of-scope de `auth-cookie-httponly`) dependem dele.
