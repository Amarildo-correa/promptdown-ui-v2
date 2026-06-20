---
description: Template-cloning factory component pattern for public/js/components/
paths:
  - public/js/components/**/*.js
---

# Component Pattern — Template-cloning factory

## Module structure

```js
// Template declared ONCE at module scope — not inside the factory
const template = document.createElement("template");
template.innerHTML = `<article class="post-card">
  <h2 class="post-card__title"></h2>
  <p class="post-card__author"></p>
</article>`;

/**
 * @param {{ title: string, author: string }} props
 * @returns {Element}
 */
export function PostCard({ title, author }) {
  const node = document.importNode(template.content, true);

  node.querySelector(".post-card__title").textContent = title;
  node.querySelector(".post-card__author").textContent = author;

  // addEventListener BEFORE returning — never after appending to DOM
  node.querySelector(".post-card__title").addEventListener("click", () => { ... });

  return node.firstElementChild; // Element, not DocumentFragment
}
```

## Rules

- `template` is const at module scope — cloned per call via `document.importNode(template.content, true)`
- Events: attach via `addEventListener` inside the factory, before the `return`
- Return: always `node.firstElementChild` (an `Element`) — not `node` (a `DocumentFragment`)
- Components receive props as plain object; they do not import `store.js` directly
