# Separar fluxos do mapa Specification

**Approved**: 2026-11-10 - user: "Implement the plan as specified, it is attached for your reference."

## Problem Statement

`OccurrenceMap.vue` desenha o mapa, monta o rascunho, busca o endereço, carrega o catálogo, guarda o id a encerrar e pede a geolocalização. Cada um muda por um motivo próprio. A página passa a coordenar ponto, diálogos, store e toasts.

## Goals

- [ ] A home deixa de buscar `/api/types-occurrence` para desenhar os pinos.
- [ ] O payload de criação usa a categoria escolhida e nunca `type_id` 1 no lugar de uma categoria vazia.
- [ ] Dois cliques em Informar Problema não gravam o endereço do pedido anterior.
- [ ] O encerramento leva o id no submit. A geolocalização fica no mapa.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Frases dos diálogos, curtida, overlay e o visual do mapa | O corte muda o dono do estado, não a tela. |
| Contrato de `POST /api/occurrences` e de `POST /api/occurrences/inactivate/:id` | O payload e o formulário continuam os de hoje. |
| Limpar a categoria ao fechar ou ao salvar | O reset de hoje só limpa endereço e descrição. |
| Manter o diálogo aberto quando salvar falha | O `finally` de hoje fecha o diálogo. |
| Commit, push ou banco | A aprovação cobre a implementação local. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Falha do catálogo | Toast `Erro` / `Não foi possível carregar as categorias.` / `error`, e `console.error("Erro ao carregar tipos de ocorrência:", error)` no carregamento. Salvar segue desabilitado. | Escolha de 2026-11-10: toast e log. | y |
| Categoria escolhida | Permanece ao fechar e depois de salvar. | `resetCreateForm` hoje não limpa `selectedType`. | y |
| Falha ao salvar | Fecha o diálogo e mostra `mapNotices.createError`. | O `finally` atual fecha nos dois resultados. | y |
| Pedido de endereço abortado | Não preenche o endereço, não liga a nota de erro e não apaga o `carregando` do pedido novo. Ao iniciar o pedido novo, o endereço guardado deixa de ser o anterior. | Dois cliques não podem gravar o primeiro endereço. | y |
| Catálogo já carregado | A abertura seguinte não repete o GET. Uma falha anterior faz a próxima abertura tentar de novo. | A home não precisa da lista. O diálogo precisa dela uma vez, até falhar. | y |
| Geolocalização | O mapa emite `locate-error` com `unavailable` ou `denied`. O pai usa os toasts atuais. O `console.error("Erro ao obter localização:", err)` fica no mapa. | O erro existe no `catch` do mapa. | y |
| Ponto | Continua no `v-model` da página. | O mapa e o diálogo leem o mesmo ponto. | y |
| Retry, TTL, métrica, auth do catálogo | N/A porque este corte não cria prazo, telemetria nem regra nova de sessão. O GET segue na mesma origem. | Nada disso muda o dono do fluxo. | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: A página só coordena ⭐ MVP

**User Story**: Como pessoa na home, quero o mapa sem o catálogo de categorias, para a página não falhar por um dado que os pinos não usam.

**Why P1**: O `onMounted` de hoje busca tipos que a home não desenha.

**Acceptance Criteria**:

1. WHEN the home mounts THEN the page SHALL call `loadOccurrences` and SHALL NOT request `/api/types-occurrence`.
2. The page SHALL NOT read `descricao`, `selectedType`, `enderecoAchado`, or `ocorrenciaRemover`.

**Independent Test**: O fonte da página tem `loadOccurrences` no `onMounted` e não tem a URL do catálogo nem os quatro nomes do rascunho.

---

### P1: A câmera fica no mapa ⭐ MVP

**User Story**: Como pessoa no mapa, quero Localização Atual no próprio mapa, para o pai só mostrar o toast quando a leitura falha.

**Why P1**: `onLocate` na página só existe para chamar `defineExpose`.

**Acceptance Criteria**:

1. WHEN a localização atual chega com latitude -1.45 e longitude -48.49 THEN the placement SHALL be point `{ lat: -1.45, lng: -48.49 }` and view center `[-48.49, -1.45]` at zoom 16.
2. WHEN the browser has no geolocation THEN the map SHALL emit `locate-error` with `unavailable`, and `locateFailureNotice("unavailable")` SHALL be `mapNotices.geoUnavailable`.
3. WHEN geolocation fails THEN the map SHALL emit `locate-error` with `denied` and SHALL log `console.error("Erro ao obter localização:", err)`.
4. The denied notice SHALL be `mapNotices.geoDenied`, including duration 10000 and the description `Verifique se você concedeu permissão de acesso à sua localização para este site nas configurações do navegador e tente novamente.`
5. The map SHALL NOT `defineExpose` `showCurrentLocation` or `occurrenceLngLat`.
6. WHILE a locate request is in flight the Localização Atual control SHALL be disabled and `aria-busy`.

**Independent Test**: `placeCurrentLocation(-1.45, -48.49)` devolve ponto e câmera. O fonte do mapa emite os dois motivos e não tem `defineExpose`.

---

### P1: O rascunho emite o payload ⭐ MVP

**User Story**: Como pessoa que informa um problema, quero salvar a categoria que escolhi, para o pedido não cair na categoria 1 quando o campo está vazio.

**Why P1**: O botão já fica desabilitado sem categoria, e `selectedType ?? 1` fura esse contrato.

**Acceptance Criteria**:

1. WHEN type id is 4, description is `buraco`, point is latitude -1.45 and longitude -48.49, and the address is display_name `Rua X`, city `Belém`, state `Pará`, country `Brasil` THEN the payload SHALL use type_id 4, description `buraco`, location type `Point`, coordinates `[-48.49, -1.45]`, address_name `Rua X`, city `Belém`, state `Pará`, and country `Brasil`.
2. WHEN the category is absent THEN `buildOccurrencePayload` SHALL return null.
3. WHEN the point is absent THEN `buildOccurrencePayload` SHALL return null.
4. WHEN Salvar is used without a point THEN the modal SHALL emit `missing-point` and the page SHALL show `mapNotices.pointRequired`.
5. WHILE the category is empty the Salvar control SHALL be disabled.
6. WHEN save succeeds THEN the page SHALL show `mapNotices.created` and SHALL close the dialog.
7. WHEN save fails THEN the page SHALL show `mapNotices.createError` and SHALL close the dialog.
8. WHEN the create dialog closes THEN the description and the address SHALL clear and the selected category SHALL remain.
9. The create dialog SHALL show the sentence `Não foi possível obter o endereço, mas ainda é possível salvar a ocorrência.`

**Independent Test**: A função pura devolve o payload do exemplo, null sem categoria e null sem ponto. O reset do composable limpa descrição e endereço e mantém a categoria 4.

---

### P1: A busca anterior é cancelada ⭐ MVP

**User Story**: Como pessoa que clica Informar Problema de novo, quero o endereço do último clique, para não salvar o endereço do primeiro pedido.

**Why P1**: Dois cliques seguidos disparam duas buscas, e a primeira pode responder por último.

**Acceptance Criteria**:

1. WHEN a second address search starts before the first resolves THEN the first AbortSignal SHALL be aborted, the stored address SHALL NOT remain the first display_name, and the stored address SHALL become the second display_name when that response arrives.
2. WHILE the second search is still running after the first was aborted, `carregando` SHALL be true.
3. WHEN a search is aborted THEN `erroEndereco` SHALL stay null.
4. WHEN the dialog closes while a search is in flight THEN a late response SHALL NOT set the address.
5. The create draft SHALL expose `carregando` and `erroEndereco` as readonly.

**Independent Test**: Duas buscas sobrepostas com `fetch` adiado. A primeira aborta. O endereço final é o da segunda. Fechar no meio deixa o endereço vazio.

---

### P1: O catálogo abre com o diálogo ⭐ MVP

**User Story**: Como pessoa que abre Criar Ocorrência, quero as categorias nesse momento, para a home não depender dessa lista.

**Why P1**: A falha do catálogo hoje só ia para o console, na carga da página.

**Acceptance Criteria**:

1. WHEN the catalog returns `types_occurrence` `[{ id: 3, name: "Lixo" }]` THEN the options SHALL be `[{ label: "Lixo", value: 3 }]`.
2. WHEN the catalog is already loaded and `ensureLoaded` runs again THEN the system SHALL NOT request `/api/types-occurrence` again.
3. IF `/api/types-occurrence` fails THEN the system SHALL `console.error("Erro ao carregar tipos de ocorrência:", error)` and `mapNotices.typesError` SHALL be `{ title: "Erro", description: "Não foi possível carregar as categorias.", color: "error" }`.
4. WHEN a previous load failed and `ensureLoaded` runs again THEN the system SHALL request `/api/types-occurrence` again.

**Independent Test**: `fetch` simulado. A segunda chamada com lista pronta não pede de novo. A falha loga a frase e a tentativa seguinte pede de novo.

---

### P1: O encerramento leva o id ⭐ MVP

**User Story**: Como dono de uma ocorrência, quero encerrar aquela ocorrência, para o submit não depender de um id guardado fora do diálogo.

**Why P1**: `ocorrenciaRemover` só existe porque o modal não conhece o id.

**Acceptance Criteria**:

1. WHEN occurrence 9 submits `type_closure` `resolved`, `solution_description` `feito`, and `resolution_date` `2026-11-10` THEN the submission SHALL be `{ id: 9, type_closure: "resolved", solution_description: "feito", resolution_date: "2026-11-10" }`.
2. The page SHALL call `occurrenceStore.inactive(data, id)` and SHALL NOT read `ocorrenciaRemover`.

**Independent Test**: `closeOccurrenceSubmission(9, data)` devolve o objeto com id 9. O fonte da página chama `inactive(data, id)`.

---

## Edge Cases

- WHEN the category is absent THEN `buildOccurrencePayload` SHALL return null, not a payload whose `type_id` is 1.
- WHEN the first address response arrives after the second search has started THEN the stored address SHALL NOT become the first display_name.
- IF the catalog request fails THEN the Salvar control SHALL stay disabled because the category stays empty.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| MAP-01 | P1: A página só coordena | Execute | Verified |
| MAP-02 | P1: A câmera fica no mapa | Execute | Verified |
| MAP-03 | P1: O rascunho emite o payload | Execute | Verified |
| MAP-04 | P1: A busca anterior é cancelada | Execute | Verified |
| MAP-05 | P1: O catálogo abre com o diálogo | Execute | Verified |
| MAP-06 | P1: O encerramento leva o id | Execute | Verified |

**Coverage:** 6 total, 6 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] A home monta sem `GET /api/types-occurrence`.
- [ ] Salvar sem categoria não envia `type_id` 1.
- [ ] O endereço gravado no rascunho é o da última busca não cancelada.
- [ ] Encerrar a ocorrência 9 envia o id 9 junto com o formulário.
