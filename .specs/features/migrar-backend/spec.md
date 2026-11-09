# Migração do backend Laravel Specification

**Approved**: 2026-11-09 - user: "Aprovo o spec"

## Problem Statement

O mapa em Nuxt fala com a API Laravel em `NUXT_PUBLIC_API_BASE`. Esse backend fica em outro repositório, em PHP, com Sanctum e PostGIS. A migração traz as rotas que o front já chama para o Nitro deste repositório, no mesmo PostgreSQL com PostGIS, com banco novo e só o seed dos tipos. Quem já tem conta no Laravel entra de novo: nenhum usuário, ocorrência ou token é copiado.

## Goals

- [ ] As rotas que `authService` e `ocurrencesService` já chamam respondem neste app, com os mesmos caminhos, status e JSON que o mapa consome.
- [ ] Um ponto enviado como `[latitude, longitude]` volta como GeoJSON `[longitude, latitude]`, e o pino continua no lugar que o Leaflet já calcula.
- [ ] O banco novo sobe com PostGIS e os cinco tipos. Nenhuma linha do Postgres Laravel entra.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Cópia de usuários, ocorrências e likes | A decisão foi banco novo, só com o seed dos tipos. Tokens Sanctum não têm o que reaproveitar. |
| `DELETE /api/ocurrences/:id` | O Laravel não tem a rota. Nenhuma tela chama `removeOcurrence`. Encerrar é `inactivate`. |
| `GET /api/ocurrences/listar` | O front chama `GET /api/ocurrences`. |
| Sessão, cache, jobs, reset de senha, `email_verified_at` | Nenhuma rota do front usa essas tabelas. |
| Scribe e o app PHP | A fonte é o código das rotas, não a documentação gerada. |
| Telas Vue | Os composables permanecem. A troca de `NUXT_PUBLIC_API_BASE` é a última tarefa de implementação, não uma tela nova. |
| Limite de taxa | A API Laravel não limita. Esta migração não acrescenta throttle. |
| Supabase Auth | O stack fechado é Nitro neste repositório e PostgreSQL/PostGIS. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Onde o backend mora | Rotas Nitro neste Nuxt e PostgreSQL com PostGIS, SRID 4326 | Opção escolhida: "Nitro neste repositório + PostgreSQL/PostGIS" | y |
| Acesso ao banco | Prisma ORM 7, com o ponto em `Unsupported("geometry(Point, 4326)")` e a geometria em `$queryRaw` | Escolha de 2026-11-09: "Prisma 7 estável. Ponto via SQL no campo Unsupported" | y - user: "Prisma 7 estável. Ponto via SQL no campo Unsupported" |
| Dados iniciais | Schema vazio mais os cinco tipos do seeder | Opção escolhida: "Paridade do contrato que o front já chama; banco novo só com o seed dos 5 tipos" | y |
| Status de `POST /api/register` | 200 | O plano citou 201 a partir da anotação Scribe. `RegisterController` não passa status e `RegisterControllerFTest` afirma 200. O front não ramifica pelo código. | y - user: "200, igual ao controller e ao teste do Laravel (recomendado)" |
| `GET /api/user/me` | Devolve o mesmo token da requisição | O Laravel cria outro token a cada chamada e não revoga o anterior. O JSON continua `{ user, token }`. | y - plano aprovado |
| Likes | No máximo uma linha por `(user_id, ocurrence_id)` | O toggle e o JSON não mudam. A unicidade impede duas curtidas no mesmo par. | y - plano aprovado |
| Contagem de curtidas | Uma consulta agregada | O JSON de cada ocorrência permanece `likes_count` e `liked_by_auth_user`. | y - plano aprovado |
| DNS do e-mail | Função substituível nos testes; falha ou ausência de MX recusa o e-mail | A mensagem ao usuário continua a do FormRequest. O teste não depende da rede. | y - plano aprovado |
| Senha e token | bcrypt na senha; token opaco guardado só como hash SHA-256 | Um corte futuro ainda confere o hash do Laravel. O formato `id\|plaintext` do Sanctum não é necessário com banco vazio. | y - plano aprovado |
| Rótulos do paginator | `links[].label` sem `&laquo;` nem `&raquo;` | A página usa `data`, `total` e `per_page`. Os rótulos HTML do Laravel não aparecem na tela. | y - plano aprovado |
| Falha ao gravar a inativação | 422 `{ message: "Não foi possível inativar a ocorrência." }` | O Laravel devolve essa frase como string JSON, não como objeto. O front lê `message`. | y - plano aprovado |
| Fuso da idade e da data de resolução | Data UTC de calendário | `config/app.php` da API fixa `timezone` em UTC. | y |
| Expiração e arquivamento | N/A: nenhuma linha ganha TTL | A API atual não expira conta, token nem ocorrência. `mistake` apaga a linha; `resolved` e `other` deixam a linha inativa. | y |
| Observabilidade | N/A: sem métrica nem log novo | O contrato visível é o status e o JSON. Não há requisito de tracing nesta migração. | y |
| Concorrência fora do like | N/A: criar, login e inativar não ganham fila | O único par que pode duplicar sob retry é a curtida, e a unicidade cobre esse par. | y |

**Open questions:** none - all resolved or logged above

---

## User Stories

### P1: Cadastro ⭐ MVP

**User Story**: As a visitor, I want to register with name, email, password and birth date so that I receive a token and the password stays hashed.

**Why P1**: Sem conta nova o mapa autenticado não tem quem chamar.

**Acceptance Criteria**:

1. WHEN a visitor posts name, a unique email, a password that matches the pattern, the same password_confirmation, and a date_birth on or before the UTC date 18 years ago THEN the system SHALL respond 200 with user.id, user.name, user.email, user.date_birth equal to the submitted YYYY-MM-DD, user.created_at, user.updated_at and token, and SHALL omit password.
2. WHEN registration succeeds THEN the system SHALL store the password so a bcrypt check of the submitted password succeeds and the plaintext is absent from the row.
3. IF name is missing or blank THEN the system SHALL respond 422 with a non-empty errors.name and SHALL NOT insert a user.
4. IF name is longer than 100 characters THEN the system SHALL respond 422 with a non-empty errors.name and SHALL NOT insert a user.
5. IF the email is not RFC-shaped or the domain check reports no MX THEN the system SHALL respond 422 and errors.email SHALL include "O e-mail informado não é válido ou o domínio não existe."
6. IF the password is missing, shorter than 8, or outside `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&^()\-_=+])[A-Za-z\d@$!%*#?&^()\-_=+]{8,}$/` THEN the system SHALL respond 422 and errors.password SHALL include "A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial."
7. IF password_confirmation differs from password THEN the system SHALL respond 422 and errors.password SHALL include "A confirmação da senha não corresponde."
8. IF date_birth is after the UTC calendar date 18 years before today THEN the system SHALL respond 422 and errors.date_birth SHALL include "Você deve ter pelo menos 18 anos."
9. IF the email is already stored THEN the system SHALL respond 422 with a non-empty errors.email and SHALL NOT insert a second user.
10. WHEN registration succeeds THEN GET /api/user/me with that token SHALL respond 200 and user.id SHALL equal the created user.
11. The system SHALL omit password and remember_token from every user JSON.

**Independent Test**: Postar um cadastro válido e ler `/api/user/me` com o token. Repetir com senha fraca, menor de 18 anos e e-mail repetido e ver 422 sem linha nova.

---

### P1: Login

**User Story**: As a registered user, I want to exchange email and password for a token so that the map can call protected routes.

**Why P1**: O cookie `auth_token` nasce deste JSON.

**Acceptance Criteria**:

1. WHEN email and password match a stored user THEN the system SHALL respond 200 with user and token and SHALL omit password.
2. IF the email is unknown or the password does not match THEN the system SHALL respond 401 with message "Credenciais inválidas" and SHALL NOT return a token.
3. The system SHALL omit password from the login user JSON.

**Independent Test**: Criar um usuário, entrar com a senha certa e com a senha errada.

---

### P1: Sessão

**User Story**: As a signed-in user, I want `/user/me` and `/user/logout` so that the app can reload my profile and revoke the token.

**Why P1**: O front chama os dois ao abrir a sessão e ao sair.

**Acceptance Criteria**:

1. WHEN GET /api/user/me carries a valid bearer token THEN the system SHALL respond 200 with that user and with token equal to the token sent.
2. IF GET /api/user/me has no bearer or an unknown token THEN the system SHALL respond 401.
3. WHEN POST /api/user/logout carries a valid bearer token THEN the system SHALL respond 200 with message "Logout realizado com sucesso" and a later request with that same token SHALL respond 401.
4. IF POST /api/user/logout has no bearer THEN the system SHALL respond 401.
5. WHEN the scheme is `Bearer` or `bearer` THEN the system SHALL accept the token.

**Independent Test**: Entrar, ler `/user/me` com o mesmo token, sair, e repetir `/user/me` com o token revogado.

---

### P1: Tipos de ocorrência

**User Story**: As a visitor, I want the occurrence types so that the create form can offer the same five categories.

**Why P1**: O modal de criação lê `types_ocurrence` antes de gravar.

**Acceptance Criteria**:

1. WHEN the seed has run THEN GET /api/types-ocurrence SHALL respond 200 with types_ocurrence containing exactly "Problema de Iluminação", "Problema de Pavimentação", "Alagamento", "Acúmulo de Lixo" and "Falta de Pavimentação", each with id, name, created_at and updated_at.

**Independent Test**: Subir o banco com o seed e pedir `GET /api/types-ocurrence`.

---

### P1: Mapa público

**User Story**: As a visitor, I want the active occurrences so that the map can draw pins, counts and whether I liked each one.

**Why P1**: A página inicial só mostra o que esta lista devolve.

**Acceptance Criteria**:

1. WHEN active and inactive occurrences exist THEN GET /api/ocurrences SHALL respond 200 with ocurrences containing only the active rows, each with id, type_id, user_id, description, address_name, city, state, country, is_active, solution_description, resolution_date, type_closure, created_at, updated_at, location, type, likes_count and liked_by_auth_user.
2. WHILE the request has no valid user the system SHALL set liked_by_auth_user to false on every listed occurrence.
3. WHILE the caller has a like on a listed occurrence the system SHALL set liked_by_auth_user to true on that row and likes_count SHALL equal the number of like rows for that occurrence.
4. WHEN Authorization is missing or empty THEN GET /api/ocurrences SHALL respond 200.

**Independent Test**: Gravar uma ocorrência ativa e uma inativa, listar sem token e com o token de quem curtiu.

---

### P1: Criar ocorrência

**User Story**: As a signed-in user, I want to save a point and a type so that the pin shows on the map at the place I clicked.

**Why P1**: Sem o POST o mapa não recebe ocorrência nova.

**Acceptance Criteria**:

1. WHEN an authenticated user posts location.type "Point", location.coordinates [-23.55052, -46.633308], and an existing type_id THEN the system SHALL respond 201 with ocurrence.user_id equal to the caller, stored latitude -23.55052, stored longitude -46.633308, and location.coordinates [-46.633308, -23.55052].
2. WHEN description or address_name is omitted or null THEN the system SHALL store an empty string for that field.
3. WHEN city, state or country is omitted or null THEN the system SHALL store null for that field.
4. IF the create request has no valid token THEN the system SHALL respond 401 and SHALL NOT insert a row.
5. IF type_id does not exist THEN the system SHALL respond 422, errors.type_id SHALL include "O campo type id selecionado é inválido." and the system SHALL NOT insert a row.
6. IF description is longer than 250 characters or address_name is longer than 500 THEN the system SHALL respond 422 and SHALL NOT insert a row.
7. WHEN the body includes user_id THEN the system SHALL ignore it and store the authenticated user id.

**Independent Test**: Entrar, postar o ponto de São Paulo `[-23.55052, -46.633308]` e conferir o GeoJSON de volta `[-46.633308, -23.55052]`.

---

### P1: Inativar ocorrência

**User Story**: As the author of an occurrence, I want to close or delete it so that a resolved report leaves the map and a mistake disappears.

**Why P1**: O modal de encerramento posta neste caminho.

**Acceptance Criteria**:

1. WHEN the owner posts type_closure `resolved` or `other`, a solution_description of at most 500 characters, and a resolution_date null or on or before the UTC date of today THEN the system SHALL respond 200 with message "Ocorrência inativada com sucesso." and the row SHALL keep is_active false, that type_closure, that solution_description and that resolution_date.
2. WHEN the owner posts type_closure `mistake` THEN the system SHALL delete the row and SHALL respond 200 with message "Ocorrência inativada com sucesso."
3. IF another authenticated user posts the inactivate request THEN the system SHALL respond 403 with message "Você não tem permissão para inativar esta ocorrência." and the row SHALL stay unchanged.
4. IF the occurrence is already inactive THEN the system SHALL respond 422 with message "Ocorrência já inativada." and type_closure SHALL stay unchanged.
5. IF type_closure is missing or not one of `resolved`, `mistake` or `other`, or solution_description is missing for `resolved` or `other`, or solution_description is longer than 500, or resolution_date is after the UTC date of today THEN the system SHALL respond 422 and the row SHALL stay active.
6. IF the inactivate request has no valid token THEN the system SHALL respond 401 and the row SHALL stay unchanged.
7. IF the occurrence id does not exist THEN the system SHALL respond 404.
8. IF saving the inactivation throws THEN the system SHALL respond 422 with message "Não foi possível inativar a ocorrência."

**Independent Test**: Encerrar como dono com `resolved`, repetir e ver 422, e tentar com outro usuário e ver 403.

---

### P1: Minhas ocorrências

**User Story**: As a signed-in user, I want my occurrences page by page so that the table shows ten rows and the pager knows the total.

**Why P1**: `my-ocurrences.vue` lê `data`, `total` e `per_page`.

**Acceptance Criteria**:

1. WHEN the caller has 15 occurrences and another user has 3 THEN page 1 SHALL respond 200 with 10 data rows all owned by the caller, per_page 10 and total 15, and page 2 SHALL respond 200 with the other 5 rows owned by the caller.
2. The system SHALL order that list by created_at descending, so data[0].created_at is greater than or equal to data[1].created_at when both exist.
3. The system SHALL include current_page, data, per_page, total and links, each link SHALL have url, label, page and active, and no label SHALL contain `&laquo;` or `&raquo;`.
4. WHEN the caller owns an inactive occurrence THEN that row SHALL appear in the caller's pages.
5. IF the my-ocurrences request has no valid token THEN the system SHALL respond 401.
6. WHEN the page query is omitted THEN the system SHALL return current_page 1.

**Independent Test**: Criar 15 ocorrências para um usuário e 3 para outro, pedir a página 1 e a página 2.

---

### P1: Curtir

**User Story**: As a signed-in user, I want to like and unlike an occurrence so that the count and my flag change on the pin.

**Why P1**: O popup chama `GET /ocurrences/like/:id`.

**Acceptance Criteria**:

1. WHEN the caller has no like on the occurrence THEN GET /api/ocurrences/like/:id SHALL respond 201 with message "Ocorrência curtida com sucesso.", ocurrence.liked_by_auth_user true, and likes_count one greater than before.
2. WHEN the caller already has a like THEN GET /api/ocurrences/like/:id SHALL respond 200 with message "Curtida removida com sucesso.", ocurrence.liked_by_auth_user false, and the like row SHALL be gone.
3. The system SHALL keep at most one like row for the same user_id and ocurrence_id.
4. IF the like request has no valid token THEN the system SHALL respond 401 and SHALL NOT insert a like row.
5. IF the occurrence id does not exist THEN the system SHALL respond 404.

**Independent Test**: Curtir uma ocorrência, ver 201, curtir de novo e ver 200 sem a linha.

---

### P1: Caminhos

**User Story**: As the existing Nuxt client, I want the same path suffixes under `/api` so that changing the base URL is enough.

**Why P1**: Os composables já montam esses sufixos em `apiBase`.

**Acceptance Criteria**:

1. The system SHALL serve POST /api/register, POST /api/user/login, GET /api/user/me, POST /api/user/logout, GET /api/types-ocurrence, GET /api/ocurrences, POST /api/ocurrences, POST /api/ocurrences/inactivate/:id, GET /api/ocurrences/my-ocurrences and GET /api/ocurrences/like/:id.

**Independent Test**: Pedir cada caminho e receber um status diferente de 404.

---

## Edge Cases

- Idade no dia em que completa 18 anos, em UTC, entra no cadastro (MIG-01 AC 1 e AC 8).
- `resolution_date` igual à data UTC de hoje entra; o dia seguinte não entra (MIG-07 AC 1 e AC 5).
- Header `Authorization` vazio na listagem pública não desloga o mapa (MIG-05 AC 4).
- `user_id` no corpo da criação não troca o dono (MIG-06 AC 7).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| MIG-01 | P1: Cadastro | Tasks | Pending |
| MIG-02 | P1: Login | Tasks | Pending |
| MIG-03 | P1: Sessão | Tasks | Pending |
| MIG-04 | P1: Tipos de ocorrência | Tasks | Complete |
| MIG-05 | P1: Mapa público | Tasks | Complete |
| MIG-06 | P1: Criar ocorrência | Tasks | Complete |
| MIG-07 | P1: Inativar ocorrência | Tasks | Complete |
| MIG-08 | P1: Minhas ocorrências | Tasks | Complete |
| MIG-09 | P1: Curtir | Tasks | Complete |
| MIG-10 | P1: Caminhos | Tasks | Complete |

**Coverage:** 10 total, 10 mapped to tasks, 0 unmapped

---

## Sources

- `mapa_cidadao_api/routes/api.php` — caminhos e quais exigem Sanctum
- `mapa_cidadao_api/app/Http/Controllers/RegisterController.php` e `tests/Feature/Controller/RegisterControllerFTest.php` — cadastro responde 200
- `mapa_cidadao_api/app/Http/Controllers/AuthController.php` e `tests/Feature/Controller/AuthControllerFTest.php` — login, me e logout
- `mapa_cidadao_api/app/Http/Controllers/OcurrenceController.php`, `app/Services/OcurrenceService.php` e `tests/Feature/Controller/OcurrenceControllerFTest.php` — lista, criação, inativação, páginas e curtida
- `mapa_cidadao_api/app/Http/Requests/RegisterUserRequest.php`, `OcurrenceStoreRequets.php`, `InactiveOcurrenceRequest.php` — limites e frases
- `mapa_cidadao_api/database/seeders/TypeOcurrenceSeeder.php` — os cinco nomes
- `mapa_cidadao_api/vendor/clickbar/laravel-magellan/src/Data/Geometries/Point.php` — `makeGeodetic(latitude, longitude)`
- `mapa_cidadao_api/vendor/clickbar/laravel-magellan/src/IO/Generator/Geojson/GeojsonGenerator.php` — resposta `[longitude, latitude]`
- `components/map/LeafletMap.vue` — envia `[lat, lng]` e desenha `[coordinates[1], coordinates[0]]`
- `composables/authService.ts` e `composables/ocurrencesService.ts` — sufixos que o front chama

---

## Success Criteria

- [ ] Cadastro, login, mapa, criação, curtida, encerramento e minhas ocorrências passam pelos critérios acima sem o processo PHP.
- [ ] O ponto `[-23.55052, -46.633308]` volta como `[-46.633308, -23.55052]`.
- [ ] O banco de teste contém os cinco tipos e nenhuma linha copiada do Laravel.
