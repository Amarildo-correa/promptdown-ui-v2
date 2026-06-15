# Project State

Memória persistente de decisões, blockers, lições e ideias deferidas.

---

## Blockers

### [RESOLVED] Como carregar marked.js e DOMPurify sem bundler

**Feature afetada**: `markdown-rendering`
**Registrado em**: 2026-06-12 | **Resolvido em**: 2026-06-12

**Decisão**: Import Maps + builds ESM locais em `public/vendor/`

```html
<script type="importmap">
    {
        "imports": {
            "marked": "/vendor/marked.esm.js",
            "dompurify": "/vendor/purify.es.mjs"
        }
    }
</script>
```

- `node_modules/marked/lib/marked.esm.js` → `public/vendor/marked.esm.js`
- `node_modules/dompurify/dist/purify.es.mjs` → `public/vendor/purify.es.mjs`

**Por que não CDN**: introduz dependência de rede + novo `script-src` no CSP.
**Por que não globals `<script src>`**: incompatível com `"type": "module"` do projeto.
**Import Maps** são Baseline 2023 — todos os browsers relevantes suportam.

Documentado em `design.md` (seção "Module Resolution") e em T0 de `tasks.md`.

---

## Decisões

### Module resolution sem bundler → Import Maps + `public/vendor/`

**Data**: 2026-06-12 | **Feature**: markdown-rendering
Bare specifiers de bibliotecas npm (`marked`, `dompurify`) são resolvidos via `<script type="importmap">`
apontando para builds ESM copiadas de `node_modules/` para `public/vendor/`. Sem CDN externo, sem
globals, compatível com `"type": "module"` do projeto. Aplica-se a qualquer lib futura.

---

## Lições

_(nenhuma registrada ainda)_

---

## Ideias Deferidas

### Syntax highlighting (P3 — markdown-rendering)

Candidatos avaliados quando P3 for especificado:

- **Prism.js** — projetado para uso direto no browser sem bundler; integra via hook `highlight` do marked
- **highlight.js** — também tem build browser; mesma integração

Depende da resolução do blocker de carregamento de módulos acima.
