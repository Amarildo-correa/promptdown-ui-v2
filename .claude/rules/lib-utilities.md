---
description: Conventions for pure utility functions in public/js/lib/
paths:
  - public/js/lib/**/*.js
---

# lib/ — Pure Utility Functions

Each file exports one primary pure function. The only real example is `truncate.js` — follow its structure exactly.

## JSDoc on exported functions

Follow the pattern established in `truncate.js` — exported functions have `@param` and `@returns` blocks:

```js
/**
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength) { ... }
```

## Sentinel values, not throw

For invalid or non-string inputs, return a sentinel (`""`, `null`, `false`) — never `throw TypeError`. Example from `truncate.js`:

```js
if (typeof text !== "string") return "";
```

Callers in `views/` and `components/` should not need try/catch for lib functions.

## Hard constraints

- No imports from `../store.js`
- No side effects
- No module-level state
