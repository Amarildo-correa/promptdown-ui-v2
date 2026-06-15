# Codebase Concerns

**Analysis Date:** 2026-06-13

## Tech Debt

**Drift de versão/caminho do contrato OpenAPI:**

- Issue: `docs/adr/ADR-0001-arquitetura-base.md` § "API Contract — OpenAPI" especifica `docs/api/openapi.yaml` com OpenAPI **3.1.0**. O arquivo real é `api/openapi.yaml` com OpenAPI **3.0.3** (`info.version: "1.0.0"`).
- Files: `api/openapi.yaml:1,5` vs. ADR-0001 (histórico).
- Why: o contrato real foi criado em caminho/versão diferentes do planejado no ADR.
- Impact: qualquer automação ou agente que assuma `docs/api/openapi.yaml@3.1.0` falhará — `api/openapi.yaml@3.0.3` é a fonte canônica real (já refletido em INTEGRATIONS.md).
- Fix approach: nenhuma ação necessária para a migração — apenas garantir que toda referência futura use `api/openapi.yaml`. Se 3.1.0 for desejado, migrar via tarefa dedicada (JSON Schema Draft 2020-12).

**Tooling planejado vs. configurado (`package.json`):**

- Issue: `package.json` define apenas `test` e `test:coverage`. Scripts descritos como padrão em ADR-0001 e nas features não existem: `lint`, `lint:api`, `format`, `format:check`, `mock:api`, `serve`, `api`, `test:watch`, `test:e2e`, `test:a11y`.
- Files: `package.json:4-7` (scripts), `package.json:8-11` (apenas `vitest` + `@vitest/coverage-v8` como devDependencies).
- Why: tooling de qualidade (ESLint/Prettier/husky), contrato (Spectral/Prism), e2e (Playwright/axe) e dev server (browser-sync) ainda não foram instalados/configurados.
- Impact: sem `lint`/`format`, inconsistências de estilo não são capturadas; sem `lint:api`, o contrato OpenAPI pode divergir sem aviso; sem `serve`/`api`, não há ambiente de desenvolvimento local rodando; sem `test:e2e`/`test:a11y`, fluxos de UI e acessibilidade não têm gate automatizado.
- Fix approach: instalar e configurar incrementalmente conforme cada feature precisar (ex.: `serve` + `bs-config.js` faz parte de `.specs/features/auth-cookie-httponly/tasks.md` T01). Não instalar tudo de uma vez sem uma feature que justifique.

**ADR-0002 vazio:**

- Issue: `docs/adr/ADR-0002-component-pattern.md` contém apenas o texto "futuras decisões separadas".
- Files: `docs/adr/ADR-0002-component-pattern.md:1`.
- Why: placeholder criado para decisões futuras sobre Component Pattern, nunca preenchido.
- Impact: nenhum — não é referenciado por nenhuma spec ativa. Não bloqueia a migração.
- Fix approach: preencher quando houver decisão real a documentar, ou remover se não for mais necessário.

## Security Considerations

**Modelo de autenticação ainda não implementado:**

- Risk: o contrato `api/openapi.yaml` já expõe `PATCH /posts/{id}` com `security: bearerAuth`, mas não há servidor (`api/server.js`) nem middleware de autenticação implementados.
- Files: `api/openapi.yaml:58-97` (endpoint protegido); `.specs/features/auth-cookie-httponly/` (design completo, 0/8 tarefas concluídas).
- Current mitigation: nenhuma — endpoint apenas documentado, não implementado.
- Recommendations: implementar `.specs/features/auth-cookie-httponly/tasks.md` antes de qualquer endpoint autenticado entrar em uso real. `MUST NOT` usar `localStorage`/`sessionStorage` para o JWT (ver CONVENTIONS.md § Hard Constraints) — usar cookie `HttpOnly` desde o início.

## Missing Critical Features

**Quase toda a aplicação frontend/backend está decidida mas não implementada:**

- Problem: além de `public/js/lib/truncate.js` (+ teste) e `api/openapi.yaml`, nenhum dos módulos descritos no ADR-0001 existe: `router.js`, `app.js`, `store.js`, `api.js`, componentes (`PostCard.js`, `UserAvatar.js`, `NavLink.js`), views (`feed.js`, `post.js`, `profile.js`, `login.js`, `register.js`), `public/css/*`, `api/server.js`, `api/middleware/*`.
- Current workaround: documentação (ADR-0001 + `.specs/features/*`) descreve a arquitetura-alvo em detalhe suficiente para implementação direta.
- Blocks: qualquer feature de UI (feed, perfil, posts) e qualquer chamada de API real — não há servidor rodando.
- Implementation complexity: alta no agregado, mas cada feature em `.specs/features/` já tem `design.md` e `tasks.md` com tarefas atômicas — implementação incremental por feature.

## Test Coverage Gaps

**Cobertura limitada a uma única função utilitária:**

- What's not tested: tudo exceto `public/js/lib/truncate.js`. Não há testes de componentes, views, store, router, middleware ou contrato de API.
- Risk: baixo no momento (pouco código existe), mas cresce proporcionalmente conforme features forem implementadas sem testes acompanhando.
- Priority: Medium — cada nova feature em `.specs/features/` já especifica `Tests`/`Gate` por tarefa; seguir esse padrão evita acúmulo de débito.
- Difficulty to test: baixa para `lib/` (funções puras, padrão já estabelecido por `truncate.test.js`); maior para `views/`/`api/server.js` (requer jsdom/integração — ainda não configurado).

---

_Concerns audit: 2026-06-13_
_Update as issues are fixed or new ones discovered_
