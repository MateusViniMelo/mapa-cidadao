# Migração do backend Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/migrar-backend/design.md`
**Status**: Approved
**Approved**: 2026-11-09 - user: "está aprovado"
**Mutations**: 3
**Build**: `npx vitest run; npm run build`

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none - strong defaults applied. `package.json` só tem `build`, `dev`, `generate`, `preview` e `postinstall`. Não há script de teste nem de lint.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Pure domain (validation, geo, like decision, page slice) | unit | All branches; 1:1 to the ACs proved in that file | `server/domain/**/*.test.ts` | `npx vitest run server/domain` |
| Prisma queries and HTTP routes | integration | Every route in scope: happy path, edge, error | `server/api/**/*.test.ts`, `server/db/**/*.test.ts` | `npx vitest run` |
| Schema Prisma, migration, seed, config, client, compose, Vitest, env example | none | build gate only | `prisma/schema.prisma`, `prisma.config.ts`, `prisma/seed.ts`, `prisma/migrations/20261109120000_init/migration.sql`, `server/db/client.ts`, `docker-compose.yml`, `vitest.config.ts`, `.env.example` | `npm run build` |

## Gate Check Commands

> Generated from codebase - confirm before Execute. Não existe `npm run lint`. O typecheck entra em `npm run build`.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After tasks with unit tests only | `npx vitest run server/domain` |
| Full | After tasks with integration tests | `npx vitest run` |
| Build | After phase completion or config/schema tasks | `npx vitest run; npm run build` |

---

## Task Breakdown

### Phase 1: Foundation

### T1: Compose do PostGIS

**What**: Um `docker-compose.yml` sobe `postgis/postgis:16-3.4` com os databases `mapa_cidadao` e `mapa_cidadao_test`.
**Where**: `docker-compose.yml`
**Depends on**: None
**Reuses**: a extensão PostGIS da migration `2025_07_07_182858_enable_postgis_extension.php`
**Requirement**: MIG-04

**Done when**:

- [x] O serviço publica PostgreSQL com PostGIS na porta 5432
- [x] Usuário, senha e os dois databases estão no arquivo
- [x] Gate check passes: `npm run build`

**Tests**: none
**Gate**: build
**Status**: Complete

---

### T2: Inventário SQL das colunas

**What**: `schema.sql` lista `users`, `access_tokens`, `types_ocurrence`, `ocurrences` com `geometry(Point, 4326)` e `like_ocurrences` com unicidade `(user_id, ocurrence_id)`. A T5 copia essas colunas para a migration e apaga este arquivo.
**Where**: `server/db/schema.sql`
**Depends on**: T1
**Reuses**: colunas das migrations Laravel citadas no design, sem sessão, cache, jobs nem reset de senha
**Requirement**: MIG-06

**Done when**:

- [x] `description` e `address_name` são `text not null default ''`
- [x] `type_closure` só aceita `resolved`, `mistake` ou `other`
- [x] Gate check passes: `npm run build`

**Tests**: none
**Gate**: build
**Status**: Complete

---

### T3: Schema Prisma

**What**: `prisma/schema.prisma` descreve os cinco models do design, com `location` `Unsupported("geometry(Point, 4326)")`, enum de encerramento e `@@map` nas tabelas do `schema.sql`. As dependências `prisma@7`, `@prisma/client@7`, `@prisma/adapter-pg`, `pg`, `dotenv` e `tsx` entram no `package.json` nesta tarefa.
**Where**: `prisma/schema.prisma`
**Depends on**: T2
**Reuses**: `server/db/schema.sql`
**Requirement**: MIG-06

**Done when**:

- [x] O generator é `prisma-client`, o output é `../generated/prisma` e `importFileExtension` é `ts`
- [x] `name` de `TypeOcurrence` é único e os ids são `Int`
- [x] O CLI instalado é a major 7, não o `prisma@latest`
- [x] Gate check passes: `npm run build`

**Tests**: none
**Gate**: build
**Status**: Complete

---

### T4: Config do Prisma

**What**: `prisma.config.ts` aponta o schema, a pasta `prisma/migrations`, o seed `tsx prisma/seed.ts` e a URL `env("DATABASE_URL")`.
**Where**: `prisma.config.ts`
**Depends on**: T3
**Reuses**: `prisma/schema.prisma`
**Requirement**: MIG-04

**Done when**:

- [x] O arquivo importa `dotenv/config` e `defineConfig` de `prisma/config`
- [x] Gate check passes: `npm run build`

**Tests**: none
**Gate**: build
**Status**: Complete

---

### T5: Migration inicial

**What**: A migration `20261109120000_init` nasce de `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`, com `CREATE EXTENSION IF NOT EXISTS "postgis";` na primeira linha. `server/db/schema.sql` sai do repositório.
**Where**: `prisma/migrations/20261109120000_init/migration.sql`
**Depends on**: T4
**Reuses**: `prisma/schema.prisma` e as colunas de `server/db/schema.sql`
**Requirement**: MIG-06

**Done when**:

- [x] A primeira instrução cria a extensão `postgis`
- [x] A tabela `ocurrences` tem `geometry(Point, 4326)` e `like_ocurrences` tem unicidade de `(user_id, ocurrence_id)`
- [x] `server/db/schema.sql` não existe mais
- [x] Gate check passes: `npm run build`

**Tests**: none
**Gate**: build
**Status**: Complete

---

### T6: Seed dos cinco tipos

**What**: `prisma/seed.ts` faz upsert dos cinco nomes e pode rodar de novo sem duplicar.
**Where**: `prisma/seed.ts`
**Depends on**: T5
**Reuses**: `TypeOcurrenceSeeder.php`
**Requirement**: MIG-04

**Done when**:

- [x] Os nomes são Problema de Iluminação, Problema de Pavimentação, Alagamento, Acúmulo de Lixo e Falta de Pavimentação
- [x] Gate check passes: `npm run build`

**Tests**: none
**Gate**: build
**Status**: Complete

---

### T7: Cliente Prisma

**What**: `client.ts` exporta `getPrisma()` com `PrismaPg({ connectionString })` e uma instância por processo. O `postinstall` passa a `prisma generate && nuxt prepare`. `generated` entra no `.gitignore`.
**Where**: `server/db/client.ts`
**Depends on**: T6
**Reuses**: `prisma/schema.prisma`
**Requirement**: MIG-04

**Done when**:

- [x] `getPrisma()` devolve um `PrismaClient` construído com o adapter
- [x] O import vem de `generated/prisma/client`
- [x] Gate check passes: `npm run build`

**Tests**: none
**Gate**: build
**Status**: Complete

---

### Phase 2: Test harness

### T8: Vitest

**What**: Configurar o Vitest para `server/domain/**/*.test.ts`, `server/api/**/*.test.ts` e `server/db/**/*.test.ts`. A URL de teste é a do banco `mapa_cidadao_test` e o runner recusa outro nome de banco.
**Where**: `vitest.config.ts`
**Depends on**: T7
**Reuses**: o `package.json` deste Nuxt, que ainda não tem script de teste
**Requirement**: MIG-01

**Done when**:

- [x] `npx vitest run` termina sem suite, ou só com os testes que já existirem
- [x] A config não aponta o reset para o banco `mapa_cidadao`
- [x] Gate check passes: `npm run build`

**Tests**: none
**Gate**: build
**Status**: Complete

---

### T9: Migrate no banco de teste

**What**: `migrate.ts` aplica `prisma migrate deploy`, trunca as tabelas de domínio e reinsere os tipos pelo seed.
**Where**: `server/db/migrate.ts`
**Depends on**: T8
**Reuses**: `prisma/migrations/20261109120000_init/migration.sql` e `prisma/seed.ts`
**Requirement**: MIG-04

**Done when**:

- [x] `server/db/migrate.test.ts` prova que o seed deixa os cinco nomes e que PostGIS responde `ST_MakePoint`
- [x] Gate check passes: `npx vitest run`
- [x] Test count: 1 test pass

**Tests**: integration
**Gate**: full
**Status**: Complete

---

### Phase 3: Auth

### T10: Regras de cadastro

**What**: `validateRegistration` aplica nome, e-mail, senha, confirmação e idade, com a checagem de MX injetável.
**Where**: `server/domain/auth/register.ts`
**Depends on**: T9
**Reuses**: `RegisterUserRequest.php`
**Requirement**: MIG-01

**Done when**:

- [x] `server/domain/auth/register.test.ts` cobre nome vazio, nome acima de 100, e-mail recusado, senha fora do padrão, confirmação diferente e menor de 18
- [x] Gate check passes: `npx vitest run server/domain`
- [x] Test count: 6 tests pass

**Tests**: unit
**Gate**: quick
**Status**: Complete

---

### T11: Regras de sessão

**What**: Funções puras de hash do token, leitura que devolve o mesmo token e logout que o apaga, sobre um mapa em memória.
**Where**: `server/domain/auth/session.ts`
**Depends on**: T10
**Reuses**: o fluxo de `AuthController.php`, sem emitir token novo no `/me`
**Requirement**: MIG-03

**Done when**:

- [x] `server/domain/auth/session.test.ts` cobre hash, o mesmo token na leitura e a ausência depois do logout
- [x] Gate check passes: `npx vitest run server/domain`
- [x] Test count: 3 tests pass

**Tests**: unit
**Gate**: quick
**Status**: Complete

---

### T12: POST /api/register

**What**: A rota grava o usuário com bcrypt pelo Prisma, devolve 200 sem `password` e o token passa em `/api/user/me`. E-mail repetido é `P2002` e responde 422.
**Where**: `server/api/register.post.ts`
**Depends on**: T11
**Reuses**: `server/domain/auth/register.ts` e `server/domain/auth/session.ts`
**Requirement**: MIG-01

**Done when**:

- [x] `server/api/register.post.test.ts` cobre 200, bcrypt, e-mail duplicado, token no `/me` e ausência de `password`
- [x] Gate check passes: `npx vitest run`
- [x] Test count: 5 tests pass

**Tests**: integration
**Gate**: full
**Status**: Complete

---

### T13: POST /api/user/login

**What**: A rota devolve 200 com usuário e token, ou 401 `Credenciais inválidas`.
**Where**: `server/api/user/login.post.ts`
**Depends on**: T12
**Reuses**: `AuthController::login`
**Requirement**: MIG-02

**Done when**:

- [x] `server/api/user/login.post.test.ts` cobre senha certa, senha errada e ausência de `password`
- [x] Gate check passes: `npx vitest run`
- [x] Test count: 3 tests pass

**Tests**: integration
**Gate**: full
**Status**: Complete

---

### T14: GET /api/user/me

**What**: A rota devolve o mesmo token, rejeita token ausente e aceita o scheme `bearer`.
**Where**: `server/api/user/me.get.ts`
**Depends on**: T13
**Reuses**: `bearerToken` descrito no design
**Requirement**: MIG-03

**Done when**:

- [x] `server/api/user/me.get.test.ts` cobre o mesmo token, 401 sem token e scheme minúsculo
- [x] Gate check passes: `npx vitest run`
- [x] Test count: 3 tests pass

**Tests**: integration
**Gate**: full
**Status**: Complete

---

### T15: POST /api/user/logout

**What**: A rota revoga o token atual e responde a frase do spec.
**Where**: `server/api/user/logout.post.ts`
**Depends on**: T14
**Reuses**: `AuthController::logout`
**Requirement**: MIG-03

**Done when**:

- [x] `server/api/user/logout.post.test.ts` cobre a revogação e o 401 sem token
- [x] Gate check passes: `npx vitest run`
- [x] Test count: 2 tests pass

**Tests**: integration
**Gate**: full
**Status**: Complete

---

### Phase 4: Tipos e mapa

### T16: Consulta dos tipos

**What**: `listTypes` lê `types_ocurrence` pelo Prisma depois do seed.
**Where**: `server/domain/catalog/list-types.ts`
**Depends on**: T15
**Reuses**: `prisma/seed.ts`
**Requirement**: MIG-04

**Done when**:

- [x] `server/domain/catalog/list-types.test.ts` encontra os cinco nomes no banco de teste
- [x] Gate check passes: `npx vitest run`
- [x] Test count: 1 test pass

**Tests**: integration
**Gate**: full
**Status**: Complete

---

### T17: GET /api/types-ocurrence

**What**: A rota responde 200 com `types_ocurrence`.
**Where**: `server/api/types-ocurrence.get.ts`
**Depends on**: T16
**Reuses**: `server/domain/catalog/list-types.ts`
**Requirement**: MIG-04

**Done when**:

- [x] `server/api/types-ocurrence.get.test.ts` lista os cinco nomes com id, name, created_at e updated_at
- [x] Gate check passes: `npx vitest run`
- [x] Test count: 1 test pass

**Tests**: integration
**Gate**: full
**Status**: Complete

---

### T18: Forma da lista pública

**What**: `withLikeFlags` marca `liked_by_auth_user` e `likes_count` sem uma query por linha.
**Where**: `server/domain/occurrences/list-active.ts`
**Depends on**: T17
**Reuses**: os appends de `Ocurrence.php`, agregados num passo só
**Requirement**: MIG-05

**Done when**:

- [x] `server/domain/occurrences/list-active.test.ts` cobre anônimo, curtida do chamador e a contagem
- [x] Gate check passes: `npx vitest run server/domain`
- [x] Test count: 3 tests pass

**Tests**: unit
**Gate**: quick
**Status**: Complete

---

### T19: GET /api/ocurrences

**What**: A rota devolve só ocorrências ativas, com o ponto lido por `ST_X` e `ST_Y`, e aceita Authorization vazio.
**Where**: `server/api/ocurrences/index.get.ts`
**Depends on**: T18
**Reuses**: `server/domain/occurrences/list-active.ts`
**Requirement**: MIG-05

**Done when**:

- [x] `server/api/ocurrences/index.get.test.ts` cobre só ativas, flag anônima, flag autenticada e header vazio
- [x] Gate check passes: `npx vitest run`
- [x] Test count: 4 tests pass

**Tests**: integration
**Gate**: full
**Status**: Complete

---

### Phase 5: Criar ocorrência

### T20: Ponto e validação da criação

**What**: `requestPoint`, `geoJsonCoordinates` e a validação de descrição, endereço e campos nulos.
**Where**: `server/domain/occurrences/create.ts`
**Depends on**: T19
**Reuses**: `Point::makeGeodetic` e `GeojsonGenerator`
**Requirement**: MIG-06

**Done when**:

- [x] `server/domain/occurrences/create.test.ts` cobre o par de São Paulo, descrição e endereço vazios, cidade nula e descrição acima de 250
- [x] Gate check passes: `npx vitest run server/domain`
- [x] Test count: 4 tests pass

**Tests**: unit
**Gate**: quick
**Status**: Complete

---

### T21: POST /api/ocurrences

**What**: A rota grava o ponto com `$queryRaw` e `ST_MakePoint`, responde 201 e ignora `user_id` do corpo.
**Where**: `server/api/ocurrences/index.post.ts`
**Depends on**: T20
**Reuses**: `server/domain/occurrences/create.ts`
**Requirement**: MIG-06

**Done when**:

- [x] `server/api/ocurrences/index.post.test.ts` cobre o GeoJSON de volta, 401, `type_id` desconhecido e `user_id` ignorado
- [x] A latitude gravada de `[-23.55052, -46.633308]` é -23.55052 e a longitude é -46.633308
- [x] Gate check passes: `npx vitest run`
- [x] Test count: 4 tests pass

**Tests**: integration
**Gate**: full
**Status**: Complete

---

### Phase 6: Inativar

### T22: Decisão de inativação

**What**: A função decide fechar, apagar, 403, 422 ou a mensagem de falha ao gravar.
**Where**: `server/domain/occurrences/inactivate.ts`
**Depends on**: T21
**Reuses**: `OcurrenceService::inactivate`
**Requirement**: MIG-07

**Done when**:

- [x] `server/domain/occurrences/inactivate.test.ts` cobre resolved, mistake, outro usuário, já inativa, data futura e exceção ao gravar
- [x] Gate check passes: `npx vitest run server/domain`
- [x] Test count: 6 tests pass

**Tests**: unit
**Gate**: quick
**Status**: Complete

---

### T23: POST /api/ocurrences/inactivate/:id

**What**: A rota aplica a decisão do dono. O encerramento grava com `$executeRaw`. O caso `mistake` usa `delete`. Os status são 200, 403, 401 e 404.
**Where**: `server/api/ocurrences/inactivate/[id].post.ts`
**Depends on**: T22
**Reuses**: `server/domain/occurrences/inactivate.ts`
**Requirement**: MIG-07

**Done when**:

- [x] `server/api/ocurrences/inactivate/[id].post.test.ts` cobre resolved, mistake, 403, 401 e 404
- [x] Gate check passes: `npx vitest run`
- [x] Test count: 5 tests pass

**Tests**: integration
**Gate**: full
**Status**: Complete

---

### Phase 7: Minhas ocorrências

### T24: Página de dez

**What**: `sliceMine` ordena por `created_at` descendente e corta de 10 em 10.
**Where**: `server/domain/occurrences/mine.ts`
**Depends on**: T23
**Reuses**: `paginate(10)` de `ocurrencesUserAuth`
**Requirement**: MIG-08

**Done when**:

- [x] `server/domain/occurrences/mine.test.ts` cobre a ordem e o corte 10 depois 5 de uma lista de 15
- [x] Gate check passes: `npx vitest run server/domain`
- [x] Test count: 2 tests pass

**Tests**: unit
**Gate**: quick
**Status**: Complete

---

### T25: GET /api/ocurrences/my-ocurrences

**What**: A rota pagina só as linhas do chamador, inclui inativas, lê o ponto por `ST_X` e `ST_Y` e omite entidades HTML nos rótulos.
**Where**: `server/api/ocurrences/my-ocurrences.get.ts`
**Depends on**: T24
**Reuses**: `server/domain/occurrences/mine.ts` e `MyOcurrencesResponse.ts`
**Requirement**: MIG-08

**Done when**:

- [x] `server/api/ocurrences/my-ocurrences.get.test.ts` cobre 10 e 5, links, inativa incluída, 401 e página omitida
- [x] Gate check passes: `npx vitest run`
- [x] Test count: 5 tests pass

**Tests**: integration
**Gate**: full
**Status**: Complete

---

### Phase 8: Curtir

### T26: Alternância da curtida

**What**: Dado o par usuário-ocorrência, a função cria uma linha ou remove a única linha existente.
**Where**: `server/domain/occurrences/like.ts`
**Depends on**: T25
**Reuses**: `OcurrenceService::likeOrDislikeOcurrence`
**Requirement**: MIG-09

**Done when**:

- [x] `server/domain/occurrences/like.test.ts` cobre a ida, a volta e a recusa de uma segunda linha
- [x] Gate check passes: `npx vitest run server/domain`
- [x] Test count: 2 tests pass

**Tests**: unit
**Gate**: quick
**Status**: Complete

---

### T27: GET /api/ocurrences/like/:id

**What**: A rota responde 201 na curtida, 200 na remoção, 401 sem token e 404 sem ocorrência. A unicidade do par fica no Prisma.
**Where**: `server/api/ocurrences/like/[id].get.ts`
**Depends on**: T26
**Reuses**: `server/domain/occurrences/like.ts`
**Requirement**: MIG-09

**Done when**:

- [x] `server/api/ocurrences/like/[id].get.test.ts` cobre 201, 200, 401 e 404
- [x] Gate check passes: `npx vitest run`
- [x] Test count: 4 tests pass

**Tests**: integration
**Gate**: full
**Status**: Complete

---

### Phase 9: Caminhos e base do front

### T28: Mapa dos dez caminhos

**What**: Um teste importa os dez handlers e falha se algum arquivo do contrato não exportar handler.
**Where**: `server/api/route-map.test.ts`
**Depends on**: T27
**Reuses**: a tabela de rotas do design
**Requirement**: MIG-10

**Done when**:

- [x] O teste `mounted paths answer` vê os dez arquivos e recebe resposta diferente de 404 em `GET /api/types-ocurrence`
- [x] Gate check passes: `npx vitest run`
- [x] Test count: 1 test pass

**Tests**: integration
**Gate**: full
**Status**: Complete

---

### T29: Base URL do front

**What**: `.env.example` documenta `DATABASE_URL` e aponta `NUXT_PUBLIC_API_BASE` para `http://localhost:3000/api`.
**Where**: `.env.example`
**Depends on**: T28
**Reuses**: `nuxt.config.ts` `runtimeConfig.public.apiBase`
**Requirement**: MIG-10

**Done when**:

- [x] `NUXT_PUBLIC_API_BASE` deixa de ser `http://localhost:8000/api`
- [x] `DATABASE_URL` de desenvolvimento está no exemplo, sem senha de produção
- [x] Gate check passes: `npx vitest run; npm run build`

**Tests**: none
**Gate**: build
**Status**: Complete

---

## Execution Plan

Phases are ordered and run sequentially. Tasks inside a phase run in order. T1 e T2 estão completas. A próxima é T3. O desenho anterior, com o pacote `postgres`, deixou de valer. Estas tarefas pedem aprovação de novo.

### Phase 1: Foundation

```
T1 → T2 → T3 → T4 → T5 → T6 → T7
```

### Phase 2: Test harness

```
T8 → T9
```

### Phase 3: Auth

```
T10 → T11 → T12 → T13 → T14 → T15
```

### Phase 4: Tipos e mapa

```
T16 → T17 → T18 → T19
```

### Phase 5: Criar ocorrência

```
T20 → T21
```

### Phase 6: Inativar

```
T22 → T23
```

### Phase 7: Minhas ocorrências

```
T24 → T25
```

### Phase 8: Curtir

```
T26 → T27
```

### Phase 9: Caminhos e base do front

```
T28 → T29
```

---

## Checks

**C1** - Cadastro válido responde 200 com user e token, e date_birth igual ao YYYY-MM-DD enviado (MIG-01, AC 1)
Proof: `npx vitest run server/api/register.post.test.ts -t "register returns 200 with user and token"`

**C2** - A senha gravada passa no bcrypt e o texto puro não fica na coluna (MIG-01, AC 2)
Proof: `npx vitest run server/api/register.post.test.ts -t "register stores a bcrypt password"`

**C3** - Nome vazio responde 422 em errors.name e não insere usuário (MIG-01, AC 3)
Proof: `npx vitest run server/domain/auth/register.test.ts -t "rejects a blank name"`

**C4** - Nome acima de 100 caracteres responde 422 em errors.name e não insere usuário (MIG-01, AC 4)
Proof: `npx vitest run server/domain/auth/register.test.ts -t "rejects a name over 100 characters"`

**C5** - E-mail sem forma RFC ou sem MX inclui "O e-mail informado não é válido ou o domínio não existe." (MIG-01, AC 5)
Proof: `npx vitest run server/domain/auth/register.test.ts -t "rejects an email the domain check refuses"`

**C6** - Senha fora do padrão inclui "A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial." (MIG-01, AC 6)
Proof: `npx vitest run server/domain/auth/register.test.ts -t "rejects a password outside the pattern"`

**C7** - Confirmação diferente inclui "A confirmação da senha não corresponde." (MIG-01, AC 7)
Proof: `npx vitest run server/domain/auth/register.test.ts -t "rejects a mismatched confirmation"`

**C8** - Data de nascimento depois do limite de 18 anos UTC inclui "Você deve ter pelo menos 18 anos." (MIG-01, AC 8)
Proof: `npx vitest run server/domain/auth/register.test.ts -t "rejects a birth date under 18"`

**C9** - E-mail já gravado responde 422 e não cria segundo usuário (MIG-01, AC 9)
Proof: `npx vitest run server/api/register.post.test.ts -t "rejects a duplicate email"`

**C10** - O token do cadastro lê GET /api/user/me com o mesmo user.id (MIG-01, AC 10)
Proof: `npx vitest run server/api/register.post.test.ts -t "register token reads me"`

**C11** - Nenhum JSON de usuário traz password nem remember_token (MIG-01, AC 11)
Proof: `npx vitest run server/api/register.post.test.ts -t "register omits the password"`

**C12** - Login certo responde 200 com user e token (MIG-02, AC 1)
Proof: `npx vitest run server/api/user/login.post.test.ts -t "login returns 200"`

**C13** - Login errado responde 401 com message "Credenciais inválidas" e sem token (MIG-02, AC 2)
Proof: `npx vitest run server/api/user/login.post.test.ts -t "login rejects bad credentials"`

**C14** - O user do login não traz password (MIG-02, AC 3)
Proof: `npx vitest run server/api/user/login.post.test.ts -t "login omits the password"`

**C15** - GET /api/user/me devolve o mesmo token enviado (MIG-03, AC 1)
Proof: `npx vitest run server/api/user/me.get.test.ts -t "me returns the same token"`

**C16** - GET /api/user/me sem bearer ou com token desconhecido responde 401 (MIG-03, AC 2)
Proof: `npx vitest run server/api/user/me.get.test.ts -t "me rejects a missing token"`

**C17** - Logout responde "Logout realizado com sucesso" e o token seguinte recebe 401 (MIG-03, AC 3)
Proof: `npx vitest run server/api/user/logout.post.test.ts -t "logout revokes the token"`

**C18** - Logout sem bearer responde 401 (MIG-03, AC 4)
Proof: `npx vitest run server/api/user/logout.post.test.ts -t "logout rejects a missing token"`

**C19** - O scheme bearer minúsculo autentica (MIG-03, AC 5)
Proof: `npx vitest run server/api/user/me.get.test.ts -t "me accepts a lowercase bearer scheme"`

**C20** - GET /api/types-ocurrence devolve os cinco nomes do seed (MIG-04, AC 1)
Proof: `npx vitest run server/api/types-ocurrence.get.test.ts -t "lists the five seeded types"`

**C21** - GET /api/ocurrences devolve só linhas ativas com type, likes_count e liked_by_auth_user (MIG-05, AC 1)
Proof: `npx vitest run server/api/ocurrences/index.get.test.ts -t "lists only active occurrences"`

**C22** - Sem usuário válido, liked_by_auth_user é false (MIG-05, AC 2)
Proof: `npx vitest run server/domain/occurrences/list-active.test.ts -t "anonymous list sets liked_by_auth_user false"`

**C23** - Com curtida do chamador, liked_by_auth_user é true e likes_count é o número de linhas (MIG-05, AC 3)
Proof: `npx vitest run server/domain/occurrences/list-active.test.ts -t "list reports the caller like and the count"`

**C24** - Authorization vazio em GET /api/ocurrences responde 200 (MIG-05, AC 4)
Proof: `npx vitest run server/api/ocurrences/index.get.test.ts -t "empty authorization still lists"`

**C25** - O ponto [-23.55052, -46.633308] grava essa latitude e longitude e volta [-46.633308, -23.55052] (MIG-06, AC 1)
Proof: `npx vitest run server/api/ocurrences/index.post.test.ts -t "stores latitude first and returns longitude first"`

**C26** - description ou address_name omitido vira string vazia (MIG-06, AC 2)
Proof: `npx vitest run server/domain/occurrences/create.test.ts -t "stores blank description and address"`

**C27** - city, state ou country omitido fica null (MIG-06, AC 3)
Proof: `npx vitest run server/domain/occurrences/create.test.ts -t "stores null city state and country"`

**C28** - Criar sem token responde 401 e não insere linha (MIG-06, AC 4)
Proof: `npx vitest run server/api/ocurrences/index.post.test.ts -t "create rejects a missing token"`

**C29** - type_id inexistente inclui "O campo type id selecionado é inválido." (MIG-06, AC 5)
Proof: `npx vitest run server/api/ocurrences/index.post.test.ts -t "create rejects an unknown type"`

**C30** - description acima de 250 ou address_name acima de 500 responde 422 sem linha (MIG-06, AC 6)
Proof: `npx vitest run server/domain/occurrences/create.test.ts -t "rejects a description over 250"`

**C31** - user_id do corpo é ignorado (MIG-06, AC 7)
Proof: `npx vitest run server/api/ocurrences/index.post.test.ts -t "create ignores a body user id"`

**C32** - Dono com resolved ou other responde "Ocorrência inativada com sucesso." e grava is_active false (MIG-07, AC 1)
Proof: `npx vitest run server/api/ocurrences/inactivate/[id].post.test.ts -t "owner closes with resolved"`

**C33** - type_closure mistake apaga a linha e responde a mesma frase (MIG-07, AC 2)
Proof: `npx vitest run server/api/ocurrences/inactivate/[id].post.test.ts -t "owner mistake deletes the row"`

**C34** - Outro usuário recebe 403 "Você não tem permissão para inativar esta ocorrência." (MIG-07, AC 3)
Proof: `npx vitest run server/api/ocurrences/inactivate/[id].post.test.ts -t "other user receives 403"`

**C35** - Ocorrência já inativa responde 422 "Ocorrência já inativada." (MIG-07, AC 4)
Proof: `npx vitest run server/domain/occurrences/inactivate.test.ts -t "already inactive returns 422"`

**C36** - Payload inválido ou data futura responde 422 e a linha continua ativa (MIG-07, AC 5)
Proof: `npx vitest run server/domain/occurrences/inactivate.test.ts -t "rejects a future resolution date"`

**C37** - Inativar sem token responde 401 (MIG-07, AC 6)
Proof: `npx vitest run server/api/ocurrences/inactivate/[id].post.test.ts -t "inactivate rejects a missing token"`

**C38** - Id inexistente ao inativar responde 404 (MIG-07, AC 7)
Proof: `npx vitest run server/api/ocurrences/inactivate/[id].post.test.ts -t "inactivate missing id returns 404"`

**C39** - Falha ao gravar responde 422 "Não foi possível inativar a ocorrência." (MIG-07, AC 8)
Proof: `npx vitest run server/domain/occurrences/inactivate.test.ts -t "save failure returns the message object"`

**C40** - 15 ocorrências do chamador viram página de 10 e página de 5, com total 15 (MIG-08, AC 1)
Proof: `npx vitest run server/api/ocurrences/my-ocurrences.get.test.ts -t "pages the caller ten then five"`

**C41** - A lista do chamador vem por created_at descendente (MIG-08, AC 2)
Proof: `npx vitest run server/domain/occurrences/mine.test.ts -t "orders by created_at descending"`

**C42** - links têm url, label, page e active, sem `&laquo;` nem `&raquo;` (MIG-08, AC 3)
Proof: `npx vitest run server/api/ocurrences/my-ocurrences.get.test.ts -t "links have no html entities"`

**C43** - Ocorrência inativa do chamador entra na página (MIG-08, AC 4)
Proof: `npx vitest run server/api/ocurrences/my-ocurrences.get.test.ts -t "includes inactive rows"`

**C44** - Minhas ocorrências sem token responde 401 (MIG-08, AC 5)
Proof: `npx vitest run server/api/ocurrences/my-ocurrences.get.test.ts -t "my occurrences rejects a missing token"`

**C45** - page omitido devolve current_page 1 (MIG-08, AC 6)
Proof: `npx vitest run server/api/ocurrences/my-ocurrences.get.test.ts -t "omitted page is page 1"`

**C46** - Primeira curtida responde 201 "Ocorrência curtida com sucesso." (MIG-09, AC 1)
Proof: `npx vitest run server/api/ocurrences/like/[id].get.test.ts -t "first like returns 201"`

**C47** - Segunda chamada responde 200 "Curtida removida com sucesso." e some a linha (MIG-09, AC 2)
Proof: `npx vitest run server/api/ocurrences/like/[id].get.test.ts -t "second like returns 200 and removes the row"`

**C48** - O par user_id e ocurrence_id fica com no máximo uma linha (MIG-09, AC 3)
Proof: `npx vitest run server/domain/occurrences/like.test.ts -t "keeps one row per user and occurrence"`

**C49** - Curtir sem token responde 401 e não insere linha (MIG-09, AC 4)
Proof: `npx vitest run server/api/ocurrences/like/[id].get.test.ts -t "like rejects a missing token"`

**C50** - Curtir id inexistente responde 404 (MIG-09, AC 5)
Proof: `npx vitest run server/api/ocurrences/like/[id].get.test.ts -t "like missing id returns 404"`

**C51** - Os dez caminhos do contrato existem sob /api (MIG-10, AC 1)
Proof: `npx vitest run server/api/route-map.test.ts -t "mounted paths answer"`

---

## Handoff

**Settled mid-build:** none
**Dispatched:** Verifier 4b6f336f returned FAIL em verification.md. Passe de correção fechou C6, C5, C3, C15 e C51. Não redespachar.
**Walked:** none

---

## Phase Execution Map

```
Phase 1:  T1 → T2 → T3 → T4 → T5 → T6 → T7
Phase 2:  T8 → T9
Phase 3:  T10 → T11 → T12 → T13 → T14 → T15
Phase 4:  T16 → T17 → T18 → T19
Phase 5:  T20 → T21
Phase 6:  T22 → T23
Phase 7:  T24 → T25
Phase 8:  T26 → T27
Phase 9:  T28 → T29
```

São 29 tarefas em nove fases. T1 e T2 estão completas. Na execução, fases inteiras entram em lotes de cerca de sete tarefas. Mais de um lote pede confirmação antes de delegar. Este registro não dispara lote nenhum.
