# STATE

## Decisions

### AD-001
- **Decision**: A API do mapa mora nas rotas Nitro deste repositório e persiste em PostgreSQL com PostGIS (SRID 4326). O app PHP deixa de ser o backend.
- **Reason**: Escolha de 2026-11-09: "Nitro neste repositório + PostgreSQL/PostGIS", com paridade do contrato que o front já chama e banco novo só com o seed dos tipos.
- **Trade-off**: Sem Supabase Auth e sem cópia das linhas do Laravel. Tokens Sanctum deixam de valer. O eixo do ponto continua o do mapa: o pedido manda `[latitude, longitude]` e a resposta GeoJSON manda `[longitude, latitude]`.
- **Scope**: `server/api` e o banco deste repositório.
- **Date**: 2026-11-09
- **Status**: superseded by AD-003

### AD-002
- **Decision**: O PostgreSQL deste repositório é acessado pelo Prisma ORM 7 (`prisma` na major 7, `@prisma/client` 7 e `@prisma/adapter-pg`). A coluna do ponto é `Unsupported("geometry(Point, 4326)")`. Gravar e ler essa coluna usa `$queryRaw` e `$executeRaw`.
- **Reason**: Escolha de 2026-11-09: "Prisma 7 estável. Ponto via SQL no campo Unsupported". A major 8 ainda é release candidate e não lê `schema.prisma`.
- **Trade-off**: O model da ocorrência não ganha `create`, `update` nem `upsert`. O ponto não entra no client tipado. Usuário, token, tipo e curtida usam o client.
- **Scope**: Persistência deste repositório.
- **Date**: 2026-11-09
- **Status**: active

### AD-003
- **Decision**: O ponto da ocorrência é GeoJSON nos dois sentidos: pedido e resposta usam `[longitude, latitude]`. O backend continua nas rotas Nitro deste repositório, em PostgreSQL com PostGIS (SRID 4326).
- **Reason**: O plano Contrato occurrence, aprovado em 2026-11-09 com "Implement the plan as specified", troca o eixo porque o app não foi lançado. AD-001 prendia o pedido em `[latitude, longitude]`.
- **Trade-off**: Não há compatibilidade com o par antigo. Um cliente que ainda mande latitude primeiro grava o ponto no lugar errado. Nitro e PostGIS seguem. Prisma 7 segue no AD-002.
- **Scope**: Contrato do ponto em `server/domain/occurrences` e no payload do mapa.
- **Date**: 2026-11-09
- **Status**: active

### AD-004
- **Decision**: A sessão do browser é o cookie HttpOnly `auth_token`, `SameSite=Lax`, `Path=/`, `Max-Age=604800`. `Secure` só entra com `NODE_ENV=production`. O JSON de cadastro, login e `GET /api/user/me` traz `user` e omite `token`. `Authorization` não autentica. `expires_at` é `created_at` mais 7 dias e não renova.
- **Reason**: Plano Sessão cookie HttpOnly, aprovado em 2026-11-09 com "Implement the plan as specified, it is attached for your reference." O usuário escolheu só o cookie e 7 dias a partir do login ou do cadastro, sem renovar.
- **Trade-off**: O Bearer e o token no JSON da migração deixam de valer. O like continua GET. Com `SameSite=Lax`, uma navegação de outro site para essa URL leva o cookie. Um login novo não apaga as linhas anteriores.
- **Scope**: Sessão deste repositório.
- **Date**: 2026-11-09
- **Status**: active

## Handoff

- **Feature**: sessao-cookie (`.specs/features/sessao-cookie/`) fechada. Gate `validate_verification.py` saiu 0. Sem commit.
- **Phase / Task**: T1–T5 Done. Verifier independent, mutações 3 mortas, `Closed` em C26, C17, C13 e C15/C21/C25.
- **Completed**: Cookie HttpOnly de 7 dias, cliente no mesmo origin, passe no browser (toast de senha errada, toast de login, sem reload, `document.cookie` vazio).
- **In-progress**: nenhum arquivo desta feature.
- **Next step**: migrar-backend continua com o verificador antigo em FAIL e `Closed` vazio, fora deste corte. Não redespachar esse verificador. O passe, se for retomado, está no relatório `.specs/features/migrar-backend/verification.md`. Não commitar.
- **Blockers**: nenhum.
- **Uncommitted files**: branch `main`, árvore suja. Sessão cookie, migration `expires_at` e o passe do verificador. Nada commitado.
- **Branch**: main
