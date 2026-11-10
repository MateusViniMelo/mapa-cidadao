# Sessão cookie HttpOnly Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/sessao-cookie/design.md`
**Status**: Done
**Approved**: 2026-11-09 - user: "Implement the plan as specified, it is attached for your reference."
**Mutations**: 3
**Build**: `npx vitest run; npm run build`

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none - strong defaults applied. O Vitest inclui só `test/server/**/*.test.ts` (`vitest.config.ts`). Não há script de lint. O typecheck entra em `npm run build`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Domain de sessão e cookie | unit | Todos os ramos do prazo e das flags; 1:1 com SESS-01 AC 5 e AC 6 | `test/server/domain/auth/*.test.ts` | `npx vitest run test/server/domain/auth` |
| Rotas HTTP e coluna | integration | Rotas do corte: caminho feliz, cookie ruim, Bearer sem cookie, lista pública | `test/server/api/**/*.test.ts`, `test/server/db/**/*.test.ts` | `npx vitest run` |
| Schema Prisma | none | build gate only | `prisma/schema.prisma` | `npm run build` |
| Cliente Vue | unit | Cada frase e cada caminho do SESS-03, lendo o arquivo que o Vitest alcança | `test/server/app/session-client.test.ts` | `npx vitest run test/server/app/session-client.test.ts` |

## Gate Check Commands

> Generated from codebase - confirm before Execute. Não existe `npm run lint`. O typecheck entra em `npm run build`.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Depois de tarefa só com teste de domínio ou de arquivo | `npx vitest run test/server/domain/auth test/server/app/session-client.test.ts` |
| Full | Depois de tarefa com rota ou banco | `npx vitest run` |
| Build | Depois da última tarefa da fase, ou schema | `npx vitest run; npm run build` |

---

## Execution Plan

Uma fase só. Cinco tarefas, uma leva, neste agente.

### Phase 1: Sessão

```
T1 → T2 → T3 → T4 → T5
```

---

## Task Breakdown

### T1: Coluna expires_at ✅

**What**: `access_tokens.expires_at` obrigatório, default `NOW() + interval '7 days'`, e linhas já existentes recebem `created_at + 7 dias`.
**Where**: `prisma/schema.prisma`
**Depends on**: None
**Reuses**: `prisma/migrations/20261109213000_rename_ocurrence/migration.sql`
**Requirement**: SESS-01

**Done when**:

- [x] A migration aplica no banco de teste pelo `resetTestDatabase`
- [x] Um insert sem `expires_at` grava a coluna 604800 segundos à frente de `created_at`
- [x] Gate check passes: `npx vitest run`

**Tests**: integration
**Gate**: full

---

### T2: Prazo no domínio ✅

**What**: `login` e `registerUser` gravam `expires_at` com `sessionExpiry`. `readSession` devolve null quando o prazo passou.
**Where**: `server/domain/auth/session.ts`
**Depends on**: T1
**Reuses**: `hashToken` e `createToken`
**Requirement**: SESS-01

**Done when**:

- [x] Token vencido não volta de `readSession`
- [x] Cadastro e login gravam `expires_at` 604800 segundos depois de `created_at`
- [x] Gate check passes: `npx vitest run test/server/domain/auth test/server/api/register.post.test.ts test/server/api/user/login.post.test.ts`

**Tests**: unit
**Gate**: quick

---

### T3: Cookie no cadastro e no login ✅

**What**: O handler grava `Set-Cookie` e o JSON omite `token`. `callHandler` devolve o header.
**Where**: `server/domain/auth/cookie.ts`
**Depends on**: T2
**Reuses**: `server/test/call-handler.ts`
**Requirement**: SESS-01

**Done when**:

- [x] Cadastro e login certos respondem 200 sem a chave `token` e com o cookie HttpOnly
- [x] Login ruim responde 401 "Credenciais inválidas" sem cookie
- [x] `production` inclui Secure e outro `NODE_ENV` omite
- [x] Gate check passes: `npx vitest run test/server/domain/auth/cookie.test.ts test/server/api/register.post.test.ts test/server/api/user/login.post.test.ts`

**Tests**: integration
**Gate**: full

---

### T4: Rotas leem o cookie ✅

**What**: As rotas protegidas autenticam pelo cookie. Bearer sem cookie responde 401. A lista pública segue 200.
**Where**: `server/api/user/me.get.ts`
**Depends on**: T3
**Reuses**: `readSessionCookie` e `readSession`
**Requirement**: SESS-02

**Done when**:

- [x] Cookie dentro do prazo abre me, criar, inativar, minhas, like e logout
- [x] Cookie ausente, desconhecido ou vencido responde 401 "Não autenticado" nessas rotas
- [x] Bearer com o segredo certo, sem cookie, responde 401
- [x] Lista sem cookie responde 200. Cookie desconhecido responde 200 com `liked_by_auth_user` false
- [x] Logout válido apaga a linha. Logout ruim responde 401 e expira o cookie
- [x] O segundo login mantém a primeira linha e o primeiro cookie
- [x] Gate check passes: `npx vitest run`

**Tests**: integration
**Gate**: full

---

### T5: Cliente no mesmo origin ✅

**What**: Os stores chamam `/api` sem `Authorization`. Os três services e `apiBase` saem. O plugin reidrata `/api/user/me`. O login não recarrega.
**Where**: `stores/authStore.ts`
**Depends on**: T4
**Reuses**: `useRequestFetch` e o watch de `authStore.user` no mapa
**Requirement**: SESS-03

**Done when**:

- [x] O store de auth pede os quatro caminhos e não contém Authorization, useCookie, auth_token, auth_user nem apiBase
- [x] O toast de sucesso é "Login realizado com sucesso." e não há `window.location.reload`
- [x] A falha de login usa `err?.data?.message` ou "Erro ao entrar". A de cadastro usa "Erro ao registrar"
- [x] O store de ocorrências e o mapa pedem `/api/...`. Os três composables não existem
- [x] `nuxt.config.ts` não define `apiBase` e `.env.example` não contém `NUXT_PUBLIC_API_BASE`
- [x] O plugin chama `useRequestFetch` e `/api/user/me`. O middleware manda para `/` sem `user`
- [x] Gate check passes: `npx vitest run; npm run build`

**Tests**: unit
**Gate**: build

---

## Checks

**C1** - O cadastro certo responde 200 com o usuário e sem a chave token (SESS-01, AC 1)
Proof: `npx vitest run test/server/api/register.post.test.ts -t "register returns the user without a token"`

**C2** - O cadastro grava auth_token HttpOnly, SameSite=Lax, Path=/, Max-Age=604800, o hash e expires_at 604800 segundos depois (SESS-01, AC 2)
Proof: `npx vitest run test/server/api/register.post.test.ts -t "register sets the session cookie"`

**C3** - O login certo responde 200 sem token e com o mesmo cookie (SESS-01, AC 3)
Proof: `npx vitest run test/server/api/user/login.post.test.ts -t "login sets the session cookie"`

**C4** - Credencial ruim responde 401 Credenciais inválidas sem cookie e sem token (SESS-01, AC 4)
Proof: `npx vitest run test/server/api/user/login.post.test.ts -t "login rejects bad credentials"`

**C5** - NODE_ENV production inclui Secure (SESS-01, AC 5)
Proof: `npx vitest run test/server/domain/auth/cookie.test.ts -t "production cookie is secure"`

**C6** - NODE_ENV diferente de production omite Secure (SESS-01, AC 6)
Proof: `npx vitest run test/server/domain/auth/cookie.test.ts -t "non-production cookie omits secure"`

**C7** - O cookie dentro do prazo abre me, criar, inativar, minhas, like e logout (SESS-02, AC 1)
Proof: `npx vitest run test/server/api/session-cookie.test.ts -t "cookie opens protected routes"`

**C8** - Cookie ausente, desconhecido ou vencido responde 401 Não autenticado nas rotas protegidas (SESS-02, AC 2)
Proof: `npx vitest run test/server/api/session-cookie.test.ts -t "protected routes reject a bad cookie"`

**C9** - Bearer com o segredo certo e sem cookie responde 401 (SESS-02, AC 3)
Proof: `npx vitest run test/server/api/session-cookie.test.ts -t "bearer without a cookie is rejected"`

**C10** - A lista sem cookie responde 200 (SESS-02, AC 4)
Proof: `npx vitest run test/server/api/occurrences/index.get.test.ts -t "missing cookie still lists"`

**C11** - Cookie desconhecido na lista responde 200 e liked_by_auth_user false (SESS-02, AC 5)
Proof: `npx vitest run test/server/api/occurrences/index.get.test.ts -t "unknown cookie stays anonymous"`

**C12** - Logout válido responde Logout realizado com sucesso, apaga a linha e o me seguinte é 401 (SESS-02, AC 6)
Proof: `npx vitest run test/server/api/user/logout.post.test.ts -t "logout revokes the cookie"`

**C13** - Logout sem cookie, com cookie desconhecido ou vencido responde 401 e expira auth_token (SESS-02, AC 7)
Proof: `npx vitest run test/server/api/user/logout.post.test.ts -t "logout clears a bad cookie"`

**C14** - O segundo login mantém as duas linhas e o primeiro cookie abre me (SESS-02, AC 8)
Proof: `npx vitest run test/server/api/user/login.post.test.ts -t "second login keeps the first cookie"`

**C15** - O store de auth pede /api/register, /api/user/login, /api/user/me e /api/user/logout (SESS-03, AC 1)
Proof: `npx vitest run test/server/app/session-client.test.ts -t "auth store calls the session routes"`

**C16** - O store de auth não contém Authorization, useCookie, auth_token, auth_user nem apiBase (SESS-03, AC 2)
Proof: `npx vitest run test/server/app/session-client.test.ts -t "auth store keeps the token out of javascript"`

**C17** - O login certo mostra o toast Login realizado com sucesso. (SESS-03, AC 3)
Proof: `npx vitest run test/server/app/session-client.test.ts -t "login success toast"`

**C18** - O store de auth não contém window.location.reload (SESS-03, AC 4)
Proof: `npx vitest run test/server/app/session-client.test.ts -t "login does not reload"`

**C19** - A falha de login usa err?.data?.message ou Erro ao entrar (SESS-03, AC 5)
Proof: `npx vitest run test/server/app/session-client.test.ts -t "login failure toast"`

**C20** - A falha de cadastro usa err?.data?.message ou Erro ao registrar (SESS-03, AC 6)
Proof: `npx vitest run test/server/app/session-client.test.ts -t "register failure toast"`

**C21** - O store de ocorrências pede os caminhos /api/occurrences e não contém Authorization nem apiBase (SESS-03, AC 7)
Proof: `npx vitest run test/server/app/session-client.test.ts -t "occurrences store calls same origin"`

**C22** - O mapa pede /api/types-occurrence (SESS-03, AC 8)
Proof: `npx vitest run test/server/app/session-client.test.ts -t "map loads types from the same origin"`

**C23** - Os três composables de $fetch não existem (SESS-03, AC 9)
Proof: `npx vitest run test/server/app/session-client.test.ts -t "fetch wrappers are gone"`

**C24** - nuxt.config não define apiBase e .env.example não contém NUXT_PUBLIC_API_BASE (SESS-03, AC 10)
Proof: `npx vitest run test/server/app/session-client.test.ts -t "public api base is gone"`

**C25** - O plugin chama useRequestFetch e /api/user/me (SESS-03, AC 11)
Proof: `npx vitest run test/server/app/session-client.test.ts -t "plugin reloads the user"`

**C26** - Sem user o middleware navega para / (SESS-03, AC 12)
Proof: `npx vitest run test/server/app/session-client.test.ts -t "middleware follows the user"`

---

## Handoff

**Settled mid-build:** none
**Dispatched:** Verifier (generalPurpose, fresh) over `.specs/features/sessao-cookie/` — spec.md, tasks.md, proofs.md, diff against HEAD 108c048, validate.md. No screens sub-agent (no capture).
**Walked:** Em http://127.0.0.1:3000/, cadastro de Ana Silva (sessao.cookie.walk@gmail.com, senha Abcdef1!, nascimento 1990-01-15) entra e o avatar substitui Entrar; Sair volta a mostrar Entrar. Senha errada mostra o toast "Credenciais inválidas". Login certo mostra "Login realizado com sucesso.", window.__walk continua vivo e a navegação segue "navigate". document.cookie fica vazio, sem auth_token.

---

## Phase Execution Map

```
Phase 1

Phase 1:  T1 → T2 → T3 → T4 → T5
```

Cinco tarefas cabem numa leva. A execução fica neste agente.

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Coluna expires_at | 1 schema | Granular |
| T2: Prazo no domínio | 1 módulo | Granular |
| T3: Cookie no cadastro e no login | 1 módulo de cookie mais os dois handlers que o gravam | Granular |
| T4: Rotas leem o cookie | 1 leitor usado pelas rotas já existentes | Granular |
| T5: Cliente no mesmo origin | 1 store de sessão e os chamadores que perdem o Bearer | Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | início da cadeia | Match |
| T2 | T1 | T1 → T2 | Match |
| T3 | T2 | T2 → T3 | Match |
| T4 | T3 | T3 → T4 | Match |
| T5 | T4 | T4 → T5 | Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Rotas HTTP e coluna | integration | integration | OK |
| T2 | Domain de sessão e cookie | unit | unit | OK |
| T3 | Rotas HTTP e coluna | integration | integration | OK |
| T4 | Rotas HTTP e coluna | integration | integration | OK |
| T5 | Cliente Vue | unit | unit | OK |
