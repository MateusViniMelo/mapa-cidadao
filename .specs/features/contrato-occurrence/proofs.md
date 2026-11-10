# contrato-occurrence proofs

**HEAD**: 838bcfe
**Tree**: dirty - .cursor/napkin.md, components/layout/Navbar.vue, components/map/CloseOccurrenceModal.vue, components/map/LeafletMap.vue, composables/ocurrencesService.ts
**Result**: 22 pass, 0 fail; mutations 3 killed, 0 not

| Check | Proof | Ran | Passed | Result |
| --- | --- | --- | --- | --- |
| C1 | `npx vitest run test/server/db/migrate.test.ts -t "renames occurrence tables"` | 1 | 1 | pass |
| C2 | `npx vitest run test/server/api/route-map.test.ts -t "mounted paths answer"` | 1 | 1 | pass |
| C3 | `npx vitest run test/server/api/route-map.test.ts -t "old occurrence route files are gone"` | 1 | 1 | pass |
| C4 | `npx vitest run test/server/api/occurrences/index.get.test.ts -t "lists under the occurrences key"` | 1 | 1 | pass |
| C5 | `npx vitest run test/server/api/occurrences/index.post.test.ts -t "stores and returns longitude first"` | 1 | 1 | pass |
| C6 | `npx vitest run test/server/api/occurrences/like/[id].get.test.ts -t "first like returns occurrence"` | 1 | 1 | pass |
| C7 | `npx vitest run test/server/api/types-occurrence.get.test.ts -t "lists the five seeded types"` | 1 | 1 | pass |
| C8 | `npx vitest run test/server/app/page-route.test.ts -t "page file is my-occurrences"` | 1 | 1 | pass |
| C9 | `npx vitest run test/server/api/occurrences/index.post.test.ts -t "stores and returns longitude first"` | 1 | 1 | pass |
| C10 | `npx vitest run test/server/api/occurrences/index.post.test.ts -t "stores and returns longitude first"` | 1 | 1 | pass |
| C11 | `npx vitest run test/server/domain/occurrences/create.test.ts -t "request point reads longitude first"` | 1 | 1 | pass |
| C12 | `npx vitest run test/server/utils/occurrencePoint.test.ts -t "click becomes longitude first"` | 1 | 1 | pass |
| C13 | `npx vitest run test/server/api/occurrences/index.post.test.ts -t "create rejects a point that is not two finit` | 1 | 1 | pass |
| C14 | `npx vitest run test/server/api/occurrences/my-occurrences.get.test.ts -t "pages the caller ten then five"` | 1 | 1 | pass |
| C15 | `npx vitest run test/server/api/occurrences/my-occurrences.get.test.ts -t "omitted page is page 1"` | 1 | 1 | pass |
| C16 | `npx vitest run test/server/api/occurrences/my-occurrences.get.test.ts -t "page zero is page 1"` | 1 | 1 | pass |
| C17 | `npx vitest run test/server/api/occurrences/my-occurrences.get.test.ts -t "page past the end is empty"` | 1 | 1 | pass |
| C18 | `npx vitest run test/server/api/occurrences/my-occurrences.get.test.ts -t "mine body omits laravel links"` | 1 | 1 | pass |
| C19 | `npx vitest run test/server/api/occurrences/my-occurrences.get.test.ts -t "page abc is page 1"` | 1 | 1 | pass |
| C20 | `npx vitest run test/server/api/occurrences/my-occurrences.get.test.ts -t "includes inactive rows"` | 1 | 1 | pass |
| Build | `npx vitest run` | - | - | pass |
| Build | `npm run build` | - | - | pass |

## Mutations

| Mutation | Location | Killed |
| --- | --- | --- |
| map payload latitude then longitude -> swapped | `components/map/LeafletMap.vue:233` | yes |
| coordinate pair length !== 2 -> < 2 | `server/domain/occurrences/create.ts:89` | yes |
| page window starts one page late | `server/domain/occurrences/mine.ts:24` | yes |
