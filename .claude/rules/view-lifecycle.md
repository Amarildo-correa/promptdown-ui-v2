---
description: View lifecycle contract for public/js/views/
paths:
  - public/js/views/**/*.js
---

# View Lifecycle Contract

Every view exports an async function that returns `{ destroy: Function }` or `null` (enforced by CLAUDE.md). This file documents the concrete implementation pattern and the points **not** covered there.

## Full pattern

```js
import { subscribe } from "../store.js";
import { requireAuth } from "../app.js";      // only for private views
import { showSkeleton } from "../lib/skeleton.js";

export async function MyView(container) {
  // 1. Auth guard — private views only. MUST be first, before any render.
  if (!(await requireAuth())) return null;

  // 2. Skeleton BEFORE any await — user sees feedback immediately
  showSkeleton(container);

  // 3. Async work
  const data = await fetchSomething();

  // 4. Render

  // 5. Store subscriptions — collect all unsubscribes
  const unsubs = [];
  unsubs.push(subscribe("posts", render));

  // 6. Return destroy contract
  return {
    destroy() {
      unsubs.forEach(fn => fn());
    },
  };
}
```

## Rules

- `showSkeleton(container)` before any `await` — skeleton must appear before data loads, not after
- Return `null` only when the view redirected (e.g., `requireAuth()` returned false) — the router skips `destroy` for `null`
- The router (not the view) is responsible for calling `activeView?.destroy?.()` before mounting the next view
