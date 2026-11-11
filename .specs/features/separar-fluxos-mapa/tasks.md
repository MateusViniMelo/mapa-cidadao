# Separar fluxos do mapa Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/separar-fluxos-mapa/design.md`
**Status**: Done
**Approved**: 2026-11-10 - user: "Implement the plan as specified, it is attached for your reference."
**Mutations**: 3
**Build**: `npx vitest run; npm run build`

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none - strong defaults applied. O Vitest inclui só `test/server/**/*.test.ts` (`vitest.config.ts`). Não há script de lint. O typecheck entra em `npm run build`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Payload, aviso e câmera pura | unit | Cada campo do MAP-03 AC 1 e o null do AC 2 e do AC 3; o aviso do MAP-05 AC 3; o ponto do MAP-02 AC 1 | `test/server/utils/*.test.ts` | `npx vitest run test/server/utils/occurrencePayload.test.ts test/server/utils/mapNotices.test.ts test/server/utils/mapBasemap.test.ts` |
| Busca, catálogo e rascunho | unit | Todos os ramos de aborto, lista vazia e lista pronta; 1:1 com MAP-04 e MAP-05 | `test/server/composables/*.test.ts` | `npx vitest run test/server/composables` |
| Página Vue e diálogos | unit | Cada gesto do MAP-01, MAP-02 AC 2 a AC 6, MAP-03 AC 4 a AC 7 e AC 9, e MAP-06 AC 2, lendo o arquivo que o Vitest alcança | `test/server/app/*.test.ts` | `npx vitest run test/server/app/occurrence-map.test.ts test/server/app/session-client.test.ts` |

## Gate Check Commands

> Generated from codebase - confirm before Execute. Não existe `npm run lint`. O typecheck entra em `npm run build`.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Depois de tarefa com teste de função ou de arquivo | `npx vitest run test/server/utils/occurrencePayload.test.ts test/server/utils/mapNotices.test.ts test/server/utils/mapBasemap.test.ts test/server/composables test/server/app/occurrence-map.test.ts test/server/app/session-client.test.ts` |
| Full | Depois de tarefa que cruza a página e a store | `npx vitest run` |
| Build | Depois da última tarefa da fase | `npx vitest run; npm run build` |

---

## Execution Plan

Uma fase. Oito tarefas, uma leva, neste agente.

### Phase 1: Donos

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8
```

---

## Task Breakdown

### T1: Contratos puros ✅

**What**: `buildOccurrencePayload`, `closeOccurrenceSubmission`, `mapNotices.typesError` e `locateFailureNotice`.
**Where**: `utils/occurrencePayload.ts`
**Depends on**: None
**Reuses**: `toRequestCoordinates` e `mapNotices.geoDenied`
**Requirement**: MAP-03, MAP-06, MAP-02

**Done when**:

- [x] O payload do exemplo traz type_id 4 e coordinates `[-48.49, -1.45]`
- [x] Sem categoria e sem ponto o retorno é null
- [x] O submit da ocorrência 9 traz id 9
- [x] O toast de categorias e os dois motivos de geolocalização batem com o spec
- [x] Gate check passes: `npx vitest run test/server/utils/occurrencePayload.test.ts test/server/utils/mapNotices.test.ts`

**Tests**: unit
**Gate**: quick

---

### T2: Busca com cancelamento ✅

**What**: `buscarEndereco` aceita `AbortSignal`. Pedido antigo não escreve erro nem apaga o `carregando` do pedido novo. As duas refs saem `readonly`.
**Where**: `composables/useReverseGeocoding.ts`
**Depends on**: T1
**Reuses**: `fetch` de `/api/reverse-geocoding`
**Requirement**: MAP-04

**Done when**:

- [x] AbortError deixa `erroEndereco` null
- [x] O `finally` do pedido 1 não zera `carregando` enquanto o pedido 2 segue
- [x] `isReadonly` é true nas duas refs
- [x] Gate check passes: `npx vitest run test/server/composables/useReverseGeocoding.test.ts`

**Tests**: unit
**Gate**: quick

---

### T3: Catálogo sob demanda ✅

**What**: `useOccurrenceTypes` pede `/api/types-occurrence` em `ensureLoaded`, não repete com lista pronta, loga a falha e tenta de novo depois dela.
**Where**: `composables/useOccurrenceTypes.ts`
**Depends on**: T2
**Reuses**: o formato `{ types_occurrence }` de `server/api/types-occurrence.get.ts`
**Requirement**: MAP-05

**Done when**:

- [x] `[{ id: 3, name: "Lixo" }]` vira `[{ label: "Lixo", value: 3 }]`
- [x] A segunda chamada com lista pronta não pede de novo
- [x] A falha loga `Erro ao carregar tipos de ocorrência:` e a chamada seguinte pede de novo
- [x] Gate check passes: `npx vitest run test/server/composables/useOccurrenceTypes.test.ts`

**Tests**: unit
**Gate**: quick

---

### T4: Rascunho de criação ✅

**What**: `useCreateOccurrence` guarda descrição, categoria, endereço e o `AbortController`. `begin` cancela a busca anterior. `resetDraft` limpa descrição e endereço e mantém a categoria.
**Where**: `composables/useCreateOccurrence.ts`
**Depends on**: T3
**Reuses**: `useReverseGeocoding`, `useOccurrenceTypes` e `buildOccurrencePayload`
**Requirement**: MAP-03, MAP-04

**Done when**:

- [x] A segunda busca grava o display_name dela, e a resposta tardia da primeira não substitui
- [x] Fechar no meio deixa o endereço null
- [x] O reset mantém a categoria 4
- [x] Gate check passes: `npx vitest run test/server/composables/useCreateOccurrence.test.ts`

**Tests**: unit
**Gate**: quick

---

### T5: Geolocalização no mapa ✅

**What**: O botão Localização Atual pede a posição, faz `jumpTo` com `placeCurrentLocation`, grava o ponto, incrementa `focusToken` e emite `locate-error`. Sem `defineExpose` e sem a prop `locating`.
**Where**: `components/map/MapLibreMap.vue`
**Depends on**: T4
**Reuses**: `currentLocationView`
**Requirement**: MAP-02

**Done when**:

- [x] `placeCurrentLocation(-1.45, -48.49)` devolve o ponto e o zoom 16
- [x] O fonte emite `unavailable` e `denied`, loga o erro de localização e não tem `defineExpose`
- [x] O botão usa `:disabled="locating"` e `:aria-busy="locating"`
- [x] Gate check passes: `npx vitest run test/server/utils/mapBasemap.test.ts test/server/app/occurrence-map.test.ts`

**Tests**: unit
**Gate**: quick

---

### T6: Diálogo emite o payload ✅

**What**: `CreateOccurrenceModal` usa o rascunho, emite `submit` com o payload, `missing-point` sem ponto e `types-error` quando o catálogo falha. Salvar segue desabilitado sem categoria.
**Where**: `components/map/CreateOccurrenceModal.vue`
**Depends on**: T5
**Reuses**: `useCreateOccurrence` e a frase de endereço já no diálogo
**Requirement**: MAP-03, MAP-05

**Done when**:

- [x] O fonte emite `missing-point` e desabilita Salvar com `selectedType == null`
- [x] A frase do endereço permanece
- [x] Gate check passes: `npx vitest run test/server/app/occurrence-map.test.ts`

**Tests**: unit
**Gate**: quick

---

### T7: Encerramento com id ✅

**What**: `CloseOccurrenceModal` recebe `occurrenceId` e emite `closeOccurrenceSubmission`.
**Where**: `components/map/CloseOccurrenceModal.vue`
**Depends on**: T6
**Reuses**: `closeOccurrenceSubmission`
**Requirement**: MAP-06

**Done when**:

- [x] O fonte chama `closeOccurrenceSubmission(props.occurrenceId, event.data)`
- [x] Gate check passes: `npx vitest run test/server/utils/occurrencePayload.test.ts test/server/app/occurrence-map.test.ts`

**Tests**: unit
**Gate**: quick

---

### T8: Página coordenadora ✅

**What**: `OccurrenceMap` fica com ponto, login, curtida, toasts e as chamadas da store. O `onMounted` só carrega ocorrências. O encerramento usa o id do submit.
**Where**: `components/map/OccurrenceMap.vue`
**Depends on**: T7
**Reuses**: `locateFailureNotice`, `mapNotices` e `occurrenceStore`
**Requirement**: MAP-01, MAP-02, MAP-03, MAP-06

**Done when**:

- [x] A página não lê o rascunho nem `ocorrenciaRemover` e chama `inactive(data, id)`
- [x] Salvar fecha o diálogo no sucesso e no erro
- [x] O catálogo sai de `OccurrenceMap.vue` e permanece em `useOccurrenceTypes.ts`
- [x] Gate check passes: `npx vitest run; npm run build`
- [x] Test count: a suíte inteira passa, sem teste removido

**Tests**: unit
**Gate**: build

---

## Checks

**C1** - A home chama `loadOccurrences` e não pede `/api/types-occurrence` (MAP-01, AC 1)
Proof: `npx vitest run test/server/app/occurrence-map.test.ts -t "home skips the catalog"`

**C2** - A página não lê `descricao`, `selectedType`, `enderecoAchado` nem `ocorrenciaRemover` (MAP-01, AC 2)
Proof: `npx vitest run test/server/app/occurrence-map.test.ts -t "page leaves the draft"`

**C3** - Latitude -1.45 e longitude -48.49 viram ponto `{ lat: -1.45, lng: -48.49 }` e centro `[-48.49, -1.45]` no zoom 16 (MAP-02, AC 1)
Proof: `npx vitest run test/server/utils/mapBasemap.test.ts -t "current location places the point and the camera"`

**C4** - Sem geolocalização o mapa emite `unavailable` e o aviso é `mapNotices.geoUnavailable` (MAP-02, AC 2)
Proof: `npx vitest run test/server/app/occurrence-map.test.ts -t "missing geolocation uses the unavailable notice"`

**C5** - Falha de geolocalização emite `denied` e loga `Erro ao obter localização:` (MAP-02, AC 3)
Proof: `npx vitest run test/server/app/occurrence-map.test.ts -t "denied geolocation logs and emits denied"`

**C6** - O aviso de permissão é `mapNotices.geoDenied`, com duration 10000 e a descrição de permissão (MAP-02, AC 4)
Proof: `npx vitest run test/server/utils/mapNotices.test.ts -t "denied geolocation uses the denied notice"`

**C7** - O mapa não tem `defineExpose` (MAP-02, AC 5)
Proof: `npx vitest run test/server/app/occurrence-map.test.ts -t "map does not expose the camera"`

**C8** - O botão Localização Atual fica `disabled` e `aria-busy` enquanto localiza (MAP-02, AC 6)
Proof: `npx vitest run test/server/app/occurrence-map.test.ts -t "locate button owns its busy state"`

**C9** - O payload de exemplo usa type_id 4, description `buraco` e coordinates `[-48.49, -1.45]` com o endereço Rua X, Belém, Pará, Brasil (MAP-03, AC 1)
Proof: `npx vitest run test/server/utils/occurrencePayload.test.ts -t "payload keeps the chosen type and the geojson point"`

**C10** - Sem categoria o payload é null (MAP-03, AC 2)
Proof: `npx vitest run test/server/utils/occurrencePayload.test.ts -t "payload refuses a missing category"`

**C11** - Sem ponto o payload é null (MAP-03, AC 3)
Proof: `npx vitest run test/server/utils/occurrencePayload.test.ts -t "payload refuses a missing point"`

**C12** - Salvar sem ponto emite `missing-point` e a página mostra `mapNotices.pointRequired` (MAP-03, AC 4)
Proof: `npx vitest run test/server/app/occurrence-map.test.ts -t "save without a point asks the page"`

**C13** - Salvar fica desabilitado com a categoria vazia (MAP-03, AC 5)
Proof: `npx vitest run test/server/app/occurrence-map.test.ts -t "save stays disabled without a category"`

**C14** - Salvar com sucesso mostra `Ocorrência salva com sucesso.` e fecha o diálogo (MAP-03, AC 6)
Proof: `npx vitest run test/server/app/occurrence-map.test.ts -t "save closes the dialog on success"`

**C15** - Salvar com falha mostra `Não foi possível salvar ocorrência.` e fecha o diálogo (MAP-03, AC 7)
Proof: `npx vitest run test/server/app/occurrence-map.test.ts -t "save closes the dialog on error"`

**C16** - Fechar o diálogo limpa descrição e endereço e mantém a categoria 4 (MAP-03, AC 8)
Proof: `npx vitest run test/server/composables/useCreateOccurrence.test.ts -t "reset keeps the category"`

**C17** - O diálogo mostra `Não foi possível obter o endereço, mas ainda é possível salvar a ocorrência.` (MAP-03, AC 9)
Proof: `npx vitest run test/server/app/occurrence-map.test.ts -t "dialogs keep their phrases"`

**C18** - A segunda busca aborta a primeira e grava o display_name da segunda (MAP-04, AC 1)
Proof: `npx vitest run test/server/composables/useCreateOccurrence.test.ts -t "a second search keeps its address"`

**C19** - Enquanto a segunda busca corre, `carregando` fica true (MAP-04, AC 2)
Proof: `npx vitest run test/server/composables/useCreateOccurrence.test.ts -t "the newer search stays loading"`

**C20** - Busca abortada deixa `erroEndereco` null (MAP-04, AC 3)
Proof: `npx vitest run test/server/composables/useReverseGeocoding.test.ts -t "an aborted search does not raise the address error"`

**C21** - Fechar no meio não grava a resposta tardia (MAP-04, AC 4)
Proof: `npx vitest run test/server/composables/useCreateOccurrence.test.ts -t "closing drops a late address"`

**C22** - `carregando` e `erroEndereco` são readonly (MAP-04, AC 5)
Proof: `npx vitest run test/server/composables/useReverseGeocoding.test.ts -t "address flags are readonly"`

**C23** - O tipo Lixo id 3 vira a opção `{ label: "Lixo", value: 3 }` (MAP-05, AC 1)
Proof: `npx vitest run test/server/composables/useOccurrenceTypes.test.ts -t "opening loads category labels"`

**C24** - Lista pronta, mesmo vazia, não pede `/api/types-occurrence` de novo (MAP-05, AC 2)
Proof: `npx vitest run test/server/composables/useOccurrenceTypes.test.ts -t "catalog is not requested again"`

**C25** - Falha do catálogo loga `Erro ao carregar tipos de ocorrência:` e o toast é `Não foi possível carregar as categorias.` (MAP-05, AC 3)
Proof: `npx vitest run test/server/composables/useOccurrenceTypes.test.ts -t "a catalog failure logs the category error"`

**C26** - Depois da falha, a abertura seguinte pede `/api/types-occurrence` de novo (MAP-05, AC 4)
Proof: `npx vitest run test/server/composables/useOccurrenceTypes.test.ts -t "a failed catalog is requested on the next open"`

**C27** - O submit da ocorrência 9 traz id 9, `resolved`, `feito` e `2026-11-10` (MAP-06, AC 1)
Proof: `npx vitest run test/server/utils/occurrencePayload.test.ts -t "close submission carries the occurrence id"`

**C28** - A página chama `occurrenceStore.inactive(data, id)` e não lê `ocorrenciaRemover` (MAP-06, AC 2)
Proof: `npx vitest run test/server/app/occurrence-map.test.ts -t "page inactivates with the submitted id"`

**C29** - Sem categoria o retorno não é um payload com type_id 1 (MAP-03, edge)
Proof: `npx vitest run test/server/utils/occurrencePayload.test.ts -t "payload does not invent type 1"`

**C30** - A resposta tardia da primeira busca não substitui o endereço da segunda (MAP-04, edge)
Proof: `npx vitest run test/server/composables/useCreateOccurrence.test.ts -t "a late first address does not win"`

**C31** - Falha do catálogo deixa a categoria vazia e Salvar desabilitado (MAP-05, edge)
Proof: `npx vitest run test/server/composables/useOccurrenceTypes.test.ts -t "a catalog failure leaves the category empty"`

---

## Handoff

**Settled mid-build:** none
**Dispatched:** Verifier (independent sub-agent) — spec.md, tasks.md ## Checks, proofs.md, validate.md. No captures.
**Walked:** Home em `/` sem sessão: o mapa desenha os pinos e o botão Localização Atual; o clique no mapa abre o popup Informar Problema; sem login o aviso é "Faça o login pra informar uma ocorrência". Com um usuário só na memória, o diálogo Criar Ocorrência abre, o catálogo lista as cinco categorias, o endereço do ponto aparece e Salvar fica desabilitado. Encerrar a ocorrência 1 abre o diálogo com `occurrenceId` 1 e a pergunta "Qual o motivo do encerramento?". Nada foi gravado.

---

## Phase Execution Map

```
Phase 1

Phase 1:  T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8
```

Execution is strictly sequential. Eight tasks fit one batch, so this agent runs them inline.

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | Funções puras e avisos | Granular |
| T2 | Um composable | Granular |
| T3 | Um composable | Granular |
| T4 | Um composable | Granular |
| T5 | Um componente | Granular |
| T6 | Um componente | Granular |
| T7 | Um componente | Granular |
| T8 | Uma página | Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | início | Match |
| T2 | T1 | T1 → T2 | Match |
| T3 | T2 | T2 → T3 | Match |
| T4 | T3 | T3 → T4 | Match |
| T5 | T4 | T4 → T5 | Match |
| T6 | T5 | T5 → T6 | Match |
| T7 | T6 | T6 → T7 | Match |
| T8 | T7 | T7 → T8 | Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Payload e aviso | unit | unit | OK |
| T2 | Busca | unit | unit | OK |
| T3 | Catálogo | unit | unit | OK |
| T4 | Rascunho | unit | unit | OK |
| T5 | Mapa | unit | unit | OK |
| T6 | Diálogo de criação | unit | unit | OK |
| T7 | Diálogo de encerramento | unit | unit | OK |
| T8 | Página Vue | unit | unit | OK |
