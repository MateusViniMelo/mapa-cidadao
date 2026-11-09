# STATE

## Decisions

### AD-001
- **Decision**: A API do mapa mora nas rotas Nitro deste repositório e persiste em PostgreSQL com PostGIS (SRID 4326). O app PHP deixa de ser o backend.
- **Reason**: Escolha de 2026-11-09: "Nitro neste repositório + PostgreSQL/PostGIS", com paridade do contrato que o front já chama e banco novo só com o seed dos tipos.
- **Trade-off**: Sem Supabase Auth e sem cópia das linhas do Laravel. Tokens Sanctum deixam de valer. O eixo do ponto continua o do mapa: o pedido manda `[latitude, longitude]` e a resposta GeoJSON manda `[longitude, latitude]`.
- **Scope**: `server/api` e o banco deste repositório.
- **Date**: 2026-11-09
- **Status**: active

## Handoff
