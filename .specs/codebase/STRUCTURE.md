# Project Structure

**Root:** `C:\projetos\repositorys-root\promptdown-ui-v2`

## Directory Tree (estado real)

```
.
├── .specs/
│   ├── codebase/        ← este conjunto de docs
│   ├── features/
│   │   ├── auth-cookie-httponly/
│   │   ├── feed-publico/
│   │   └── markdown-rendering/
│   └── project/STATE.md
├── api/
│   └── openapi.yaml      ← contrato OpenAPI 3.0.3 (REAL)
├── docs/
│   ├── adr/               ← ADR-0001 (snapshot histórico pós-migração), ADR-0002 (vazio)
│   ├── DESIGN.md           ← design tokens + verificação visual
│   └── prompts/
├── public/
│   └── js/
│       └── lib/
│           └── truncate.js  ← único módulo de app implementado
├── tests/
│   └── unit/
│       └── truncate.test.js
├── .spectral.yaml
├── package.json
└── package-lock.json
```

## Module Organization

### `public/js/lib/` (parcialmente implementado)

**Purpose:** Utilitários puros, sem dependência de DOM.
**Location:** `public/js/lib/`
**Key files:** `truncate.js` (implementado). Planejados (ADR, não implementados): `esc.js`, `sanitize.js`, `date.js`, `skeleton.js`, `auth.js`, `md-policy.js`.

### `tests/unit/` (implementado)

**Purpose:** Testes Vitest para `lib/`.
**Location:** `tests/unit/`
**Key files:** `truncate.test.js`.

### `api/` (parcialmente implementado)

**Purpose:** Contrato e (futuramente) servidor JSON Server.
**Location:** `api/`
**Key files:** `openapi.yaml` (REAL, OpenAPI 3.0.3). Planejados: `server.js`, `database.json`, `middleware/sanitize.js`, `middleware/delay.js`, `middleware/cookie-auth.js`.

### `.specs/features/` (implementado — specs)

**Purpose:** Especificações de features ativas.
**Location:** `.specs/features/{auth-cookie-httponly,feed-publico,markdown-rendering}/{spec,design,tasks}.md`

## Where Things Live (planejado — ver ARCHITECTURE.md para status)

**Componentes UI:**
- UI/Interface: `public/js/components/*.js` (planejado)
- Business Logic: `public/js/views/*.js` (planejado)
- Data Access: `public/js/api.js` (planejado)
- Configuration: `public/js/lib/` + `docs/DESIGN.md` (tokens)

**Roteamento/Bootstrap:**
- `public/js/router.js`, `public/js/app.js` (planejados)

**Estado:**
- `public/js/store.js` (planejado)

**API/Backend:**
- Contrato: `api/openapi.yaml` (REAL)
- Servidor: `api/server.js`, `api/middleware/*.js`, `api/database.json` (planejados)

**CSS:**
- Tokens e regras: `docs/DESIGN.md` (fonte de verdade atual) → futuro `public/css/tokens.css` (planejado)

## Special Directories

**`.specs/`:**
**Purpose:** Spec-driven development (tlc-spec-driven) — `codebase/` (mapeamento, este conjunto), `features/` (specs ativas), `project/STATE.md` (memória persistente).
**Examples:** `.specs/features/auth-cookie-httponly/design.md`, `.specs/project/STATE.md`.

**`docs/adr/`:**
**Purpose:** Histórico de decisões arquiteturais. Pós-migração (Etapa 0 em diante), `ADR-0001-arquitetura-base.md` não é mais lido por agentes — leitura humana apenas. `ADR-0002-component-pattern.md` está vazio ("futuras decisões separadas").
