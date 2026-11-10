# STATE

## Decisions

### AD-001
- **Decision**: A API do mapa mora nas rotas Nitro deste repositório e persiste em PostgreSQL com PostGIS (SRID 4326). O app PHP deixa de ser o backend.
- **Reason**: Escolha de 2026-11-09: "Nitro neste repositório + PostgreSQL/PostGIS", com paridade do contrato que o front já chama e banco novo só com o seed dos tipos.
- **Trade-off**: Sem Supabase Auth e sem cópia das linhas do Laravel. Tokens Sanctum deixam de valer. O eixo do ponto continua o do mapa: o pedido manda `[latitude, longitude]` e a resposta GeoJSON manda `[longitude, latitude]`.
- **Scope**: `server/api` e o banco deste repositório.
- **Date**: 2026-11-09
- **Status**: active

### AD-002
- **Decision**: O PostgreSQL deste repositório é acessado pelo Prisma ORM 7 (`prisma` na major 7, `@prisma/client` 7 e `@prisma/adapter-pg`). A coluna do ponto é `Unsupported("geometry(Point, 4326)")`. Gravar e ler essa coluna usa `$queryRaw` e `$executeRaw`.
- **Reason**: Escolha de 2026-11-09: "Prisma 7 estável. Ponto via SQL no campo Unsupported". A major 8 ainda é release candidate e não lê `schema.prisma`.
- **Trade-off**: O model da ocorrência não ganha `create`, `update` nem `upsert`. O ponto não entra no client tipado. Usuário, token, tipo e curtida usam o client.
- **Scope**: Persistência deste repositório.
- **Date**: 2026-11-09
- **Status**: active

## Handoff

- **Feature**: migrar-backend (`.specs/features/migrar-backend/`). mover-testes está fechado: 20 arquivos em `test/server/`, suíte 65 passou, gate 0.
- **Phase / Task**: T1–T29 Complete. Verifier 4b6f336f devolveu FAIL. O passe de correção não começou.
- **Completed**: T1–T29 de migrar-backend. mover-testes verificado em `.specs/features/mover-testes/`.
- **In-progress**: nenhum arquivo de produto. O relatório de migrar-backend segue com `Closed` vazio.
- **Next step**: Um passe só, sem commit e sem segundo verificador. Os testes estão em `test/server/`. (1) Em `test/server/domain/auth/register.test.ts`, no teste `rejects a password outside the pattern`, aceitar `Abcdef1!` (8) e recusar `Abcde1!` (7) e `abcdef1!` (sem maiúscula), com a frase da senha. (2) A mutação de MX só morre se o teste `rejects an email the domain check refuses` chamar `emailDomainAcceptsMail` com `resolveMx` que lança e com lista vazia, os dois recusando; um teste novo fora desse `-t` não mata a mutação. (3) A mutação 422→400 só morre se o teste `rejects a blank name` virar o POST `/api/register` com nome em branco, status 422 e a mesma contagem de usuários; o teste de domínio sozinho não lê o HTTP. (4) Em `test/server/api/user/me.get.test.ts`, no teste `me returns the same token`, afirmar as chaves públicas e a ausência de `password` e `remember_token`. (5) Em `test/server/api/route-map.test.ts`, no teste `mounted paths answer`, pedir os dez caminhos e esperar status diferente de 404 em cada um. Preencher `Closed` com C6, C5, C3, C15 e C51. Rodar `check_proofs.py migrar-backend --mutations .specs/features/migrar-backend/mutations.json` e depois `validate_verification.py migrar-backend`. Se o gate sair 0, destilar lições. Não commitar.
- **Blockers**: nenhum. Não redespachar o verificador de migrar-backend.
- **Uncommitted files**: branch `main`, árvore suja. Testes saíram de `server/` para `test/server/`. Nada commitado.
- **Branch**: main
