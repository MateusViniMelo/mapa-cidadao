# Mapa MapLibre Specification

**Approved**: 2026-11-10 - user: "Implement the plan as specified, it is attached for your reference."

## Problem Statement

A página de ocorrências desenha o mapa com Leaflet, monta o popup como HTML e escuta clique no `document`. O endereço entra nessa string. O Nuxt 3 fica com um motor que não tem componente Vue. A troca é MapLibre, no mesmo tile raster, com popup Vue e a página de ocorrências redesenhada.

## Goals

- [ ] O mapa abre em Belém no raster Voyager quando há chave, e no OpenStreetMap quando não há.
- [ ] Clique, arraste, informar, curtir, encerrar e localização atual fazem o que fazem hoje, com as mesmas frases.
- [ ] Endereço e nome do tipo são texto. A página de ocorrências ganha visual novo sem mudar navbar, tema global nem `/my-occurrences`.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Tile vetorial `style.json` | O plano fixa o PNG raster de hoje. |
| Navbar, tema global do Nuxt UI e `/my-occurrences` | O redesenho é a página de ocorrências. |
| Contrato da API e o PostGIS | O pedido continua `[longitude, latitude]`. |
| Commit, push ou banco | A aprovação cobre a implementação local. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Tile | Raster Voyager com a chave, OpenStreetMap sem ela, `tileSize` 256 | O plano aprovado recusa o `style.json` vetorial. | y |
| Visual | Página inteira de ocorrências, inclusive os diálogos, com as frases e os gestos atuais | Escolha de 2026-11-10: redesenhar a página inteira. O subagent `frontend-design` escolhe o layout. | y |
| Diálogos | Criar e encerrar continuam `UModal` | O plano mantém os fluxos como diálogos do Nuxt UI 3. | y |
| Popup | Componente Vue, sem HTML interpolado e sem `document` click | O plano troca a string de `utils/mapPopup.ts`. | y |
| Endereço curto | As duas primeiras partes, com espaços das pontas removidos, unidas por `, ` | O plano pede o texto `<script>alert(1)</script>, Centro`. | y |
| Zoom | Centro `[-48.49, -1.45]`, zoom 13, localização atual no zoom 16 | `tileSize` 256 mantém o zoom do Leaflet. | y |
| Dono | `user.id === user_id` mostra `Encerrar` | É a regra do popup atual. | y |
| Retry, limite, TTL, métrica | N/A porque este corte não cria pedido novo, prazo novo nem telemetria. O `console.error` de tipo e de geolocalização permanece. | Nada disso muda o que a pessoa vê. | y |
| Concorrência | N/A porque like, salvar e encerrar seguem um pedido por clique, na ordem do clique. | O store já substitui a linha do like e acrescenta a ocorrência salva. | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: O mesmo chão no MapLibre ⭐ MVP

**User Story**: Como pessoa na página de ocorrências, quero o mesmo chão de Belém, para achar o bairro no mapa novo.

**Why P1**: Sem o tile certo a migração não é o mapa de hoje.

**Acceptance Criteria**:

1. WHERE `NUXT_PUBLIC_CARTO_API_KEY` tem valor THEN the basemap SHALL request `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png?key=` seguido dessa chave, with `tileSize` 256, `maxzoom` 20, and attribution `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>`.
2. WHEN the chave está vazia THEN the basemap SHALL request `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, with `tileSize` 256, `maxzoom` 19, and attribution `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>`.
3. The map SHALL open at longitude -48.49, latitude -1.45 and zoom 13.
4. WHEN a localização atual chega THEN the map SHALL center that point at zoom 16.

**Independent Test**: Chamar o construtor do estilo com chave e sem chave. O objeto traz URL, `tileSize`, `maxzoom` e atribuição.

---

### P1: Marcar, informar, curtir e encerrar ⭐ MVP

**User Story**: Como pessoa no mapa, quero clicar, arrastar, informar, curtir e encerrar, para o fluxo de hoje continuar no mapa novo.

**Why P1**: É o uso da página.

**Acceptance Criteria**:

1. WHEN a pessoa clica no mapa em uma longitude e uma latitude THEN the draft marker SHALL sit at that point and the popup SHALL show the text `Informar Problema`.
2. WHEN the draft marker is dragged to a new point THEN the selected point SHALL use that latitude and that longitude.
3. The save payload SHALL send `toRequestCoordinates(latitude, longitude)`, which is `[longitude, latitude]`.
4. The occurrence marker SHALL read GeoJSON `coordinates[0]` as longitude and `coordinates[1]` as latitude.
5. WHEN `address_name` is `<script>alert(1)</script>, Centro, Belém` THEN the popup SHALL show the text `<script>alert(1)</script>, Centro` and the rendered markup SHALL contain no `script` element.
6. WHEN the type name is `<img src=x onerror=alert(1)>` THEN the popup SHALL show that text and the rendered markup SHALL contain no `img` element from the name.
7. WHEN `address_name` is empty THEN the popup SHALL show an empty address line.
8. WHEN the popup shows an occurrence THEN the popup SHALL show `tempoAtras(createdAt)` as text.
9. WHEN the viewer id equals `user_id` THEN the popup SHALL show `Encerrar`.
10. WHEN the viewer id differs from `user_id` THEN the popup SHALL NOT show `Encerrar`.
11. WHEN the like control is used THEN the popup SHALL emit that occurrence id, and WHILE `likes_count` is 4 and `liked_by_auth_user` is true the popup SHALL show `4` and a pressed like control.
12. IF a visitor uses `Informar Problema` THEN the system SHALL toast title `Erro` and description `Faça o login pra informar uma ocorrência`.
13. IF save runs without a point THEN the system SHALL toast title `Localização necessária` and description `Marque a localização no mapa antes de salvar.`
14. WHEN save succeeds THEN the system SHALL toast title `Ocorrência criada` and description `Ocorrência salva com sucesso.`
15. IF save fails THEN the system SHALL toast title `Erro` and description `Não foi possível salvar ocorrência.`
16. IF like fails THEN the system SHALL toast title `Erro` and description `Não foi possível dar like na ocorrência`.
17. WHEN inactivate succeeds THEN the system SHALL toast title `Ocorrência inativada` and description `Ocorrência inativada com sucesso`.
18. IF inactivate fails THEN the system SHALL toast title `Erro` and description `Não foi possível inativar a ocorrência`.
19. IF geolocation is missing THEN the system SHALL toast title `Geolocalização não disponível no seu navegador.`
20. IF geolocation is denied THEN the system SHALL toast title `Não foi possível obter sua localização.`, description `Verifique se você concedeu permissão de acesso à sua localização para este site nas configurações do navegador e tente novamente.`, and duration 10000.
21. The occurrence page SHALL NOT register a click listener on `document`.
22. The occurrence page SHALL load types from `/api/types-occurrence`.
23. The legend SHALL show `Problema de Iluminação`, `Problema de Pavimentação`, `Alagamento`, `Lixo` and `Sem Pavimentação`, and SHALL NOT show `Problema Desconhecido`.
24. WHILE occurrences are loading the page SHALL show the text `Carregando ocorrências…`.
25. The create dialog SHALL show `Criar Ocorrência`, `Endereço`, `Não foi possível obter o endereço, mas ainda é possível salvar a ocorrência.`, `Categoria`, `Selecione uma categoria`, `Descrição do problema`, `Descreva a Ocorrência` and `Salvar`.
26. The close dialog SHALL show `Encerrar Ocorrência`, `Qual o motivo do encerramento?`, `Escolha o tipo`, `Data de solução do problema?`, `Data de quando aconteceu?`, `Descreva o motivo?` and `Encerrar`.
27. The map code SHALL NOT import `leaflet`.

**Independent Test**: Renderizar o popup com o endereço de script e clicar em `Informar Problema`, curtir e `Encerrar`. Os textos e os eventos saem do componente. As frases de toast saem do módulo que a página usa.

---

### P2: Visual da página

**User Story**: Como pessoa na página de ocorrências, quero a página, o popup, a legenda, o botão e os diálogos com cara própria, para o mapa novo não herdar o visual do Leaflet.

**Why P2**: O plano manda o subagent `frontend-design` desenhar essa superfície depois do comportamento.

**Acceptance Criteria**:

1. The occurrences page SHALL keep every phrase named in the P1 criteria after the visual pass.
2. The create and close flows SHALL stay in `UModal` dialogs.

**Independent Test**: Os testes de frase do P1 continuam verdes depois do redesenho. Os diálogos seguem `UModal`.

---

## Edge Cases

- IF `type_id` não está no catálogo THEN the marker SHALL use the default icon and the name `Problema Desconhecido`.
- WHEN `address_name` has no comma THEN the popup SHALL show the whole address.
- IF the type list request fails THEN the page SHALL log `Erro ao carregar tipos de ocorrência:` and SHALL still show the map.
- IF geolocation fails THEN the location button SHALL return to its idle label `Localização Atual`.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| MAP-01 | P1: O mesmo chão no MapLibre | Tasks | Pending |
| MAP-02 | P1: O mesmo chão no MapLibre | Tasks | Pending |
| MAP-03 | P1: O mesmo chão no MapLibre | Tasks | Pending |
| MAP-04 | P1: O mesmo chão no MapLibre | Tasks | Pending |
| MAP-05 | P1: Marcar, informar, curtir e encerrar | Tasks | Pending |
| MAP-06 | P1: Marcar, informar, curtir e encerrar | Tasks | Pending |
| MAP-07 | P1: Marcar, informar, curtir e encerrar | Tasks | Pending |
| MAP-08 | P1: Marcar, informar, curtir e encerrar | Tasks | Pending |
| MAP-09 | P1: Marcar, informar, curtir e encerrar | Tasks | Pending |
| MAP-10 | P1: Marcar, informar, curtir e encerrar | Tasks | Pending |
| MAP-11 | P1: Marcar, informar, curtir e encerrar | Tasks | Pending |
| MAP-12 | P1: Marcar, informar, curtir e encerrar | Tasks | Pending |
| MAP-13 | P1: Marcar, informar, curtir e encerrar | Tasks | Pending |
| MAP-14 | P1: Marcar, informar, curtir e encerrar | Tasks | Pending |
| MAP-15 | P1: Marcar, informar, curtir e encerrar | Tasks | Pending |
| MAP-16 | P2: Visual da página | Tasks | Pending |

**Coverage:** 16 total, 16 mapped to tasks, 0 unmapped.

---

## Sources

- Plano Migração MapLibre, aprovado em 2026-11-10 - tile raster, frases, gestos e redesenho da página de ocorrências.

---

## Success Criteria

- [ ] Com chave, o mapa pede o PNG Voyager. Sem chave, pede o OpenStreetMap.
- [ ] O popup mostra o endereço de script como texto e não cria um elemento `script`.
- [ ] `leaflet` sai das dependências e do código da página.
