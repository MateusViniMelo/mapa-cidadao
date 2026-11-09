# Migração do backend Design

**Spec**: `.specs/features/migrar-backend/spec.md`
**Context**: `.specs/features/migrar-backend/context.md`
**Status**: Approved
**Approved**: 2026-11-09 - user: "está aprovado"

---

## Architecture Overview

As regras que mudam o que o mapa mostra ficam em `server/domain`. As rotas em `server/api` só traduzem HTTP. O Prisma ORM 7 fala com o PostgreSQL. O PostGIS guarda o ponto, e essa coluna entra e sai por SQL dentro do Prisma. O front continua nos composables atuais. A última tarefa aponta `NUXT_PUBLIC_API_BASE` para este Nitro.

```mermaid
flowchart LR
  composables[authService e ocurrencesService]
  routes[server/api]
  domain[server/domain]
  prisma[Prisma Client 7]
  db[(PostgreSQL PostGIS)]
  composables --> routes
  routes --> domain
  domain --> prisma
  prisma --> db
```

Pedido de ocorrência:

```mermaid
sequenceDiagram
  participant Map as LeafletMap
  participant Route as ocurrencesIndexPost
  participant Domain as createOccurrence
  participant Db as Prisma
  Map->>Route: coordinates lat, lng
  Route->>Domain: coordinates lat, lng
  Domain->>Db: $queryRaw ST_MakePoint lng, lat SRID 4326
  Db-->>Domain: id and ST_X ST_Y
  Domain-->>Route: GeoJSON lng, lat
  Route-->>Map: 201 ocurrence
```

`server/api/reverse-geocoding.ts` permanece. Nenhuma rota nova usa esse caminho.

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component | Location | How to Use |
| --- | --- | --- |
| Cliente HTTP do mapa | `composables/authService.ts`, `composables/ocurrencesService.ts` | Não mudam os sufixos. Só a base URL na última tarefa. |
| Contrato TypeScript | `interfaces/IOcurrence.ts`, `interfaces/IUser.ts`, `interfaces/responses/MyOcurrencesResponse.ts` | O JSON novo tem de caber nesses tipos. |
| Eixo do pino | `components/map/LeafletMap.vue` | Envia `[lat, lng]` e desenha `[coordinates[1], coordinates[0]]`. O backend preserva essa troca. |
| Geocodificação | `server/api/reverse-geocoding.ts` | Continua no Nitro, fora das rotas migradas. |
| Frases e limites | FormRequests e testes Feature em `mapa_cidadao_api` | Copiar os valores, não o PHP. |
| Colunas já escritas | `server/db/schema.sql` | A migration copia essas tabelas e o arquivo sai. Não ficam dois DDL. |

### Integration Points

| System | Integration Method |
| --- | --- |
| Front Nuxt | `runtimeConfig.public.apiBase` + os sufixos já escritos nos composables |
| PostgreSQL/PostGIS | `DATABASE_URL`, Prisma 7 com `@prisma/adapter-pg` e `pg` |
| DNS do e-mail | `node:dns/promises` `resolveMx`, trocável por injeção no teste |

---

## Components

### Banco e migração

- **Purpose**: Sobe o PostGIS, descreve as tabelas no Prisma e insere os cinco tipos.
- **Location**: `docker-compose.yml`, `prisma/schema.prisma`, `prisma.config.ts`, `prisma/migrations/20261109120000_init/migration.sql`, `prisma/seed.ts`, `server/db/client.ts`, `server/db/migrate.ts`
- **Interfaces**:
  - `getPrisma(): PrismaClient` — uma instância por processo, adapter `PrismaPg({ connectionString })`
  - `resetTestDatabase(prisma): Promise<void>` — `prisma migrate deploy` no banco `mapa_cidadao_test`, trunca as tabelas de domínio e chama o seed
- **Dependencies**: imagem `postgis/postgis:16-3.4`, `prisma` major 7, `@prisma/client` 7, `@prisma/adapter-pg`, `pg`, `dotenv`, `tsx`
- **Reuses**: colunas de `server/db/schema.sql`, que a migration substitui

O generator é `prisma-client`, com `output = "../generated/prisma"` e `importFileExtension = "ts"`. O import do server é `generated/prisma/client`. A pasta `generated` não entra no git. O `postinstall` fica `prisma generate && nuxt prepare`.

`prisma.config.ts` aponta o schema, a pasta `prisma/migrations` e o seed `tsx prisma/seed.ts`. A URL sai de `env("DATABASE_URL")`.

A migration inicial sai de:

```
prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script
```

A primeira linha do arquivo, antes do diff, é `CREATE EXTENSION IF NOT EXISTS "postgis";`. O diff não cria a extensão. O preview `postgresqlExtensions` não entra no schema.

O client não carrega `.env`. O Nitro já lê o `.env` do Nuxt. O CLI lê pelo `dotenv/config` importado em `prisma.config.ts`.

### Cadastro e sessão

- **Purpose**: Valida o cadastro, confere a senha e emite ou revoga o token.
- **Location**: `server/domain/auth/register.ts`, `server/domain/auth/session.ts`, `server/domain/auth/email-domain.ts`
- **Interfaces**:
  - `validateRegistration(input, domainCheck): { ok: true, value } | { ok: false, errors }`
  - `emailDomainAcceptsMail(email: string): Promise<boolean>`
  - `registerUser(db, input): Promise<{ user, token }>`
  - `login(db, email, password): Promise<{ user, token } | null>`
  - `readSession(db, token): Promise<{ user, token } | null>`
  - `logout(db, token): Promise<boolean>`
- **Dependencies**: `bcryptjs` custo 12, `node:crypto` SHA-256 do token, `PrismaClient`
- **Reuses**: frases de `RegisterUserRequest.php` e status de `RegisterControllerFTest.php` e `AuthControllerFTest.php`

`registerUser` grava usuário e token em `db.$transaction`. E-mail repetido chega como `PrismaClientKnownRequestError` com código `P2002` e a rota responde 422 sem segundo usuário. O JSON de usuário não inclui `password`. `date_birth` sai como `YYYY-MM-DD` em UTC. `created_at` e `updated_at` saem como string ISO-8601.

### Ocorrências

- **Purpose**: Lista, cria, inativa, pagina e alterna a curtida.
- **Location**: `server/domain/catalog/list-types.ts`, `server/domain/occurrences/list-active.ts`, `server/domain/occurrences/create.ts`, `server/domain/occurrences/inactivate.ts`, `server/domain/occurrences/mine.ts`, `server/domain/occurrences/like.ts`, `server/domain/geo.ts`
- **Interfaces**:
  - `requestPoint(coordinates: [number, number]): { latitude: number, longitude: number }` — índice 0 é latitude
  - `geoJsonCoordinates(latitude: number, longitude: number): [number, number]` — `[longitude, latitude]`
  - `listTypes(db)`
  - `withLikeFlags(rows, likes, userId)` — puro, sem banco
  - `listActive(db, userId: number | null)`
  - `createOccurrence(db, userId, body)`
  - `inactivateOccurrence(db, userId, id, body)`
  - `sliceMine(rows, page)` — puro, dez por página
  - `listMine(db, userId, page: number)`
  - `toggleLike(db, userId, id)`
- **Dependencies**: `ST_MakePoint`, `ST_X`, `ST_Y` dentro de `db.$queryRaw` e `db.$executeRaw`. A query não seleciona a coluna `geometry` crua. O Prisma pede cast para um tipo que o client conhece, e `ST_X` / `ST_Y` já devolvem `float8`.
- **Reuses**: `OcurrenceService.php` e o teste Feature de ocorrências

`create`, `update` e `upsert` de `Ocurrence` não existem no client, porque `location` é `Unsupported` obrigatório. Criar a ocorrência e gravar o encerramento usam SQL parametrizado na transação. Apagar o caso `mistake` usa `delete`, que o client ainda gera. Tipo, curtida e as listas que não precisam da coluna geometry usam o client. A lista pública e a página do chamador precisam do ponto, então a leitura dessas duas também passa por `$queryRaw`.

Inserção do ponto: `ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)` com latitude em `coordinates[0]` e longitude em `coordinates[1]`. Leitura: `ST_Y` é latitude, `ST_X` é longitude, e o JSON monta `[ST_X, ST_Y]`.

### Rotas HTTP

- **Purpose**: Lê o bearer, chama o domínio e devolve o status do spec.
- **Location**: arquivos em `server/api` listados em Data Models
- **Interfaces**: cada arquivo exporta o handler do Nitro. `bearerToken(header: string | undefined): string | null` aceita `Bearer` e `bearer`. Header ausente ou vazio vira `null`.
- **Dependencies**: handlers do domínio
- **Reuses**: sufixos de `authService.ts` e `ocurrencesService.ts`

Validação 422 usa `{ message, errors }`. `message` é a primeira frase de `errors`. Falha de banco não tratada responde 500 e não deixa meia linha: cadastro, criação e inativação rodam numa transação do Prisma.

---

## Data Models

Os models usam os nomes de coluna do JSON. `@@map` fixa a tabela. O id é `Int` `@default(autoincrement())`, porque o front tipa `id` como `number` e um `BigInt` do Prisma quebra o `JSON.stringify`.

### User

```typescript
interface User {
  id: number
  name: string
  email: string
  date_birth: string
  created_at: string
  updated_at: string
}
```

**Relationships**: um usuário tem muitas ocorrências, muitos tokens e muitas curtidas. A coluna `password` existe na tabela e não sai no JSON. Tabela `users`.

### AccessToken

```typescript
interface AccessToken {
  id: number
  user_id: number
  token_hash: string
  created_at: string
}
```

**Relationships**: pertence a um usuário, `onDelete: Cascade`. A string entregue ao cliente não é gravada. Só o SHA-256, único. Tabela `access_tokens`.

### TypeOcurrence

```typescript
interface TypeOcurrence {
  id: number
  name: string
  created_at: string
  updated_at: string
}
```

**Relationships**: um tipo tem muitas ocorrências. `name` é único. O seed faz upsert pelos cinco nomes e não duplica se rodar de novo. Tabela `types_ocurrence`.

### Ocurrence

```typescript
interface Ocurrence {
  id: number
  location: { type: "Point"; coordinates: [number, number] }
  type_id: number
  type: TypeOcurrence
  user_id: number
  description: string
  address_name: string
  city: string | null
  state: string | null
  country: string | null
  is_active: boolean
  type_closure: "resolved" | "mistake" | "other" | null
  solution_description: string | null
  resolution_date: string | null
  created_at: string
  updated_at: string
  liked_by_auth_user: boolean
  likes_count: number
}
```

**Relationships**: pertence a um usuário e a um tipo, os dois com `onDelete: Cascade`. `location` no schema é `Unsupported("geometry(Point, 4326)")`. `type_closure` é o enum Prisma `resolved`, `mistake`, `other`, coluna nula. `description` e `address_name` são `String @default("") @db.Text`. `resolution_date` é `DateTime? @db.Date`. Tabela `ocurrences`.

### LikeOcurrence

```typescript
interface LikeOcurrence {
  id: number
  user_id: number
  ocurrence_id: number
  created_at: string
  updated_at: string
}
```

**Relationships**: `@@unique([user_id, ocurrence_id])`. Apagar a ocorrência apaga as curtidas. Tabela `like_ocurrences`.

### Rotas

| Arquivo | HTTP |
| --- | --- |
| `server/api/register.post.ts` | POST /api/register |
| `server/api/user/login.post.ts` | POST /api/user/login |
| `server/api/user/me.get.ts` | GET /api/user/me |
| `server/api/user/logout.post.ts` | POST /api/user/logout |
| `server/api/types-ocurrence.get.ts` | GET /api/types-ocurrence |
| `server/api/ocurrences/index.get.ts` | GET /api/ocurrences |
| `server/api/ocurrences/index.post.ts` | POST /api/ocurrences |
| `server/api/ocurrences/inactivate/[id].post.ts` | POST /api/ocurrences/inactivate/:id |
| `server/api/ocurrences/my-ocurrences.get.ts` | GET /api/ocurrences/my-ocurrences |
| `server/api/ocurrences/like/[id].get.ts` | GET /api/ocurrences/like/:id |

Testes de rota importam o handler e usam `callHandler` do `h3`. Não sobem o `nuxt dev`. O teste de caminhos confere os dez arquivos e chama um handler que já responde.

O Vitest aponta `DATABASE_URL` para `postgresql://mapa_cidadao:mapa_cidadao@localhost:5432/mapa_cidadao_test` e recusa outro nome de banco. O reset trunca. O banco de desenvolvimento não entra nessa URL.

---

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
| --- | --- | --- |
| Cadastro inválido | 422 `{ message, errors }` | O toast mostra `message`. O campo fica em `errors`. |
| E-mail único no banco | `P2002` vira 422 com `errors.email` | Não nasce a segunda conta. |
| Login ruim | 401 `{ message: "Credenciais inválidas" }` | O front mostra a frase. |
| Token ausente ou desconhecido numa rota protegida | 401 | A tela trata como sessão inválida. |
| Listagem pública sem token | 200 e `liked_by_auth_user` false | O mapa abre sem login. |
| Inativar ocorrência de outro | 403 com a frase do spec | O mapa avisa que não pode encerrar. |
| Já inativa, payload ruim ou falha ao gravar | 422 com a frase do spec | Nada muda na linha, exceto a falha de gravação que não confirma o encerramento. |
| Id inexistente em inativar ou curtir | 404 | O front cai no erro genérico que já tem. |
| Banco rejeita a transação | 500 e rollback | Nenhuma linha parcial de cadastro, criação ou inativação. |

---

## Risks & Concerns

| Concern | Location (file:line) | Impact | Mitigation |
| --- | --- | --- | --- |
| O mapa envia latitude no índice 0 e lê longitude no índice 0 | `components/map/LeafletMap.vue:232` e `components/map/LeafletMap.vue:140` | Inverter um dos lados desloca todos os pinos | `requestPoint` e `geoJsonCoordinates` com o exemplo de São Paulo no teste de criação |
| `makeGeodetic` trata o índice 0 como latitude e o GeoJSON devolve longitude primeiro | `mapa_cidadao_api/app/Services/OcurrenceService.php:18` | O comentário do teste PHP usa a ordem GeoJSON e não a ordem do front | O spec fixa `[-23.55052, -46.633308]` na ida e `[-46.633308, -23.55052]` na volta |
| Campo `Unsupported` obrigatório tira `create`, `update` e `upsert` | documentação do Prisma 7, tipo `Unsupported` | A ocorrência não grava pelo client gerado | Criar e encerrar usam `$queryRaw` e `$executeRaw`. `delete` permanece para `mistake` |
| `npm install prisma` sem major instala o ORM 8 | CLI `prisma@latest` em novembro de 2026 | O 8 não lê `schema.prisma` | `package.json` fixa `prisma` em `^7` e `@prisma/client` em `^7` |
| O reset de teste trunca tabelas | `server/db/migrate.ts` | Um `DATABASE_URL` de desenvolvimento perderia os dados locais | O Vitest só aceita o banco `mapa_cidadao_test` |
| `/me` cria token novo e não apaga o antigo | `mapa_cidadao_api/app/Http/Controllers/AuthController.php:75` | Tokens se acumulam | `readSession` devolve o mesmo token. O spec marca o desvio |
| `likes_count` e `liked_by_auth_user` disparam uma query por ocorrência | `mapa_cidadao_api/app/Models/Ocurrence.php:70` | A lista do mapa cresce em N+1 | `listActive` agrega as curtidas numa consulta |
| O front tem `DELETE /ocurrences/:id` sem rota | `composables/ocurrencesService.ts:53` | Quem chamar `removeOcurrence` continua sem backend | Fora de escopo. Nenhuma tarefa cria essa rota |
| Este repositório não tem runner de teste | `package.json` scripts | A implementação não tem onde provar o spec | A fase 2 adiciona Vitest |
| `schema.sql` e a migration descreveriam o mesmo banco | `server/db/schema.sql` | Dois DDL divergem | A tarefa da migration apaga `schema.sql` |

---

## Tech Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Acesso ao banco | Prisma ORM 7 e `@prisma/adapter-pg` | Escolha de 2026-11-09. A major 8 ainda é release candidate. |
| Coluna do ponto | `Unsupported("geometry(Point, 4326)")` e `$queryRaw` | O Prisma 7 não tem tipo geometry. O client não grava essa coluna. |
| DDL | Prisma Migrate. `schema.sql` sai | Uma fonte só. A extensão PostGIS entra na primeira linha da migration. |
| Id | `Int` autoincrement | O JSON do front usa `number`. `BigInt` não serializa. |
| Testes | Vitest. Domínio em `server/domain/**/*.test.ts`. Rotas em `server/api/**/*.test.ts` com `callHandler` | O domínio prova a regra. A rota prova o status e o JSON. O banco de teste é o PostGIS do compose. |
| Senha | `bcryptjs` custo 12 | É o custo padrão do Laravel. Um hash antigo ainda confere se um dia houver cópia. |
| Token | 32 bytes em base64url, coluna com SHA-256 | O cliente só reenvia a string. O banco vazio não precisa do prefixo do Sanctum. |

AD-001 em `.specs/STATE.md` registra o PostGIS. AD-002 registra o Prisma 7.
