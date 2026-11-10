# Mapa MapLibre Tasks

**Approved**: 2026-11-10 - user: "Implement the plan as specified, it is attached for your reference."
**Mutations**: 3
**Build**: `npx vitest run; npm run build`

---

## Test Coverage Matrix

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Basemap | unit | URL, tileSize, maxzoom, atribuição, centro e zoom | `test/server/utils/mapBasemap.test.ts` | `npx vitest run test/server/utils/mapBasemap.test.ts` |
| Popup | unit | Texto, script ausente, dono, like, informar | `test/server/components/mapPopupContent.test.ts` | `npx vitest run test/server/components/mapPopupContent.test.ts` |
| Notices | unit | Frases de toast e endereço curto | `test/server/utils/mapNotices.test.ts` | `npx vitest run test/server/utils/mapNotices.test.ts` |
| Page contract | unit | `toRequestCoordinates`, `/api/types-occurrence`, sem `document` click, sem `leaflet` | `test/server/utils/occurrencePoint.test.ts`, `test/server/app/session-client.test.ts`, `test/server/app/occurrence-map.test.ts` | `npx vitest run test/server/utils/occurrencePoint.test.ts test/server/app/session-client.test.ts test/server/app/occurrence-map.test.ts` |
| Browser | manual | Tile, clique, popup, modal, localização | página `/` com o dev server | passe no browser depois do último teste |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Depois de helper, popup ou página | `npx vitest run test/server/utils/mapBasemap.test.ts test/server/utils/mapNotices.test.ts test/server/components/mapPopupContent.test.ts test/server/utils/occurrencePoint.test.ts test/server/app/session-client.test.ts test/server/app/occurrence-map.test.ts` |
| Full | Página fechada | `npx vitest run` |
| Build | Última tarefa da fase | `npx vitest run; npm run build` |

---

## Execution Plan

### Phase 1: Engine

```
T1 -> T4 -> T5
T2 -> T3 -> T4
```

### Phase 2: Visual

```
T6
```

---

## Task Breakdown

### Phase 1: Engine

### T1: Estilo raster

**What**: Função pura do estilo MapLibre. Com chave, Voyager, `tileSize` 256, `maxzoom` 20 e a atribuição CARTO. Sem chave, OpenStreetMap, `maxzoom` 19. Centro `[-48.49, -1.45]`, zoom 13, zoom de localização 16. O par do marcador lê `coordinates[0]` como longitude.
**Where**: `utils/mapBasemap.ts`
**Depends on**: None
**Reuses**: URL e atribuição de `components/map/LeafletMap.vue`
**Requirement**: MAP-01, MAP-02, MAP-03, MAP-04

**Done when**:

- [x] O teste com chave contém a URL Voyager, `tileSize` 256, `maxzoom` 20 e a atribuição CARTO
- [x] O teste sem chave contém a URL do OpenStreetMap, `tileSize` 256, `maxzoom` 19 e a atribuição OSM
- [x] Centro e zooms são os números da spec
- [x] Gate check passes: `npx vitest run test/server/utils/mapBasemap.test.ts`

**Tests**: unit
**Gate**: quick

---

### T2: Catálogo de ícones sem Leaflet

**What**: `markerIcons` guarda `iconUrl`, `iconSize`, `iconAnchor` e `nome`. Sem `import` de `leaflet`. A legenda lista os cinco nomes e omite `Problema Desconhecido`.
**Where**: `util/makerIcons.ts`
**Depends on**: None
**Reuses**: PNGs em `public/images/marking-icons/`
**Requirement**: MAP-10

**Done when**:

- [x] O arquivo não contém `leaflet`
- [x] Os cinco nomes da legenda e o nome padrão existem
- [x] Gate check passes: `npx vitest run test/server/utils/mapNotices.test.ts`

**Tests**: unit
**Gate**: quick

---

### T3: Popup Vue

**What**: `MapPopupContent.vue` mostra rascunho e ocorrência. Endereço curto é texto. `Informar Problema`, curtir e `Encerrar` emitem eventos. `Encerrar` só para o dono.
**Where**: `components/map/MapPopupContent.vue`
**Depends on**: T2
**Reuses**: `tempoAtras` e a regra das duas partes do endereço
**Requirement**: MAP-05, MAP-09

**Done when**:

- [x] O endereço de script aparece como texto e o HTML não tem elemento `script`
- [x] O nome `<img src=x onerror=alert(1)>` não cria `img`
- [x] Dono vê `Encerrar`. Outra pessoa não vê
- [x] Curtir pressionado mostra `4`
- [x] Gate check passes: `npx vitest run test/server/components/mapPopupContent.test.ts`

**Tests**: unit
**Gate**: quick

---

### T4: Mapa MapLibre

**What**: `MapLibreMap.vue` usa o estilo raster, marcadores no par longitude/latitude, marcador arrastável, popup Vue e a legenda. Clique no mapa não passa por `document`.
**Where**: `components/map/MapLibreMap.vue`
**Depends on**: T1, T3
**Reuses**: `utils/mapBasemap.ts`, `components/map/MapPopupContent.vue`
**Requirement**: MAP-05, MAP-08, MAP-11

**Done when**:

- [x] O componente não importa `leaflet`
- [x] O componente não registra `document.addEventListener`
- [x] Gate check passes: `npx vitest run test/server/app/occurrence-map.test.ts`

**Tests**: unit
**Gate**: quick

---

### T5: Página e saída do Leaflet

**What**: `OccurrenceMap.vue` fica com lojas, toasts, geolocalização e os dois diálogos. `pages/index.vue` usa esse componente dentro de `ClientOnly`. `nuxt-maplibre` entra no Nuxt. `leaflet` e `@types/leaflet` saem. `formatTableAddress` permanece. O HTML do popup sai.
**Where**: `components/map/OccurrenceMap.vue`
**Depends on**: T4
**Reuses**: toasts e formulários de `components/map/LeafletMap.vue`
**Requirement**: MAP-06, MAP-07, MAP-12, MAP-13, MAP-14, MAP-15

**Done when**:

- [x] `occurrencePoint.test.ts` lê `OccurrenceMap.vue` e exige `toRequestCoordinates(latitude, longitude)`
- [x] `session-client.test.ts` acha `/api/types-occurrence` no arquivo novo
- [x] `LeafletMap.vue` não existe e o código da página não importa `leaflet`
- [x] Gate check passes: `npx vitest run`

**Tests**: unit
**Gate**: full

---

### Phase 2: Visual

### T6: Redesenho da página

**What**: Um subagent com a skill `frontend-design` redesenha a casca, o popup, a legenda, o botão `Localização Atual`, o loading e os dois modais. Frases, campos, `UModal` e eventos permanecem. Sem `app.config`, navbar ou outras páginas.
**Where**: `components/map/CreateOccurrenceModal.vue`
**Depends on**: T5
**Reuses**: frases do P1
**Requirement**: MAP-16

**Done when**:

- [x] Os testes de frase do P1 continuam verdes
- [x] Criar e encerrar seguem `UModal`
- [x] Gate check passes: `npx vitest run`
- [x] Build passes: `npm run build`

**Tests**: unit
**Gate**: build

---

## Handoff

**Dispatched:** visual frontend-design subagent for T6, templates of the occurrences page. 2026-11-10.
**Dispatched:** independent Verifier for mapa-maplibre. 2026-11-10.

---

## Checks

**C1** - Com chave, a URL Voyager, `tileSize` 256, `maxzoom` 20 e a atribuição CARTO (MAP-01)
Proof: `npx vitest run test/server/utils/mapBasemap.test.ts -t "voyager raster"`

**C2** - Sem chave, OpenStreetMap, `tileSize` 256, `maxzoom` 19 e a atribuição OSM (MAP-02)
Proof: `npx vitest run test/server/utils/mapBasemap.test.ts -t "openstreetmap raster"`

**C3** - Centro longitude -48.49, latitude -1.45, zoom 13 (MAP-03)
Proof: `npx vitest run test/server/utils/mapBasemap.test.ts -t "opens at Belem"`

**C4** - Localização atual usa zoom 16 (MAP-04)
Proof: `npx vitest run test/server/utils/mapBasemap.test.ts -t "current location zoom"`

**C5** - Popup de rascunho mostra `Informar Problema` (MAP-05)
Proof: `npx vitest run test/server/components/mapPopupContent.test.ts -t "draft popup says Informar Problema"`

**C6** - O payload usa `toRequestCoordinates` com latitude e longitude (MAP-07)
Proof: `npx vitest run test/server/utils/occurrencePoint.test.ts -t "click becomes longitude first"`

**C7** - O marcador lê longitude em `coordinates[0]` (MAP-08)
Proof: `npx vitest run test/server/utils/mapBasemap.test.ts -t "geojson longitude first"`

**C8** - Endereço de script é texto e não cria elemento `script` (MAP-09)
Proof: `npx vitest run test/server/components/mapPopupContent.test.ts -t "address script is text"`

**C9** - `Encerrar` só para o dono (MAP-09)
Proof: `npx vitest run test/server/components/mapPopupContent.test.ts -t "encerrar follows the owner"`

**C10** - Like pressionado mostra a contagem 4 (MAP-09)
Proof: `npx vitest run test/server/components/mapPopupContent.test.ts -t "liked count is pressed"`

**C11** - Toasts de login, ponto, salvar, curtir, inativar e geolocalização usam as frases da spec (MAP-12)
Proof: `npx vitest run test/server/utils/mapNotices.test.ts -t "map notices"`

**C12** - A página não escuta clique no `document` (MAP-13)
Proof: `npx vitest run test/server/app/occurrence-map.test.ts -t "page omits document click"`

**C13** - Tipos vêm de `/api/types-occurrence` (MAP-14)
Proof: `npx vitest run test/server/app/session-client.test.ts -t "map loads types from the same origin"`

**C14** - A legenda tem os cinco nomes e omite `Problema Desconhecido` (MAP-10)
Proof: `npx vitest run test/server/utils/mapNotices.test.ts -t "legend names"`

**C15** - O código do mapa não importa `leaflet` (MAP-15)
Proof: `npx vitest run test/server/app/occurrence-map.test.ts -t "map omits leaflet"`

**C16** - Criar e encerrar continuam diálogos `UModal` com as frases (MAP-16)
Proof: `npx vitest run test/server/app/occurrence-map.test.ts -t "dialogs keep their phrases"`
