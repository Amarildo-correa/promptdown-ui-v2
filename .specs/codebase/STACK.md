# Tech Stack

**Analyzed:** 2026-06-13

## Core

- Framework: nenhum — JavaScript puro (vanilla), ESM (`"type": "module"` no `package.json`)
- Language: JavaScript (sem TypeScript — decisão permanente, ver CONVENTIONS.md § Hard Constraints)
- Runtime: Node.js (versão não fixada em `package.json`; CI usa Node 22 — decidido, não implementado)
- Package manager: npm (`package-lock.json` presente)

## Frontend

- UI Framework: nenhum — Component Pattern vanilla (template-cloning factory components) — **decidido, não implementado** (nenhum arquivo em `public/js/` além de `public/js/lib/truncate.js`)
- Styling: CSS vanilla com design tokens — **decidido, não implementado** (`public/css/` não existe; tokens documentados em `docs/DESIGN.md`)
- State Management: Proxy + pub/sub customizado (`store.js`) — **decidido, não implementado**
- Form Handling: validação manual via `sanitize.js` (client) — **decidido, não implementado**

## Backend

- API Style: REST via JSON Server — **decidido, não implementado** (`api/server.js`, `api/database.json`, `api/middleware/` não existem; apenas `api/openapi.yaml` existe)
- Database: arquivo JSON (`api/database.json`) servido pelo JSON Server — **decidido, não implementado**
- Authentication: `json-server-auth` + cookie `HttpOnly` — **decidido, não implementado**. Modelo atual de referência: `.specs/features/auth-cookie-httponly/design.md`

## Testing

- Unit: Vitest ^2.0.0 (configurado — `npm run test`, `npm run test:coverage`)
- Coverage: `@vitest/coverage-v8` ^2.0.0 (configurado)
- Integration: não configurado
- E2E: Playwright — **planejado, não configurado** (sem devDependency, sem `tests/e2e/`)
- Acessibilidade: `@axe-core/playwright` — **planejado, não configurado**

## External Services

- Nenhuma integração com serviço externo identificada no código atual.
- Google Fonts (Inter, Roboto Mono) e ícones Tabler via CDN — documentados em `docs/DESIGN.md`, não implementados em HTML (não há `public/index.html`).

## Development Tools

- Lint/Format: ESLint + Prettier — **planejado, não configurado** (sem `eslint.config.js`, `.prettierrc`, scripts `lint`/`format`)
- Git hooks: husky + lint-staged — **planejado, não configurado**
- Contrato de API: `@stoplight/spectral-cli` (lint) + `@stoplight/prism-cli` (mock) — **planejado, não configurado** (`.spectral.yaml` existe com `extends: spectral:oas`, mas scripts `lint:api`/`mock:api` não existem em `package.json`)
- CI/CD: GitHub Actions — **planejado, não configurado** (sem diretório `.github/workflows/`)
- Dev server: `browser-sync` — **planejado, não configurado** (sem script `serve`, sem `bs-config.js`)

## Scripts reais (`package.json` hoje)

```json
"scripts": {
    "test": "vitest run",
    "test:coverage": "vitest run --coverage"
}
```

Todos os demais scripts mencionados em `.specs/codebase/TESTING.md` e nas features (`serve`, `api`, `lint`, `lint:api`, `format`, `mock:api`, `test:e2e`, `test:a11y`) ainda não existem — ver `.specs/codebase/CONCERNS.md`.
