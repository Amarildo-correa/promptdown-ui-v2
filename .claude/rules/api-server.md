---
description: API server middleware order and security invariants for api/
paths:
  - api/**/*.js
---

# API Server — Middleware Order and Security

## Middleware chain (fixed order — do not reorder)

```js
server.use(middlewares);       // json-server defaults (logger, static, cors)
server.use(jsonServer.bodyParser);
server.use(delayMiddleware);   // artificial delay — first, affects all routes
server.db = router.db;         // MUST precede server.use(auth) — json-server-auth requirement
server.use(injectAuthHeader);  // cookie HttpOnly → Authorization: Bearer (before auth)
server.use(auth);              // json-server-auth validates JWT — after injectAuthHeader
server.use(handleAuthCookies); // accessToken → Set-Cookie, /me, /logout (after auth)
server.use(sanitizeMiddleware);
server.use(router);            // json-server router — always last
```

Any change to this order breaks authentication or sanitization silently.

## Security invariants

**JWT_SECRET — no fallback allowed:**
```js
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET não definido"); // MUST fail on boot, not silently default
}
```
A hardcoded fallback allows JWT forgery. Value must match `json-server-auth`'s secret.

**`server.db = router.db` position:**
This line MUST come before `server.use(auth)`. `json-server-auth` reads `server.db` on initialization to access the users collection. If placed after, auth routes (`/login`, `/register`) return 500.

## Cookie constants

```js
const COOKIE_NAME = "jsa_token";
const COOKIE_OPTS = { httpOnly: true, sameSite: "lax", path: "/" };
```

`SameSite: "lax"` (not `"strict"`) — intentional: `strict` blocks the cookie on top-level navigations from external links (e.g., a shared post URL).
