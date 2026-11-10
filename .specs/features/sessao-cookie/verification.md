# Sessão cookie HttpOnly verification

**Verdict**: FAIL
**Mutations**: 3 - probed C26 (middleware condition), C13 (clearing cookie Path), C17 (login stores the user); 0 killed, 3 not
**Proofs**: `proofs.md` at 108c048
**Verifier**: independent sub-agent (author != verifier)

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| The auth middleware can redirect the wrong way and no test fails (SESS-03 AC 12) | mutation `if (!auth.user) { return navigateTo("/");` -> `if (auth.user) { return navigateTo("/");` in `middleware/authMiddleware.ts` not killed by C26. `session-client.test.ts` "middleware follows the user" only runs `toContain("!auth.user")`, `toContain('navigateTo("/")')`, `not.toContain("auth.token")`, and the first `if (!auth.user)` (before `getUser`) satisfies the first one | run the middleware with a stub store: user absent after `getUser` navigates to `/`, user present returns undefined | C26 |
| Login can stop storing the returned user and no test fails (SESS-03 AC 3, Goal "login não recarrega a página") | mutation removing `user.value = res.user;` from `login` in `stores/authStore.ts` not killed by C17. With the reload gone, that line is what makes the map's `authStore.user` watch see the login. C17 asserts only the substring `description: "Login realizado com sucesso."` inside the slice of `login` | mount the store with a stubbed `requestFetch` and assert `user` equals the response user after `login`, and the toast text | C17 |
| The expiring `Set-Cookie` on a bad logout can target a different Path and no test fails (SESS-02 AC 7) | mutation `deleteCookie(event, SESSION_COOKIE, options)` -> `deleteCookie(event, SESSION_COOKIE, { path: "/x" })` in `server/domain/auth/cookie.ts` not killed by C13. `logout.post.test.ts` `expiresAuthToken` only checks `startsWith("auth_token=")` and `includes("Max-Age=0")`; a browser would keep the real `auth_token` at `Path=/` | assert the expiring line contains `Path=/` and `HttpOnly` and `SameSite=Lax` | C13 |
| C15, C21, C25 name routes but not the verb or the call (looser than SESS-03 AC 1, 7, 11) | `session-client.test.ts`: `toContain('"/api/user/logout"')`, `toContain("`/api/occurrences/${id}`")` and `toContain("useRequestFetch")` pass if the string appears anywhere in the file, in a comment or in a different call; no assertion fixes `POST` for logout/register/login or `DELETE` for the occurrence delete | assert the `method` next to each path, or exercise the store with a stubbed fetch and record method and URL | C15, C21, C25 |
Own examples run at HEAD working tree as throwaways, all passed and the file was deleted:

- Deadline: `expires_at` 2 s ahead gives 200 on `/api/user/me`; 1 ms behind gives 401. A user with `date_birth` 2000-02-29 (leap day) is echoed unchanged by register.
- Odd cookie values (`%E0%A4%A` malformed escape, 100 000 character token, blank, duplicated `auth_token`, quoted value): `/api/user/me` 401, `/api/occurrences` 200, `/api/user/logout` 401 with an expiring `auth_token`.
- Logout with two sessions: only that row is deleted, the other cookie still opens `/api/user/me`.
- `Secure` through the register, login and logout handlers with `NODE_ENV` `production`, `Production`, `staging`, empty and unset: `Secure` only for exactly `production`.
