# Contrato occurrence Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/contrato-occurrence/design.md`
**Status**: Approved
**Approved**: 2026-11-09 - user: "Implement the plan as specified, it is attached for your reference."
**Mutations**: 3
**Build**: `npx vitest run; npm run build`

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none - strong defaults applied. Vitest include is `test/server/**/*.test.ts` in `vitest.config.ts`. No lint script in `package.json`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Domain | unit | Cada AC de ponto e de página tem o teste nomeado em Checks. Ramos já cobertos (descrição, cidade, ordem) continuam. | `test/server/domain/**/*.test.ts` | `npx vitest run test/server/domain` |
| Route | integration | Rotas no escopo: caminho novo, chave, 401, 422 e páginas 0, 99 e omitida. | `test/server/api/**/*.test.ts` | `npx vitest run test/server/api` |
| Migration | integration | Tabelas novas e os cinco tipos. | `test/server/db/migrate.test.ts` | `npx vitest run test/server/db/migrate.test.ts` |
| Front rule | unit | `toRequestCoordinates` e o arquivo da página. | `test/server/utils/**/*.test.ts`, `test/server/app/**/*.test.ts` | `npx vitest run test/server/utils test/server/app` |
| Vue render | none | A URL e o título são o teste de arquivo. Sem browser neste corte. | - | - |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Depois de domínio, migration ou helper | `npx vitest run test/server/db/migrate.test.ts test/server/domain test/server/utils test/server/app` |
| Full | Depois de rota | `npx vitest run` |
| Build | Fase fechada | `npx vitest run; npm run build` |

---

## Execution Plan

### Phase 1: Foundation

```
T1 → T2
```

### Phase 2: Contract

```
T3 → T4 → T5
```

### Phase 3: Client

```
T6
```

### Phase 4: Prove

```
T7
```

---

## Task Breakdown

### Phase 1: Foundation

### T1: Schema e migration de rename

**What**: Models `TypeOccurrence`, `Occurrence` e `LikeOccurrence` com `@@map` novo, migration `prisma/migrations/20261109213000_rename_ocurrence/migration.sql` com os `RENAME` do design, seed `seedTypeOccurrences` em `typeOccurrence`, e `TRUNCATE` em `server/db/migrate.ts` nos nomes novos. `npx prisma generate` com `DATABASE_URL` exportada.
**Where**: `prisma/schema.prisma`
**Depends on**: None
**Reuses**: `prisma/migrations/20261109120000_init/migration.sql`
**Requirement**: OCC-01

**Done when**:

- [x] Tabelas `types_occurrence`, `occurrences`, `like_occurrences` e coluna `occurrence_id` existem depois de `migrate deploy`
- [x] Índices e FKs têm os nomes finais do design
- [x] `test/server/db/migrate.test.ts` tem o teste `renames occurrence tables` e usa `typeOccurrence`
- [x] Gate check passes: `npx vitest run test/server/db/migrate.test.ts`

**Tests**: integration
**Gate**: quick
**Status**: Complete

---

### T2: SQL das ocorrências nos nomes novos

**What**: Trocar `ocurrences`, `types_ocurrence`, `like_ocurrences` e `ocurrence_id` no SQL de `list-active.ts`, `create.ts`, `inactivate.ts` e `like.ts`, e nos `INSERT`/`FROM` dos testes de domínio e de API que ainda apontam a tabela antiga. O client Prisma desses arquivos usa `typeOccurrence` e `likeOccurrence`.
**Where**: `server/domain/occurrences/list-active.ts`
**Depends on**: T1
**Reuses**: `server/db/migrate.ts`
**Requirement**: OCC-01

**Done when**:

- [x] Nenhuma query em `server/domain` cita o typo `ocurrence`
- [x] Gate check passes: `npx vitest run test/server/domain`

**Tests**: unit
**Gate**: quick
**Status**: Complete

---

### Phase 2: Contract

### T3: Eixo longitude primeiro

**What**: `requestPoint` lê índice 0 como longitude e índice 1 como latitude. O par de prova é `[-46.633308, -23.55052]`. Fixtures de domínio que eram latitude primeiro passam a esse par.
**Where**: `server/domain/occurrences/create.ts`
**Depends on**: T2
**Reuses**: `geoJsonCoordinates`
**Requirement**: OCC-02

**Done when**:

- [x] O teste `request point reads longitude first` espera longitude `-46.633308` e latitude `-23.55052`
- [x] Gate check passes: `npx vitest run test/server/domain/occurrences/create.test.ts`

**Tests**: unit
**Gate**: quick
**Status**: Complete

---

### T4: Envelope data page per_page total

**What**: `toMineResponse` devolve só `{ data, page, per_page, total }`, sem path e sem `IPaginationLink`. Página além do fim mantém o número pedido. `per_page` continua 10.
**Where**: `server/domain/occurrences/mine.ts`
**Depends on**: T3
**Reuses**: `sliceMine`
**Requirement**: OCC-03

**Done when**:

- [x] `mine.ts` não importa `interfaces/IPaginationLink`
- [x] O teste de domínio da página cobre `page`, `per_page` 10 e `total`
- [x] Gate check passes: `npx vitest run test/server/domain/occurrences/mine.test.ts`

**Tests**: unit
**Gate**: quick
**Status**: Complete

---

### T5: Rotas e chaves HTTP

**What**: Mover handlers para `server/api/occurrences/` e `server/api/types-occurrence.get.ts`. Apagar `server/api/ocurrences/` e `server/api/types-ocurrence.get.ts`. Chaves: `occurrences`, `occurrence`, `types_occurrence`. Mover os testes para `test/server/api/occurrences/` e `test/server/api/types-occurrence.get.test.ts`. O POST de São Paulo grava e devolve `[-46.633308, -23.55052]`. A lista do usuário responde as quatro chaves. Like continua GET.
**Where**: `server/api/occurrences/index.get.ts`
**Depends on**: T4
**Reuses**: os handlers atuais
**Requirement**: OCC-01

**Done when**:

- [x] Existem os testes `mounted paths answer`, `old occurrence route files are gone`, `lists under the occurrences key`, `stores and returns longitude first`, `first like returns occurrence`, `lists the five seeded types`, `pages the caller ten then five`, `omitted page is page 1`, `page zero is page 1`, `page past the end is empty`, `mine body omits laravel links`, `page abc is page 1`, `includes inactive rows`, `create rejects a point that is not two finite numbers`
- [x] `stores and returns longitude first` afirma a chave `occurrence`, `ST_X` `-46.633308`, `ST_Y` `-23.55052` e o par de volta igual ao pedido
- [x] `create rejects a point that is not two finite numbers` responde 422 e a contagem de linhas não sobe
- [x] `pages the caller ten then five` afirma `page` 1, `per_page` 10, `total` 15 e `data` com tamanho 10
- [x] `page past the end is empty` afirma `data` `[]`, `total` 1 e `page` 99
- [x] `mine body omits laravel links` afirma a ausência de `links`, `from`, `to`, `path`, `current_page`, `first_page_url`, `last_page_url`, `next_page_url` e `prev_page_url`
- [x] Nenhum teste é apagado para a suíte passar. O teste `links have no html entities` é reescrito como `mine body omits laravel links`
- [x] Gate check passes: `npx vitest run test/server/api`

**Tests**: integration
**Gate**: full
**Status**: Complete

---

### Phase 3: Client

### T6: Página, mapa e clientes HTTP

**What**: `utils/occurrencePoint.ts` exporta `toRequestCoordinates`. `LeafletMap.vue` monta o payload com ela. `pages/my-ocurrences.vue` vira `pages/my-occurrences.vue` com título `Minhas Ocorrências` e lê `page` e `per_page`. A navbar aponta para `/my-occurrences`. Composables, store e interfaces trocam o typo `ocurrence` por `occurrence` e chamam os caminhos novos. Texto em português e `stores/ocorrencias.ts` ficam.
**Where**: `utils/occurrencePoint.ts`
**Depends on**: T5
**Reuses**: `geoJsonCoordinates` no servidor, sem duplicar a conta no Vue além do helper
**Requirement**: OCC-02

**Done when**:

- [x] O teste `click becomes longitude first` espera `[-46.633308, -23.55052]` e vê `toRequestCoordinates(` em `components/map/LeafletMap.vue`
- [x] O teste `page file is my-occurrences` vê `pages/my-occurrences.vue`, não vê `pages/my-ocurrences.vue`, vê o título `Minhas Ocorrências` e vê `to: "/my-occurrences"` na navbar
- [x] Gate check passes: `npx vitest run test/server/utils/occurrencePoint.test.ts test/server/app/page-route.test.ts`

**Tests**: unit
**Gate**: quick
**Status**: Complete

---

### Phase 4: Prove

### T7: Suíte server verde

**What**: A suíte `test/server` inteira passa com os nomes novos. Nenhum arquivo de produto fora deste corte muda de comportamento.
**Where**: `vitest.config.ts`
**Depends on**: T6
**Reuses**: os testes das tarefas anteriores
**Requirement**: OCC-01

**Done when**:

- [x] `rg` do typo `ocurrence` fora de `.specs/` só acha a init, que permanece, e a migration de `RENAME`, que precisa citar o nome antigo
- [x] Gate check passes: `npx vitest run`
- [x] Test count: a suíte não perde os testes de auth, 401 e inativação

**Tests**: integration
**Gate**: full
**Status**: Complete

---

## Checks

**C1** - Tipos em `types_occurrence`, ocorrências em `occurrences`, likes em `like_occurrences` com coluna `occurrence_id` (OCC-01, AC 1)
Proof: `npx vitest run test/server/db/migrate.test.ts -t "renames occurrence tables"`

**C2** - As seis rotas novas respondem status diferente de 404 (OCC-01, AC 2)
Proof: `npx vitest run test/server/api/route-map.test.ts -t "mounted paths answer"`

**C3** - `server/api/ocurrences` e `server/api/types-ocurrence.get.ts` não existem (OCC-01, AC 3)
Proof: `npx vitest run test/server/api/route-map.test.ts -t "old occurrence route files are gone"`

**C4** - A lista ativa vem na chave `occurrences` (OCC-01, AC 4)
Proof: `npx vitest run test/server/api/occurrences/index.get.test.ts -t "lists under the occurrences key"`

**C5** - Criar devolve a chave `occurrence` (OCC-01, AC 5)
Proof: `npx vitest run test/server/api/occurrences/index.post.test.ts -t "stores and returns longitude first"`

**C6** - Curtir devolve a chave `occurrence` (OCC-01, AC 6)
Proof: `npx vitest run test/server/api/occurrences/like/[id].get.test.ts -t "first like returns occurrence"`

**C7** - Os tipos vêm na chave `types_occurrence` (OCC-01, AC 7)
Proof: `npx vitest run test/server/api/types-occurrence.get.test.ts -t "lists the five seeded types"`

**C8** - A página é `pages/my-occurrences.vue`, título `Minhas Ocorrências`, navbar em `/my-occurrences` (OCC-01, AC 8)
Proof: `npx vitest run test/server/app/page-route.test.ts -t "page file is my-occurrences"`

**C9** - O par `[-46.633308, -23.55052]` grava longitude `-46.633308` e latitude `-23.55052` (OCC-02, AC 1)
Proof: `npx vitest run test/server/api/occurrences/index.post.test.ts -t "stores and returns longitude first"`

**C10** - O mesmo par volta em `occurrence.location.coordinates` (OCC-02, AC 2)
Proof: `npx vitest run test/server/api/occurrences/index.post.test.ts -t "stores and returns longitude first"`

**C11** - `requestPoint([-46.633308, -23.55052])` lê longitude e latitude nessa ordem (OCC-02, AC 3)
Proof: `npx vitest run test/server/domain/occurrences/create.test.ts -t "request point reads longitude first"`

**C12** - `toRequestCoordinates(-23.55052, -46.633308)` devolve `[-46.633308, -23.55052]` e o mapa usa a função (OCC-02, AC 4)
Proof: `npx vitest run test/server/utils/occurrencePoint.test.ts -t "click becomes longitude first"`

**C13** - Ponto que não é um par finito responde 422 e não insere (OCC-02, AC 5)
Proof: `npx vitest run test/server/api/occurrences/index.post.test.ts -t "create rejects a point that is not two finite numbers"`

**C14** - Quinze linhas na página 1 devolvem `page` 1, `per_page` 10, `total` 15 e `data` com tamanho 10 (OCC-03, AC 1)
Proof: `npx vitest run test/server/api/occurrences/my-occurrences.get.test.ts -t "pages the caller ten then five"`

**C15** - Página omitida devolve `page` 1 (OCC-03, AC 2)
Proof: `npx vitest run test/server/api/occurrences/my-occurrences.get.test.ts -t "omitted page is page 1"`

**C16** - `page=0` devolve `page` 1 (OCC-03, AC 3)
Proof: `npx vitest run test/server/api/occurrences/my-occurrences.get.test.ts -t "page zero is page 1"`

**C17** - `page=99` com uma linha devolve `data` vazio, `total` 1 e `page` 99 (OCC-03, AC 4)
Proof: `npx vitest run test/server/api/occurrences/my-occurrences.get.test.ts -t "page past the end is empty"`

**C18** - A lista do usuário não traz as chaves do Laravel (OCC-03, AC 5)
Proof: `npx vitest run test/server/api/occurrences/my-occurrences.get.test.ts -t "mine body omits laravel links"`

**C19** - `page` não inteiro devolve `page` 1 (OCC-03, AC 6)
Proof: `npx vitest run test/server/api/occurrences/my-occurrences.get.test.ts -t "page abc is page 1"`

**C20** - A lista do usuário inclui linha inativa (OCC-03, AC 7)
Proof: `npx vitest run test/server/api/occurrences/my-occurrences.get.test.ts -t "includes inactive rows"`

---

## Handoff

**Settled mid-build:** none
**Dispatched:** batch worker T1–T7 (generalPurpose), sent 2026-11-09, returned. 77 passed. Verifier (generalPurpose) 36972f52, sent 2026-11-09, returned FAIL.
**Walked:** none

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1 → T2
Phase 2:  T3 → T4 → T5
Phase 3:  T6
Phase 4:  T7
```

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Schema e migration | 1 schema, migration colada | OK |
| T2: SQL | queries da ocorrência | OK |
| T3: Eixo | 1 função | OK |
| T4: Envelope | 1 função | OK |
| T5: Rotas | 1 família de rota | OK |
| T6: Cliente | helper e quem chama | OK |
| T7: Suíte | gate final | OK |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | sem seta de entrada | OK |
| T2 | T1 | T1 → T2 | OK |
| T3 | T2 | T2 fica na fase anterior | OK |
| T4 | T3 | T3 → T4 | OK |
| T5 | T4 | T4 → T5 | OK |
| T6 | T5 | T5 fica na fase anterior | OK |
| T7 | T6 | T6 fica na fase anterior | OK |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Migration | integration | integration | OK |
| T2 | Domain | unit | unit | OK |
| T3 | Domain | unit | unit | OK |
| T4 | Domain | unit | unit | OK |
| T5 | Route | integration | integration | OK |
| T6 | Front rule | unit | unit | OK |
| T7 | Route | integration | integration | OK |
