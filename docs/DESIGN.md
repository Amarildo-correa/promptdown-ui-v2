---
description: Design System do Promptdown — tokens, componentes e regras visuais para consumo pelo Claude Code
scope: frontend-browser
---

# Design System — Promptdown

Estética: dark minimalista, separação de componentes por linhas, cores sólidas. Sem sombras, sem degradês, sem fundos próprios em elementos sobrepostos.

---

## Fontes — Google Fonts

Adicionar no `<head>` do HTML:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

Sim

- Mas gostaria de utilizar **JSON Server**, pois quero aprender 100% do CRUD real com API REST.
- Gostaria de utilizar nome da pasta API/ ao invés de mock, já pra simular realidade.
- Separar cada tipo de registro em arquivo individual: `API/fixtures/posts.json`.
- Seguir designer de `C:\projetos\repositorys-root\promptdown\frontend-browser\DESIGN-SYSTEM.md`.
- Criar estrutura de repositório em `C:\projetos\repositorys-root\promptdown-ui`

| Fonte       | Uso                                                                              |
| ----------- | -------------------------------------------------------------------------------- |
| Inter       | Principal — UI, labels, títulos, texto corrido, botões, nav                      |
| Roboto Mono | Exclusivo para `textarea` de escrita markdown e visualização de códigos Markdown |

---

## Ícones

Utilizar ícones da biblioteca Tabler via CDN <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css">

---

## Tokens — Cores

```css
:root {
    --color-bg: #181a18;
    --color-code-bg: #272a27;
    --color-border: #252725;
    --color-border-strong: #3d3a4d;

    --color-text: #c8c5d0;
    --color-heading: #e8e6ec;
    --color-muted: #a8a4b2;
    --color-subtle: #6b6c7a;

    --color-accent: #b09eff;
    --color-warning: #e8b84b;
    --color-error: #ff6b6b;
}
```

---

## Tokens — Tipografia

```css
:root {
    --font-ui: "Inter", sans-serif;
    --font-code: "Roboto Mono", monospace;

    --text-xs: 0.75rem; /* 12px — timestamps, contadores */
    --text-sm: 0.875rem; /* 14px — labels, metadados, menu */
    --text-base: 1rem; /* 16px — texto corrido */
    --text-lg: 1.125rem; /* 18px — títulos de card */
    --text-xl: 1.25rem; /* 20px — títulos de seção */

    --font-normal: 400;
    --font-medium: 500;
    --font-bold: 700;

    --leading-tight: 1.3;
    --leading-base: 1.6;
}
```

---

## Tokens — Espaçamento

Escala em `rem`. Base: `1rem = 16px`.

```css
:root {
    --space-1: 0.25rem; /* 4px  */
    --space-2: 0.5rem; /* 8px  */
    --space-3: 0.75rem; /* 12px */
    --space-4: 1rem; /* 16px */
    --space-5: 1.25rem; /* 20px */
    --space-6: 1.5rem; /* 24px */
    --space-8: 2rem; /* 32px */
    --space-10: 2.5rem; /* 40px */
    --space-12: 3rem; /* 48px */
}
```

---

## Tokens — Layout

```css
:root {
    --sidebar-width: 16.25rem; /* 260px */
    --panel-min: 30rem; /* 480px */
    --transition-fast: 150ms ease;
}
```

---

## Componentes

### Layout — Grid de Painéis

Colunas verticais separadas por `1px solid var(--color-border)`. Nenhuma coluna `MUST NOT` ter `background-color` — herdam `--color-bg`.

| Painel   | Largura           | Conteúdo                 |
| -------- | ----------------- | ------------------------ |
| Sidebar  | `--sidebar-width` | Logo, navegação, perfil  |
| Conteúdo | `flex: 1`         | Feed, form, visualização |
| Preview  | `--panel-min`     | Preview markdown         |

```css
.layout {
    display: flex;
    height: 100vh;
    background: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-ui);
}

.panel {
    border-right: 1px solid var(--color-border);
    overflow-y: auto;
}
```

---

### Card — Prompt

Separação por `border-top`. `MUST NOT` ter `background-color`.

```css
.card {
    border-top: 1px solid var(--color-border);
    padding: var(--space-4) var(--space-6);
}

.card:hover {
    border-top-color: var(--color-border-strong);
}

.card__author {
    font-size: var(--text-sm);
    color: var(--color-muted);
    margin-bottom: var(--space-2);
}

.card__title {
    font-size: var(--text-lg);
    font-weight: var(--font-bold);
    color: var(--color-heading);
    margin-bottom: var(--space-3);
}

.card__body {
    font-size: var(--text-base);
    color: var(--color-text);
    line-height: var(--leading-base);
    font-family: var(--font-code); /* bloco markdown */
}

.card__meta {
    font-size: var(--text-xs);
    color: var(--color-subtle);
    margin-top: var(--space-3);
}
```

---

### Avatar

Quadrado com fundo `--color-surface`, letra inicial do username.

```css
.avatar {
    width: 2.25rem;
    height: 2.25rem;
    background: var(--color-surface);
    color: var(--color-accent);
    font-size: var(--text-sm);
    font-weight: var(--font-bold);
    font-family: var(--font-ui);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
```

---

### Button

Dois estados: primário (sólido `--color-accent`) e ghost (transparente com borda).

`MUST NOT` usar `box-shadow` nem `gradient`.

```css
.btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-5);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    cursor: pointer;
    transition: opacity var(--transition-fast);
}

.btn--primary {
    color: var(--color-muted);
}

.btn--ghost {
    background: transparent;
    color: var(--color-muted);
    border-color: var(--color-border-strong);
}

.btn:hover {
    border: 1px solid var(--color-accent);
}
.btn:disabled {
    cursor: not-allowed;
}
```

---

### Input — Text

`MUST NOT` ter `border` nem `background`. Separação visual feita pelo layout de painéis.

```css
.input {
    width: 100%;
    background: transparent;
    border: solid 1px var(--color-border);
    outline: none;
    font-family: var(--font-ui);
    font-size: var(--text-base);
    color: var(--color-text);
    line-height: var(--leading-base);
}

.input::placeholder {
    color: var(--color-subtle);
}
```

---

### Textarea — Markdown

`MUST` usar `--font-code` (Roboto Mono). `MUST NOT` ter `border` nem `background`.

```css
.textarea {
    width: 100%;
    background: transparent;
    border: solid 1px var(--color-border);
    outline: none;
    resize: none;
    font-family: var(--font-code);
    font-size: var(--text-base);
    color: var(--color-text);
    line-height: var(--leading-base);
    min-height: 12.5rem;
}

.textarea::placeholder {
    color: var(--color-subtle);
}
```

---

### Label / Counter

```css
.field-label {
    font-size: var(--text-sm);
    color: var(--color-muted);
    font-family: var(--font-ui);
}

.field-counter {
    font-size: var(--text-xs);
    color: var(--color-subtle);
    font-family: var(--font-ui);
}
```

---

### Nav Item

Estado ativo usa `--color-accent`.

```css
.nav-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--color-muted);
    cursor: pointer;
    transition: color var(--transition-fast);
}

.nav-item:hover {
    color: var(--color-heading);
}
.nav-item--active {
    color: var(--color-accent);
}
```

---

### Badge

Estado de rascunho e alertas. Usa `--color-warning`.

```css
.badge {
    border: solid 1px var(--color-border);
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--color-warning);
}
```

---

| Verificação                                             | Resultado esperado                                                                                                                                                                     |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Componente sobreposto tem `background-color`?           | `MUST NOT` — herda `--color-bg` do body                                                                                                                                                |
| `input` ou `textarea` tem `border` ou `background`?     | `MUST NOT` — separação visual feita pelo layout                                                                                                                                        |
| `textarea` ou bloco de código usa `--font-ui`?          | `MUST NOT` — `MUST` usar `--font-code` (Roboto Mono)                                                                                                                                   |
| UI comum (labels, botões, nav) usa `--font-code`?       | `MUST NOT` — `MUST` usar `--font-ui` (Inter)                                                                                                                                           |
| Medida de tipografia ou espaçamento está em `px`?       | `MUST NOT` — `MUST` usar `rem`                                                                                                                                                         |
| Usa `box-shadow`, `text-shadow` ou qualquer `gradient`? | `MUST NOT` — apenas cores sólidas dos tokens                                                                                                                                           |
| Usa `border-radius`?                                    | `MUST NOT` — o Design System do Promptdown não usa bordas arredondadas. Cantos são sempre retos (`0`). Nunca adicionar `border-radius` em nenhum componente, nem como exceção pontual. |
| Usa emojis na interface?                                | `MUST NOT` — utilizar exclusivamente ícones. Emojis não fazem parte do Design System.                                                                                                  |
| Valor de cor hardcoded fora dos tokens?                 | `MUST NOT` — `MUST` usar variável `--color-*`                                                                                                                                          |
| Novo valor visual sem token correspondente?             | Criar o token primeiro em `:root`, depois referenciar                                                                                                                                  |
| Medida em fonte/espaçamento usa unidade diferente de `rem`? | `MUST NOT` — `rem`-only para fonte e espaçamento; `px` permitido apenas em `border: 1px` e `outline-offset`                                                                       |
| Custom property numérica/cor sem `@property`?           | `SHOULD` tipar com `@property` (`syntax`, `initial-value`, `inherits`) para fallback robusto — Baseline desde jul/2024                                                                |
| Transição/animação sem tratar `prefers-reduced-motion`? | `MUST NOT` — `MUST` respeitar `@media (prefers-reduced-motion: reduce)` em qualquer transição ou animação                                                                            |
| Tokens de cor sem mapeamento para `prefers-color-scheme`? | `MUST NOT` — dark theme é o padrão; light theme `MUST` remapear os tokens semânticos em `@media (prefers-color-scheme: light)`                                                      |

## Borda compartilhada — Flexbox grid

| Conceito      | Detalhe                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Problema**  | Borda em todos os lados de cada card gera linha dupla nas junções entre células                                          |
| **Solução**   | Container desenha `border-top` + `border-left`; card desenha `border-right` + `border-bottom`                            |
| **Princípio** | Borda de fechamento do card anterior e borda de abertura do próximo ocupam o mesmo pixel — uma única linha visual de 1px |

```css
.father {
    display: flex;
    flex-wrap: wrap;

    /* Apenas bordas de abertura do grid */
    border-top: 1px solid var(--color-border);
    border-left: 1px solid var(--color-border);
}

.children {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 28px;
    min-width: 100px;

    /* Apenas bordas de fechamento de cada célula */
    border-right: 1px solid var(--color-border);
    border-bottom: 1px solid var(--color-border);
}
```

| Verificação                                      | Resultado esperado                                                                                                                                                |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Card tem `border-top` ou `border-left`?          | `MUST NOT` — essas bordas pertencem ao container                                                                                                                  |
| Container tem `border-right` ou `border-bottom`? | `MUST NOT` — essas bordas pertencem ao card                                                                                                                       |
| Usa `border-radius` no container?                | `MUST NOT` — ver regra global de `border-radius` acima; arredondamento dos cards dos cantos `MUST` ser tratado individualmente via `:first-child` / `:last-child` |
