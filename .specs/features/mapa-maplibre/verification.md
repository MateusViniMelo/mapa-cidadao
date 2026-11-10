# mapa-maplibre verification

**Verdict**: FAIL
**Mutations**: 3 - probed C7, C9, C6 (all three on `components/map/MapLibreMap.vue`; none killed)
**Proofs**: `proofs.md` at b391d33 (tree dirty)
**Verifier**: independent sub-agent (author != verifier)

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| Occurrence marker can read `coordinates[1]` as longitude and no test fails (MAP-08) | mutation `:coordinates="occurrenceLngLat(...)"` -> `[coordinates[1], coordinates[0]]` in `MapLibreMap.vue` not killed. C7 (`mapBasemap.test.ts` "geojson longitude first") only calls the pure helper `occurrenceLngLat`. `occurrence-map.test.ts:"map omits leaflet"` only asserts `toContain("occurrenceLngLat")`, which still matches the import and `defineExpose`. | Mount `MapLibreMap` (MglMap stubbed) or assert the `MglMarker` `coordinates` prop for `[-46.63, -23.55]` is `[-46.63, -23.55]`. | |
| Owner rule on the map can be inverted and no test fails (MAP-09, criteria 9 and 10) | mutation `userId === ocorrencia.user_id` -> `!==` in `MapLibreMap.vue` not killed. C9 only mounts `MapPopupContent` with `isOwner` set by hand. The comparison, including `authStore.user?.id ?? null` in `OccurrenceMap.vue`, has no test. | Assert `MapLibreMap` passes `isOwner` true only when `userId` equals `user_id`, with a visitor (`null`) and another user. | |
| Click on the map can store lat and lng swapped and no test fails (criteria 1 and 2, MAP-05/MAP-06) | mutation `point.value = { lat, lng }` -> `{ lat: lng, lng: lat }` in `onMapClick` not killed. C6 reads the text of `OccurrenceMap.vue`. Nothing proves the click handler, the drag setter (`draftCoordinates.set`), or `showCurrentLocation` writes the clicked longitude and latitude. | Test `onMapClick`, the drag setter and `showCurrentLocation` with an asymmetric point, for example lng -48.5, lat -1.4. | |
| C6 proves a source string, not the payload (criterion 3) | `occurrencePoint.test.ts` `toContain("coordinates: toRequestCoordinates(\n      localizacaoSelecionada.value.lat,\n ...")` pins whitespace and formatting. A prettier reflow fails it while behaviour stays right. A swapped `lat`/`lng` pair with the same layout still passes if `toRequestCoordinates` is also edited. | Run `salvarOcorrencia` with a store spy and assert `addOccurrence` receives `location.coordinates` equal to `[lng, lat]`. | |
| Toast wiring is unproven (criteria 12-20, C11) | `mapNotices.test.ts` asserts the notice objects only. Nothing proves `OccurrenceMap.vue` uses `likeError` on like failure, `created` on success, `loginRequired` for a visitor and so on. Swapping `toast.add(mapNotices.created)` and `toast.add(mapNotices.createError)` is undetected by any named check. The spec says "as frases saem do módulo que a página usa". | Drive `onLike`, `salvarOcorrencia`, `onSubmitInactivateOccurrence`, `openCreateModal` and `onLocate` with stubbed store, `useToast` and `navigator.geolocation`, and assert the `toast.add` arguments. | |
| C16 and criteria 24-26 are substring checks on source text | `occurrence-map.test.ts:"dialogs keep their phrases"` uses `toContain("Encerrar")` on a file that also contains `Encerrar Ocorrência`, and `toContain("UModal")` anywhere in the file. A phrase in a comment or a prop name would pass. `Carregando ocorrências…` is likewise `toContain` on the overlay file. Criterion 23 is proved with `legendMarkers()` and not with the legend the map renders. | Mount the dialogs with `UModal` stubbed and assert rendered text, and the rendered legend list. | |
| C12 and C15 are narrower than criteria 21 and 27 | C12 only forbids the literal `document.addEventListener`. `useEventListener(document, "click", ...)` or `document.onclick` pass. C15 only forbids `from "leaflet"`, so `import "leaflet"`, `import "leaflet/dist/leaflet.css"` and `require("leaflet")` pass. | Match `/leaflet/i` in the map files and `\bdocument\b` with `click`. | |

## Own examples (no finding)

- `formatShortAddress`: `"  Rua A  ,   Centro  , Belém"` -> `Rua A, Centro`. `"Rua A,Centro,Belém"` -> `Rua A, Centro`. `", Centro"` -> `, Centro`. `"Rua A,"` -> `Rua A, ` (trailing separator, literal reading of the spec rule). `"   "` is returned unchanged.
- Popup with `occurrenceId` 0 emits `like` with 0 (no falsy-id drop). Popup with `likesCount` 12345 shows `12345` and with 0 shows `0`. `addressName` undefined gives an empty `[data-address]`.
- `rasterStyle("   ")` takes the Carto branch with `?key=   `. This is the same behaviour as the Leaflet code at `HEAD` (truthy test). The spec says "vazia", so a whitespace-only key is undefined by the spec. Noted, not a finding.
- `README.md` still lists Leaflet. Outside the spec criteria; noted.

Throwaway test `test/server/tmp/verifier-own.test.ts` deleted. `mutate.py` restored `MapLibreMap.vue`; the three mutated snippets are absent.
