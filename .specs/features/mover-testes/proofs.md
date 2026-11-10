# mover-testes proofs

**HEAD**: 18b60ba
**Tree**: dirty - server/api/ocurrences/inactivate/[id].post.test.ts, server/api/ocurrences/index.get.test.ts, server/api/ocurrences/index.post.test.ts, server/api/ocurrences/like/[id].get.test.ts, server/api/ocurrences/my-ocurrences.get.test.ts
**Result**: 11 pass, 0 fail; mutations 3 killed, 0 not

| Check | Proof | Ran | Passed | Result |
| --- | --- | --- | --- | --- |
| C1 | `node .specs/features/mover-testes/check-layout.mjs paths` | count unknown | - | pass |
| C2 | `node .specs/features/mover-testes/check-layout.mjs absent` | count unknown | - | pass |
| C3 | `node .specs/features/mover-testes/check-layout.mjs imports` | count unknown | - | pass |
| C4 | `node .specs/features/mover-testes/check-layout.mjs helper` | count unknown | - | pass |
| C5 | `node .specs/features/mover-testes/check-layout.mjs bodies` | count unknown | - | pass |
| C6 | `node .specs/features/mover-testes/check-layout.mjs vitest-include` | count unknown | - | pass |
| C7 | `node .specs/features/mover-testes/check-layout.mjs vitest-guard` | count unknown | - | pass |
| C8 | `node .specs/features/mover-testes/check-layout.mjs route-map` | count unknown | - | pass |
| C9 | `node .specs/features/mover-testes/check-layout.mjs brackets` | count unknown | - | pass |
| C10 | `node .specs/features/mover-testes/check-layout.mjs selectors` | count unknown | - | pass |
| C11 | `npx vitest run` | 65 | 65 | pass |

## Mutations

| Mutation | Location | Killed |
| --- | --- | --- |
| condição do guarda !== -> === | `vitest.config.ts:17` | yes |
| filtro include test/server -> server | `vitest.config.ts:36` | yes |
| import do client com um ../ a menos | `test/server/api/ocurrences/inactivate/[id].post.test.ts:2` | yes |
