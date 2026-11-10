# sessao-cookie proofs

**HEAD**: 108c048
**Tree**: dirty - .env.example, components/map/LeafletMap.vue, composables/authService.ts, composables/occurrencesService.ts, composables/typesOccurrencesService.ts
**Result**: 28 pass, 0 fail; mutations 3 killed, 0 not

| Check | Proof | Ran | Passed | Result |
| --- | --- | --- | --- | --- |
| C1 | `npx vitest run test/server/api/register.post.test.ts -t "register returns the user without a token"` | 1 | 1 | pass |
| C2 | `npx vitest run test/server/api/register.post.test.ts -t "register sets the session cookie"` | 1 | 1 | pass |
| C3 | `npx vitest run test/server/api/user/login.post.test.ts -t "login sets the session cookie"` | 1 | 1 | pass |
| C4 | `npx vitest run test/server/api/user/login.post.test.ts -t "login rejects bad credentials"` | 1 | 1 | pass |
| C5 | `npx vitest run test/server/domain/auth/cookie.test.ts -t "production cookie is secure"` | 1 | 1 | pass |
| C6 | `npx vitest run test/server/domain/auth/cookie.test.ts -t "non-production cookie omits secure"` | 1 | 1 | pass |
| C7 | `npx vitest run test/server/api/session-cookie.test.ts -t "cookie opens protected routes"` | 1 | 1 | pass |
| C8 | `npx vitest run test/server/api/session-cookie.test.ts -t "protected routes reject a bad cookie"` | 1 | 1 | pass |
| C9 | `npx vitest run test/server/api/session-cookie.test.ts -t "bearer without a cookie is rejected"` | 1 | 1 | pass |
| C10 | `npx vitest run test/server/api/occurrences/index.get.test.ts -t "missing cookie still lists"` | 1 | 1 | pass |
| C11 | `npx vitest run test/server/api/occurrences/index.get.test.ts -t "unknown cookie stays anonymous"` | 1 | 1 | pass |
| C12 | `npx vitest run test/server/api/user/logout.post.test.ts -t "logout revokes the cookie"` | 1 | 1 | pass |
| C13 | `npx vitest run test/server/api/user/logout.post.test.ts -t "logout clears a bad cookie"` | 1 | 1 | pass |
| C14 | `npx vitest run test/server/api/user/login.post.test.ts -t "second login keeps the first cookie"` | 1 | 1 | pass |
| C15 | `npx vitest run test/server/app/session-client.test.ts -t "auth store calls the session routes"` | 1 | 1 | pass |
| C16 | `npx vitest run test/server/app/session-client.test.ts -t "auth store keeps the token out of javascript"` | 1 | 1 | pass |
| C17 | `npx vitest run test/server/app/session-client.test.ts -t "login success toast"` | 1 | 1 | pass |
| C18 | `npx vitest run test/server/app/session-client.test.ts -t "login does not reload"` | 1 | 1 | pass |
| C19 | `npx vitest run test/server/app/session-client.test.ts -t "login failure toast"` | 1 | 1 | pass |
| C20 | `npx vitest run test/server/app/session-client.test.ts -t "register failure toast"` | 1 | 1 | pass |
| C21 | `npx vitest run test/server/app/session-client.test.ts -t "occurrences store calls same origin"` | 1 | 1 | pass |
| C22 | `npx vitest run test/server/app/session-client.test.ts -t "map loads types from the same origin"` | 1 | 1 | pass |
| C23 | `npx vitest run test/server/app/session-client.test.ts -t "fetch wrappers are gone"` | 1 | 1 | pass |
| C24 | `npx vitest run test/server/app/session-client.test.ts -t "public api base is gone"` | 1 | 1 | pass |
| C25 | `npx vitest run test/server/app/session-client.test.ts -t "plugin reloads the user"` | 1 | 1 | pass |
| C26 | `npx vitest run test/server/app/session-client.test.ts -t "middleware follows the user"` | 1 | 1 | pass |
| Build | `npx vitest run` | - | - | pass |
| Build | `npm run build` | - | - | pass |

## Mutations

| Mutation | Location | Killed |
| --- | --- | --- |
| middleware redirects to / when the user is present instead of absent (C26) | `middleware/authMiddleware.ts:10` | yes |
| clearing Set-Cookie targets another Path so the browser keeps auth_token (C13) | `server/domain/auth/cookie.ts:22` | yes |
| login no longer stores the returned user in memory (C17) | `stores/authStore.ts:59` | yes |
