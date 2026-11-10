# Mover os testes para `test/` Specification

**Approved**: 2026-11-09 - user: "Implement the plan as specified, it is attached for your reference."

## Problem Statement

Os testes estão ao lado do código em `server/`. Quem abre um handler encontra o teste no mesmo diretório. A suíte precisa viver em `test/` na raiz, e o diretório de cada teste precisa repetir o caminho do arquivo que ele já ocupa.

## Goals

- [x] Os 20 arquivos `*.test.ts` ficam em `test/` mais o caminho antigo.
- [x] `npx vitest run` passa os mesmos 65 testes, no banco `mapa_cidadao_test`.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Reescrever `.specs/features/migrar-backend/proofs.md` | É o registro da última execução daquela feature. |
| Mover `server/test/call-handler.ts` | Não é um teste e não espelha um arquivo de produto. |
| Alterar título ou asserção de teste | O pedido muda o lugar dos arquivos, não o contrato que eles provam. |
| Remover o `ignore` de `**/*.test.ts` em `nuxt.config.ts` | O plano mantém essa linha. |
| Commit | Não foi pedido. |
| Redisparar o verificador de `migrar-backend` | O plano exclui esse passe. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Raiz da pasta e espelho do caminho | `test/` na raiz mais o caminho completo do arquivo | O plano aprovado escolheu essa raiz | y |
| Nome do arquivo | O sufixo `.test.ts` permanece | O plano mantém o nome | y |
| Helper de HTTP | `server/test/call-handler.ts` fica onde está | Não é um teste | y |
| `tasks.md` formal desta feature | Os checks ficam nesta spec | O plano trata o trabalho como quatro passos mecânicos | y |
| Seletores de `migrar-backend` | Só caminhos que contêm `.test.ts` ganham o prefixo `test/` | O plano limita a troca a esses caminhos | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Testes espelhados em `test/` ⭐ MVP

**User Story**: As a person maintaining the suite, I want each test under `test/` at the same path it has today so that the directory of the test matches the original file.

**Why P1**: Sem esse espelho a suíte continua misturada ao código.

**Acceptance Criteria**:

1. The system SHALL place each of these 20 files at `test/` plus its current path: `server/api/ocurrences/inactivate/[id].post.test.ts`, `server/api/ocurrences/index.get.test.ts`, `server/api/ocurrences/index.post.test.ts`, `server/api/ocurrences/like/[id].get.test.ts`, `server/api/ocurrences/my-ocurrences.get.test.ts`, `server/api/register.post.test.ts`, `server/api/route-map.test.ts`, `server/api/types-ocurrence.get.test.ts`, `server/api/user/login.post.test.ts`, `server/api/user/logout.post.test.ts`, `server/api/user/me.get.test.ts`, `server/db/migrate.test.ts`, `server/domain/auth/register.test.ts`, `server/domain/auth/session.test.ts`, `server/domain/catalog/list-types.test.ts`, `server/domain/occurrences/create.test.ts`, `server/domain/occurrences/inactivate.test.ts`, `server/domain/occurrences/like.test.ts`, `server/domain/occurrences/list-active.test.ts`, `server/domain/occurrences/mine.test.ts`.
2. The system SHALL leave no `*.test.ts` file under `server/`.
3. WHEN Vitest loads a moved file THEN the system SHALL resolve each relative import and each relative `vi.mock` specifier to the same module that specifier resolved to before the move.
4. The system SHALL keep `server/test/call-handler.ts` at that path.
5. The system SHALL keep every test title and every assertion, including the 65 existing `test(` calls.
6. WHEN Vitest loads `vitest.config.ts` THEN the system SHALL include exactly `test/server/**/*.test.ts`.
7. The system SHALL keep the Vitest guard on the database name `mapa_cidadao_test`, `fileParallelism: false`, `testTimeout: 30_000`, `hookTimeout: 30_000` and `passWithNoTests: true`.
8. IF a test file has no sibling source of the same name THEN the system SHALL still mirror the directory it already occupies, at `test/server/api/route-map.test.ts`.
9. The system SHALL place `server/api/ocurrences/inactivate/[id].post.test.ts` at `test/server/api/ocurrences/inactivate/[id].post.test.ts` and `server/api/ocurrences/like/[id].get.test.ts` at `test/server/api/ocurrences/like/[id].get.test.ts`.
10. The system SHALL prefix `test/` onto every `server/` path that names a `*.test.ts` file in `.specs/features/migrar-backend/tasks.md` and `.specs/features/migrar-backend/mutations.json`.
11. WHEN `npx vitest run` executes THEN the system SHALL report 65 passed tests and 0 failed tests.

**Independent Test**: `npx vitest run` passa os 65 testes, nenhum `*.test.ts` resta em `server/`, e os 20 arquivos existem sob `test/server/`.

---

## Edge Cases

- IF `server/api/route-map.test.ts` has no `route-map.ts` THEN the system SHALL place it at `test/server/api/route-map.test.ts`.
- WHEN a test path contains `[id]` THEN the system SHALL keep that directory name in the mirrored path.
- IF a relative import points at `server/test/call-handler.ts` THEN the system SHALL keep that target after the move.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| MOVE-01 | P1: Testes espelhados em `test/` | Execute | Verified |
| MOVE-02 | P1: Testes espelhados em `test/` | Execute | Verified |
| MOVE-03 | P1: Testes espelhados em `test/` | Execute | Verified |
| MOVE-04 | P1: Testes espelhados em `test/` | Execute | Verified |
| MOVE-05 | P1: Testes espelhados em `test/` | Execute | Verified |
| MOVE-06 | P1: Testes espelhados em `test/` | Execute | Verified |
| MOVE-07 | P1: Testes espelhados em `test/` | Execute | Verified |
| MOVE-08 | P1: Testes espelhados em `test/` | Execute | Verified |
| MOVE-09 | P1: Testes espelhados em `test/` | Execute | Verified |
| MOVE-10 | P1: Testes espelhados em `test/` | Execute | Verified |
| MOVE-11 | P1: Testes espelhados em `test/` | Execute | Verified |

**Coverage:** 11 total, 11 mapped to checks, 0 unmapped.

---

## Success Criteria

- [x] Os 20 arquivos estão em `test/` mais o caminho antigo e `server/` não tem `*.test.ts`.
- [x] `npx vitest run` passa 65 testes e falha 0, no banco `mapa_cidadao_test`.

## Checks

**Build**: none - esta feature não altera o build do Nuxt; a suíte é a prova
**Mutations**: 3

**C1** - Os vinte arquivos estão em `test/` mais o caminho antigo (MOVE-01)
Proof: node .specs/features/mover-testes/check-layout.mjs paths

**C2** - Nenhum `*.test.ts` resta sob `server/` (MOVE-02)
Proof: node .specs/features/mover-testes/check-layout.mjs absent

**C3** - Cada import relativo resolve o mesmo módulo de antes da mudança (MOVE-03)
Proof: node .specs/features/mover-testes/check-layout.mjs imports

**C4** - `server/test/call-handler.ts` permanece (MOVE-04)
Proof: node .specs/features/mover-testes/check-layout.mjs helper

**C5** - As linhas que não são import permanecem, com 65 chamadas `test(` (MOVE-05)
Proof: node .specs/features/mover-testes/check-layout.mjs bodies

**C6** - O include do Vitest é exatamente `test/server/**/*.test.ts` (MOVE-06)
Proof: node .specs/features/mover-testes/check-layout.mjs vitest-include

**C7** - O Vitest segue no banco `mapa_cidadao_test`, sem paralelismo de arquivo, com timeout 30000 e `passWithNoTests` (MOVE-07)
Proof: node .specs/features/mover-testes/check-layout.mjs vitest-guard

**C8** - `route-map.test.ts` está em `test/server/api/` (MOVE-08)
Proof: node .specs/features/mover-testes/check-layout.mjs route-map

**C9** - Os dois testes `[id]` estão nos diretórios espelhados (MOVE-09)
Proof: node .specs/features/mover-testes/check-layout.mjs brackets

**C10** - `tasks.md` e `mutations.json` prefixam `test/` nos caminhos `*.test.ts` (MOVE-10)
Proof: node .specs/features/mover-testes/check-layout.mjs selectors

**C11** - `npx vitest run` passa a suíte (MOVE-11)
Proof: npx vitest run

## Handoff

**Dispatched:** verifier — generalPurpose, feature mover-testes, spec.md + proofs.md. Sem captura, sem sub-agente de telas. returned: [Verificar mover-testes](8ae8196b-bd48-4419-9b9a-c9f471be1a7c)
