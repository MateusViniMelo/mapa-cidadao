# migrar-backend proofs

**HEAD**: 106c7c8
**Tree**: dirty - .cursor/napkin.md, .env.example, .gitignore, nuxt.config.ts, package-lock.json
**Result**: 53 pass, 0 fail; mutations 3 killed, 0 not

| Check | Proof | Ran | Passed | Result |
| --- | --- | --- | --- | --- |
| C1 | `npx vitest run server/api/register.post.test.ts -t "register returns 200 with user and token"` | 1 | 1 | pass |
| C2 | `npx vitest run server/api/register.post.test.ts -t "register stores a bcrypt password"` | 1 | 1 | pass |
| C3 | `npx vitest run server/domain/auth/register.test.ts -t "rejects a blank name"` | 1 | 1 | pass |
| C4 | `npx vitest run server/domain/auth/register.test.ts -t "rejects a name over 100 characters"` | 1 | 1 | pass |
| C5 | `npx vitest run server/domain/auth/register.test.ts -t "rejects an email the domain check refuses"` | 1 | 1 | pass |
| C6 | `npx vitest run server/domain/auth/register.test.ts -t "rejects a password outside the pattern"` | 1 | 1 | pass |
| C7 | `npx vitest run server/domain/auth/register.test.ts -t "rejects a mismatched confirmation"` | 1 | 1 | pass |
| C8 | `npx vitest run server/domain/auth/register.test.ts -t "rejects a birth date under 18"` | 1 | 1 | pass |
| C9 | `npx vitest run server/api/register.post.test.ts -t "rejects a duplicate email"` | 1 | 1 | pass |
| C10 | `npx vitest run server/api/register.post.test.ts -t "register token reads me"` | 1 | 1 | pass |
| C11 | `npx vitest run server/api/register.post.test.ts -t "register omits the password"` | 1 | 1 | pass |
| C12 | `npx vitest run server/api/user/login.post.test.ts -t "login returns 200"` | 1 | 1 | pass |
| C13 | `npx vitest run server/api/user/login.post.test.ts -t "login rejects bad credentials"` | 1 | 1 | pass |
| C14 | `npx vitest run server/api/user/login.post.test.ts -t "login omits the password"` | 1 | 1 | pass |
| C15 | `npx vitest run server/api/user/me.get.test.ts -t "me returns the same token"` | 1 | 1 | pass |
| C16 | `npx vitest run server/api/user/me.get.test.ts -t "me rejects a missing token"` | 1 | 1 | pass |
| C17 | `npx vitest run server/api/user/logout.post.test.ts -t "logout revokes the token"` | 1 | 1 | pass |
| C18 | `npx vitest run server/api/user/logout.post.test.ts -t "logout rejects a missing token"` | 1 | 1 | pass |
| C19 | `npx vitest run server/api/user/me.get.test.ts -t "me accepts a lowercase bearer scheme"` | 1 | 1 | pass |
| C20 | `npx vitest run server/api/types-ocurrence.get.test.ts -t "lists the five seeded types"` | 1 | 1 | pass |
| C21 | `npx vitest run server/api/ocurrences/index.get.test.ts -t "lists only active occurrences"` | 1 | 1 | pass |
| C22 | `npx vitest run server/domain/occurrences/list-active.test.ts -t "anonymous list sets liked_by_auth_user false"` | 1 | 1 | pass |
| C23 | `npx vitest run server/domain/occurrences/list-active.test.ts -t "list reports the caller like and the count"` | 1 | 1 | pass |
| C24 | `npx vitest run server/api/ocurrences/index.get.test.ts -t "empty authorization still lists"` | 1 | 1 | pass |
| C25 | `npx vitest run server/api/ocurrences/index.post.test.ts -t "stores latitude first and returns longitude first"` | 1 | 1 | pass |
| C26 | `npx vitest run server/domain/occurrences/create.test.ts -t "stores blank description and address"` | 1 | 1 | pass |
| C27 | `npx vitest run server/domain/occurrences/create.test.ts -t "stores null city state and country"` | 1 | 1 | pass |
| C28 | `npx vitest run server/api/ocurrences/index.post.test.ts -t "create rejects a missing token"` | 1 | 1 | pass |
| C29 | `npx vitest run server/api/ocurrences/index.post.test.ts -t "create rejects an unknown type"` | 1 | 1 | pass |
| C30 | `npx vitest run server/domain/occurrences/create.test.ts -t "rejects a description over 250"` | 1 | 1 | pass |
| C31 | `npx vitest run server/api/ocurrences/index.post.test.ts -t "create ignores a body user id"` | 1 | 1 | pass |
| C32 | `npx vitest run server/api/ocurrences/inactivate/[id].post.test.ts -t "owner closes with resolved"` | 1 | 1 | pass |
| C33 | `npx vitest run server/api/ocurrences/inactivate/[id].post.test.ts -t "owner mistake deletes the row"` | 1 | 1 | pass |
| C34 | `npx vitest run server/api/ocurrences/inactivate/[id].post.test.ts -t "other user receives 403"` | 1 | 1 | pass |
| C35 | `npx vitest run server/domain/occurrences/inactivate.test.ts -t "already inactive returns 422"` | 1 | 1 | pass |
| C36 | `npx vitest run server/domain/occurrences/inactivate.test.ts -t "rejects a future resolution date"` | 1 | 1 | pass |
| C37 | `npx vitest run server/api/ocurrences/inactivate/[id].post.test.ts -t "inactivate rejects a missing token"` | 1 | 1 | pass |
| C38 | `npx vitest run server/api/ocurrences/inactivate/[id].post.test.ts -t "inactivate missing id returns 404"` | 1 | 1 | pass |
| C39 | `npx vitest run server/domain/occurrences/inactivate.test.ts -t "save failure returns the message object"` | 1 | 1 | pass |
| C40 | `npx vitest run server/api/ocurrences/my-ocurrences.get.test.ts -t "pages the caller ten then five"` | 1 | 1 | pass |
| C41 | `npx vitest run server/domain/occurrences/mine.test.ts -t "orders by created_at descending"` | 1 | 1 | pass |
| C42 | `npx vitest run server/api/ocurrences/my-ocurrences.get.test.ts -t "links have no html entities"` | 1 | 1 | pass |
| C43 | `npx vitest run server/api/ocurrences/my-ocurrences.get.test.ts -t "includes inactive rows"` | 1 | 1 | pass |
| C44 | `npx vitest run server/api/ocurrences/my-ocurrences.get.test.ts -t "my occurrences rejects a missing token"` | 1 | 1 | pass |
| C45 | `npx vitest run server/api/ocurrences/my-ocurrences.get.test.ts -t "omitted page is page 1"` | 1 | 1 | pass |
| C46 | `npx vitest run server/api/ocurrences/like/[id].get.test.ts -t "first like returns 201"` | 1 | 1 | pass |
| C47 | `npx vitest run server/api/ocurrences/like/[id].get.test.ts -t "second like returns 200 and removes the row"` | 1 | 1 | pass |
| C48 | `npx vitest run server/domain/occurrences/like.test.ts -t "keeps one row per user and occurrence"` | 1 | 1 | pass |
| C49 | `npx vitest run server/api/ocurrences/like/[id].get.test.ts -t "like rejects a missing token"` | 1 | 1 | pass |
| C50 | `npx vitest run server/api/ocurrences/like/[id].get.test.ts -t "like missing id returns 404"` | 1 | 1 | pass |
| C51 | `npx vitest run server/api/route-map.test.ts -t "mounted paths answer"` | 1 | 1 | pass |
| Build | `npx vitest run` | - | - | pass |
| Build | `npm run build` | - | - | pass |

## Mutations

| Mutation | Location | Killed |
| --- | --- | --- |
| password minimum length 8 -> 9 | `server/domain/auth/register.ts:6` | yes |
| mx failure accepts the email | `server/domain/auth/email-domain.ts:17` | yes |
| registration validation status 422 -> 400 | `server/api/register.post.ts:17` | yes |
