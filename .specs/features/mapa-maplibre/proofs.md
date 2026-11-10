# mapa-maplibre proofs

**HEAD**: b391d33
**Tree**: dirty - components/map/CloseOccurrenceModal.vue, components/map/CreateOccurrenceModal.vue, components/map/LeafletMap.vue, components/map/MapLoadingOverlay.vue, interfaces/ILocationPoint.ts
**Result**: 18 pass, 0 fail; mutations 0 killed, 3 not

| Check | Proof | Ran | Passed | Result |
| --- | --- | --- | --- | --- |
| C1 | `npx vitest run test/server/utils/mapBasemap.test.ts -t "voyager raster"` | 1 | 1 | pass |
| C2 | `npx vitest run test/server/utils/mapBasemap.test.ts -t "openstreetmap raster"` | 1 | 1 | pass |
| C3 | `npx vitest run test/server/utils/mapBasemap.test.ts -t "opens at Belem"` | 1 | 1 | pass |
| C4 | `npx vitest run test/server/utils/mapBasemap.test.ts -t "current location zoom"` | 1 | 1 | pass |
| C5 | `npx vitest run test/server/components/mapPopupContent.test.ts -t "draft popup says Informar Problema"` | 1 | 1 | pass |
| C6 | `npx vitest run test/server/utils/occurrencePoint.test.ts -t "click becomes longitude first"` | 1 | 1 | pass |
| C7 | `npx vitest run test/server/utils/mapBasemap.test.ts -t "geojson longitude first"` | 1 | 1 | pass |
| C8 | `npx vitest run test/server/components/mapPopupContent.test.ts -t "address script is text"` | 1 | 1 | pass |
| C9 | `npx vitest run test/server/components/mapPopupContent.test.ts -t "encerrar follows the owner"` | 1 | 1 | pass |
| C10 | `npx vitest run test/server/components/mapPopupContent.test.ts -t "liked count is pressed"` | 1 | 1 | pass |
| C11 | `npx vitest run test/server/utils/mapNotices.test.ts -t "map notices"` | 1 | 1 | pass |
| C12 | `npx vitest run test/server/app/occurrence-map.test.ts -t "page omits document click"` | 1 | 1 | pass |
| C13 | `npx vitest run test/server/app/session-client.test.ts -t "map loads types from the same origin"` | 1 | 1 | pass |
| C14 | `npx vitest run test/server/utils/mapNotices.test.ts -t "legend names"` | 1 | 1 | pass |
| C15 | `npx vitest run test/server/app/occurrence-map.test.ts -t "map omits leaflet"` | 1 | 1 | pass |
| C16 | `npx vitest run test/server/app/occurrence-map.test.ts -t "dialogs keep their phrases"` | 1 | 1 | pass |
| Build | `npx vitest run` | - | - | pass |
| Build | `npm run build` | - | - | pass |

## Mutations

| Mutation | Location | Killed |
| --- | --- | --- |
| marker reads coordinates[1] as longitude (C7) | `components/map/MapLibreMap.vue:12` | no |
| owner rule inverted on the map (C9) | `components/map/MapLibreMap.vue:33` | no |
| map click stores lat and lng swapped (C6) | `components/map/MapLibreMap.vue:178` | no |
