# Contrato occurrence Specification

**Approved**: 2026-11-09 - user: "Implement the plan as specified, it is attached for your reference."

## Problem Statement

O contrato ainda carrega o typo `ocurrence`, o pedido manda `[latitude, longitude]` e a lista do usuário devolve o envelope do Laravel (`links`, `Previous`, `Next`). O app não foi lançado. Este corte grava o nome `occurrence`, o par GeoJSON nos dois sentidos e a página `{ data, page, per_page, total }`.

## Goals

- [ ] Tabelas, rotas, chaves JSON e identificadores com o typo `ocurrence` passam a `occurrence`.
- [ ] O ponto `[-46.633308, -23.55052]` entra e sai como longitude, latitude, e o banco guarda esse par.
- [ ] `GET /api/occurrences/my-occurrences` devolve só `data`, `page`, `per_page` e `total`. A página abre em `/my-occurrences`.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Sessão em cookie HttpOnly | Ajuste seguinte. O Bearer atual permanece. |
| Remover Flowbite | Fora do contrato. |
| Índice GiST e filtro por viewport | Fora do contrato. |
| Repositório SQL separado do Prisma | Fora do contrato. |
| Zod compartilhado | Fora do contrato. |
| `stores/ocorrencias.ts` e `interfaces/Ocorrencia.ts` | Protótipo em português. O typo inglês não está nesses arquivos. |
| Popup em componente Vue | Fora do contrato. |
| Like de GET para POST | O verbo desta rota permanece GET. |
| Faixa extra de latitude e longitude | Continua valendo número finito. Sem intervalo novo. |
| Rota DELETE de ocorrência | Continua inexistente. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| A página `/my-ocurrences` vira `/my-occurrences` | Sim, e o texto "Minhas Ocorrências" fica | Escolha do usuário em 2026-11-09: API, banco, tipos e a página | y |
| Envelope da lista do usuário | `{ data, page, per_page, total }` | Escolha do usuário em 2026-11-09: snake_case, igual ao resto da API | y |
| `per_page` | 10 | O corte já pagina de 10 em 10 | y |
| Página omitida, não inteira ou menor que 1 | `page` 1 | `readPage` e `sliceMine` já fazem isso | y |
| Página além do fim | `data` vazio, `total` real, `page` igual ao pedido (mínimo 1) | `sliceMine` não corta o número pedido quando ele é inteiro e maior que 0 | y |
| Chave do catálogo | `types_occurrence` | O typo `ocurrence` sai de toda chave JSON, inclusive o catálogo | y |
| Eixo antigo | Sem compatibilidade | O app não foi lançado. O primeiro número é longitude | y |
| Frase de eixo do AD-001 | Substituída por AD-003 | O plano aprovado troca só o eixo. Nitro e PostGIS seguem no AD-003 | y |
| Migration | Arquivo novo de `RENAME`, a init permanece | Reescrever a init quebra o checksum de um banco que já aplicou | y |
| Asserções de auth sem `password` e sem `remember_token` | Permanecem | Não fazem parte do envelope de ocorrência | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Nome occurrence ⭐ MVP

**User Story**: Como cliente da API, quero rotas e JSON com `occurrence` para não carregar o typo do Laravel.

**Why P1**: Nome errado em tabela e rota prende todo contrato futuro.

**Acceptance Criteria**:

1. The system SHALL persist type rows in `types_occurrence`, occurrence rows in `occurrences`, and like rows in `like_occurrences` with column `occurrence_id`.
2. The system SHALL respond with a status other than 404 for `GET /api/occurrences`, `POST /api/occurrences`, `POST /api/occurrences/inactivate/1`, `GET /api/occurrences/like/1`, `GET /api/occurrences/my-occurrences`, and `GET /api/types-occurrence`.
3. The system SHALL NOT keep `server/api/ocurrences` or `server/api/types-ocurrence.get.ts`.
4. WHEN a client lists active occurrences THEN the system SHALL return the list under the key `occurrences`.
5. WHEN a client creates an occurrence THEN the system SHALL return the row under the key `occurrence`.
6. WHEN a client likes an occurrence THEN the system SHALL return the row under the key `occurrence`.
7. WHEN a client lists types THEN the system SHALL return the list under the key `types_occurrence`.
8. The system SHALL serve the signed-in list page at `pages/my-occurrences.vue` with `definePageMeta` title `Minhas Ocorrências`, and the navbar SHALL link to `/my-occurrences`.

**Independent Test**: Chamar as seis rotas novas e abrir `/my-occurrences` pelo menu "Minhas Ocorrências".

---

### P1: Ponto GeoJSON ⭐ MVP

**User Story**: Como quem marca um ponto no mapa, quero o mesmo par `[longitude, latitude]` na ida e na volta para o pino cair em São Paulo.

**Why P1**: O eixo invertido grava a cidade no lugar errado assim que o pedido também for GeoJSON.

**Acceptance Criteria**:

1. WHEN an authenticated client posts a Point with coordinates `[-46.633308, -23.55052]` THEN the system SHALL store longitude `-46.633308` and latitude `-23.55052`.
2. WHEN an authenticated client posts a Point with coordinates `[-46.633308, -23.55052]` THEN the system SHALL return `occurrence.location.coordinates` as `[-46.633308, -23.55052]`.
3. The system SHALL read `requestPoint([-46.633308, -23.55052])` as longitude `-46.633308` and latitude `-23.55052`.
4. The system SHALL return `[-46.633308, -23.55052]` from `toRequestCoordinates(-23.55052, -46.633308)`, and `components/map/LeafletMap.vue` SHALL build the create payload with `toRequestCoordinates`.
5. IF `location.coordinates` is not a pair of finite numbers THEN the system SHALL respond 422 and SHALL NOT insert a row.

**Independent Test**: Criar a ocorrência de São Paulo e ler `ST_X`, `ST_Y` e o JSON.

---

### P1: Lista do usuário ⭐ MVP

**User Story**: Como usuário autenticado, quero a minha lista com `data`, `page`, `per_page` e `total` para paginar sem o envelope do Laravel.

**Why P1**: O front só usa essas quatro informações. O resto é o contrato antigo.

**Acceptance Criteria**:

1. WHEN an authenticated client requests `GET /api/occurrences/my-occurrences?page=1` with 15 rows THEN the system SHALL return `page` 1, `per_page` 10, `total` 15, and `data` with length 10.
2. WHEN an authenticated client omits `page` THEN the system SHALL return `page` 1.
3. WHEN an authenticated client requests `page=0` THEN the system SHALL return `page` 1.
4. WHEN an authenticated client requests `page=99` and has 1 row THEN the system SHALL return `data` as `[]`, `total` 1, and `page` 99.
5. WHEN an authenticated client requests the mine list THEN the system SHALL omit `links`, `from`, `to`, `path`, `current_page`, `first_page_url`, `last_page_url`, `next_page_url`, and `prev_page_url`.
6. IF `page` is not an integer THEN the system SHALL return `page` 1.
7. The system SHALL include an inactive row in the authenticated user's list.

**Independent Test**: Pedir a página 1 com 15 linhas e a página 99 com uma linha.

---

## Edge Cases

- IF `location.coordinates` is not a pair of finite numbers THEN the system SHALL respond 422 and SHALL NOT insert a row.
- IF `page` is not an integer THEN the system SHALL return `page` 1.
- The system SHALL keep including inactive rows in the authenticated user's list.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| OCC-01 | P1: Nome occurrence | Tasks | Verified |
| OCC-02 | P1: Ponto GeoJSON | Tasks | Verified |
| OCC-03 | P1: Lista do usuário | Tasks | Verified |

**Coverage:** 3 total, 3 mapped to tasks, 0 unmapped.

---

## Sources

- Plano Contrato occurrence, aprovado em 2026-11-09 - rename, eixo GeoJSON e envelope de quatro chaves
- Escolha de página em 2026-11-09 - "API, banco, tipos e a página /my-occurrences. Textos em português (Ocorrências) ficam."
- Escolha de envelope em 2026-11-09 - "{ data, page, per_page, total } — snake_case, igual ao resto da API"

---

## Success Criteria

- [ ] Nenhuma rota, tabela, chave JSON ou identificador de código contém o typo `ocurrence`.
- [ ] O par de São Paulo `[-46.633308, -23.55052]` entra, grava e volta igual.
- [ ] A lista do usuário não tem `links` nem `Previous`.
