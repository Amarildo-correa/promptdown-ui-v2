# Testing Infrastructure

## Test Frameworks

**Unit/Integration:** Vitest ^2.0.0 (configurado) + `@vitest/coverage-v8` ^2.0.0
**E2E:** Playwright — **planejado, não configurado** (sem devDependency)
**Accessibility:** `@axe-core/playwright` — **planejado, não configurado**
**Coverage:** `@vitest/coverage-v8`, via `npm run test:coverage`

## Test Organization

**Location:** `tests/unit/` (único diretório existente)
**Naming:** `*.test.js`
**Structure:** um arquivo de teste por módulo de `public/js/lib/`, caminho relativo espelhando a origem (`tests/unit/truncate.test.js` ↔ `public/js/lib/truncate.js`)

Estrutura planejada (ADR, não implementada):
```
tests/
  unit/         # Vitest + jsdom — funções puras em lib/  (parcial: truncate.test.js existe)
  integration/  # Vitest — comportamento de módulos isolados [planejado]
  e2e/          # Playwright — fluxos completos no browser    [planejado]
  a11y/         # @axe-core/playwright — rotas críticas        [planejado]
```

## Testing Patterns

### Unit Tests

**Approach:** `describe`/`it`/`expect` (Vitest), um `describe` por função exportada, casos cobrindo: comportamento normal, edge cases (entrada vazia/nula/não-string), e casos de regressão nomeados (ex.: "caso FP-004").
**Location:** `tests/unit/`
**Example real:** `tests/unit/truncate.test.js` — 7 casos para `truncate(text, maxLength)`, incluindo entrada não-string, ausência de espaços, e limite exato de caracteres.

### Integration Tests

**Approach:** não implementado, sem exemplos.
**Location:** `tests/integration/` (planejado, diretório não existe)

### E2E Tests

**Approach:** não implementado. ADR descreve Playwright com specs em `tests/e2e/*.spec.js` cobrindo feed e navegação.
**Location:** `tests/e2e/` (planejado, diretório não existe)

## Test Execution

**Commands (reais):**
```bash
npm run test            # vitest run
npm run test:coverage   # vitest run --coverage
```

**Configuration:** sem `vitest.config.js` no repositório — Vitest usa defaults.

## Coverage Targets

**Current:** não medido/reportado neste mapeamento.
**Goals:** ADR menciona meta de 80% (statements/branches/functions) para `lib/`, mas não há configuração de threshold no Vitest — ver CONCERNS.md.
**Enforcement:** nenhuma — sem CI configurado.

## Test Coverage Matrix

| Code Layer                | Required Test Type | Location Pattern                  | Run Command            |
| -------------------------- | ------------------- | ---------------------------------- | ------------------------ |
| `public/js/lib/*.js`       | unit                | `tests/unit/*.test.js`             | `npm run test`          |
| `public/js/components/*.js`| unit (planejado)    | `tests/unit/*.test.js` (nenhum)    | `npm run test`          |
| `public/js/views/*.js`     | integration (planejado) | `tests/integration/*.test.js` (nenhum) | none — não configurado |
| `api/middleware/*.js`      | none (planejado, sem teste definido) | — | — |
| Fluxos E2E (rotas, feed)   | e2e (planejado)     | `tests/e2e/*.spec.js` (nenhum)     | `npm run test:e2e` (não existe) |
| Acessibilidade de rotas    | a11y (planejado)    | `tests/a11y/*.spec.js` (nenhum)    | `npm run test:a11y` (não existe) |
| `api/openapi.yaml`         | contract lint (planejado) | — | `npm run lint:api` (não existe) |

## Parallelism Assessment

| Test Type | Parallel-Safe? | Isolation Model                          | Evidence                                              |
| --------- | -------------- | ----------------------------------------- | ------------------------------------------------------ |
| unit      | Yes            | Funções puras, sem estado compartilhado    | `truncate.test.js` não usa mocks, DB ou globals; cada `it` é independente |

Não há evidência de testes de integração/e2e para avaliar isolamento — a avaliar quando implementados.

## Gate Check Commands

| Gate Level | When to Use                            | Command                     |
| ---------- | --------------------------------------- | ---------------------------- |
| Quick      | Após mudanças em `public/js/lib/*.js`   | `npm run test`               |
| Full       | Antes de considerar tarefa concluída     | `npm run test:coverage`      |
| Build      | N/A — sem etapa de build/lint configurada | (nenhum comando disponível — ver CONCERNS.md) |
