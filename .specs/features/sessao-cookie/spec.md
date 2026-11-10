# Sessão cookie HttpOnly Specification

**Approved**: 2026-11-09 - user: "Implement the plan as specified, it is attached for your reference."

## Problem Statement

O Pinia grava o token cru em `auth_token` e o usuário em `auth_user`. Os dois cookies são legíveis por script e não expiram. Cada chamada remonta `Authorization` e usa `NUXT_PUBLIC_API_BASE`, que aponta para este mesmo Nuxt. O login recarrega a página, e a falha do login cai no texto "Erro ao registrar".

## Goals

- [x] O Nitro grava `auth_token` HttpOnly, `SameSite=Lax`, `Max-Age=604800`, e a linha expira 7 dias depois de criada.
- [x] O JSON de cadastro, login e `/api/user/me` omite `token`. Sem o cookie, `Authorization` não autentica.
- [x] O cliente chama `/api/...` no mesmo origin. Os três embrulhos de `$fetch` saem. O login não recarrega a página.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Token de CSRF | O plano fixa `SameSite=Lax` como o controle deste corte. |
| Like de GET para POST | O verbo permanece. Uma navegação de outro site para essa URL leva o cookie. |
| Lembrar de mim | O prazo é único: 7 dias, sem renovar. |
| Revogar as outras sessões no login | Cada linha vive até o próprio `expires_at` ou até o logout daquele cookie. |
| Rota DELETE de ocorrência | O cliente continua chamando o caminho. A rota continua ausente. |
| Commit ou push | A aprovação cobre a implementação local. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Canal da sessão | Só o cookie. O JSON omite `token`. `Authorization` não autentica | Escolha do usuário em 2026-11-09: "Só o cookie" | y |
| Prazo | 7 dias a partir do cadastro ou do login, sem renovar | Escolha do usuário em 2026-11-09: "7 dias a partir do login ou do cadastro, sem renovar" | y |
| Nome e flags do cookie | `auth_token`, `Path=/`, `HttpOnly`, `SameSite=Lax`, `Max-Age=604800`. `Secure` só com `NODE_ENV=production` | O plano aprovado fixa esses atributos | y |
| `auth_user` | Sai. O usuário fica na memória e volta no refresh por `GET /api/user/me` | O script deixa de guardar sessão. O mapa já observa `authStore.user` | y |
| Toast de login certo | "Login realizado com sucesso." e a página não recarrega | O plano troca o `reload` por esse texto, que já estava comentado no store | y |
| Falha de login | A `message` da API, ou "Erro ao entrar" quando ela falta | O plano corrige o fallback "Erro ao registrar" | y |
| Falha de cadastro | A `message` da API, ou "Erro ao registrar" quando ela falta | O plano mantém o fallback do cadastro | y |
| Terceiro embrulho | `typesOccurrencesService` sai junto | Também só chama `$fetch` em `apiBase`. O mapa pede `GET /api/types-occurrence` | y |
| `apiBase` | `runtimeConfig.public.apiBase` e `NUXT_PUBLIC_API_BASE` saem de `.env.example` | Nada no cliente aponta mais para essa base | y |
| Listagem pública | Sem cookie, ou com cookie inválido, `GET /api/occurrences` responde 200 e anônima | O plano mantém a lista aberta | y |
| Logout ruim | Cookie ausente, desconhecido ou vencido responde 401 e o `Set-Cookie` expira `auth_token` | O plano manda limpar o cookie mesmo no 401 | y |
| Login repetido | A linha anterior permanece e o primeiro cookie continua válido | O plano diz que um login novo não apaga as linhas anteriores | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Cookie de sessão ⭐ MVP

**User Story**: Como visitante, quero que o cadastro e o login gravem a sessão num cookie que o script não lê, com prazo de 7 dias.

**Why P1**: Sem isso o token continua no JavaScript.

**Acceptance Criteria**:

1. WHEN registration succeeds THEN the system SHALL respond 200 and the JSON SHALL include user.id, user.name, user.email, user.date_birth equal to the submitted YYYY-MM-DD, user.created_at and user.updated_at, and SHALL omit password, remember_token and the token key.
2. WHEN registration succeeds THEN the system SHALL set cookie auth_token to the opaque token with HttpOnly, SameSite=Lax, Path=/ and Max-Age=604800, SHALL store only the SHA-256 hash, and SHALL set expires_at 604800 seconds after created_at.
3. WHEN email and password match a stored user THEN the system SHALL respond 200 with that user, SHALL omit the token key, and SHALL set cookie auth_token with HttpOnly, SameSite=Lax, Path=/ and Max-Age=604800.
4. IF the email is unknown or the password does not match THEN the system SHALL respond 401 with message "Credenciais inválidas" and SHALL NOT set a cookie and SHALL NOT return a token.
5. WHEN NODE_ENV is production THEN the session cookie SHALL include Secure.
6. WHEN NODE_ENV is not production THEN the session cookie SHALL omit Secure.

**Independent Test**: Cadastrar e entrar. A resposta traz o usuário, o `Set-Cookie` é HttpOnly por 7 dias, e o corpo não tem `token`. Senha errada responde 401 sem cookie.

---

### P1: Rotas leem o cookie ⭐ MVP

**User Story**: Como usuário com sessão, quero que as rotas protegidas me reconheçam pelo cookie e recusem um Bearer solto.

**Why P1**: O cookie só protege se a API deixar de aceitar o header.

**Acceptance Criteria**:

1. WHEN GET /api/user/me, POST /api/occurrences, POST /api/occurrences/inactivate/:id, GET /api/occurrences/my-occurrences, GET /api/occurrences/like/:id or POST /api/user/logout carries a cookie inside expires_at THEN the system SHALL accept that session.
2. IF the cookie is missing, unknown or past expires_at THEN GET /api/user/me, POST /api/occurrences, POST /api/occurrences/inactivate/:id, GET /api/occurrences/my-occurrences, GET /api/occurrences/like/:id and POST /api/user/logout SHALL respond 401 with message "Não autenticado".
3. IF Authorization is Bearer with the valid secret and the cookie is absent THEN those protected routes SHALL respond 401.
4. WHEN GET /api/occurrences has no cookie THEN the system SHALL respond 200.
5. WHEN GET /api/occurrences carries an unknown cookie THEN the system SHALL respond 200 and liked_by_auth_user SHALL be false.
6. WHEN POST /api/user/logout carries a cookie inside the deadline THEN the system SHALL respond 200 with message "Logout realizado com sucesso", SHALL delete that access token row, and a later GET /api/user/me with that cookie SHALL respond 401.
7. IF POST /api/user/logout has no cookie, an unknown cookie or an expired cookie THEN the system SHALL respond 401 and SHALL send a Set-Cookie that expires auth_token.
8. WHEN a user logs in a second time THEN the system SHALL keep both access token rows and the first cookie SHALL still open GET /api/user/me.

**Independent Test**: Entrar, chamar as rotas protegidas com o cookie, repetir com Bearer sem cookie e ver 401. Sair e ver a linha apagada. Entrar de novo e ver o primeiro cookie ainda válido.

---

### P1: Cliente no mesmo origin ⭐ MVP

**User Story**: Como usuário do mapa, quero entrar sem recarregar a página e sem que o script guarde o token.

**Why P1**: O cookie HttpOnly não adianta se o cliente ainda monta o Bearer.

**Acceptance Criteria**:

1. The auth store SHALL request `/api/register`, `/api/user/login`, `/api/user/me` and `/api/user/logout`.
2. The auth store SHALL NOT contain `Authorization`, `useCookie`, `auth_token`, `auth_user` or `apiBase`.
3. WHEN login succeeds THEN the auth store SHALL toast the description "Login realizado com sucesso."
4. The auth store SHALL NOT contain `window.location.reload`.
5. IF login fails THEN the auth store SHALL toast `err?.data?.message` or "Erro ao entrar".
6. IF register fails THEN the auth store SHALL toast `err?.data?.message` or "Erro ao registrar".
7. The occurrences store SHALL request `/api/occurrences`, `/api/occurrences/inactivate/`, `/api/occurrences/my-occurrences`, `/api/occurrences/like/` and `/api/occurrences/` for delete, and SHALL NOT contain `Authorization` or `apiBase`.
8. The map component SHALL request `/api/types-occurrence`.
9. The system SHALL NOT keep `composables/authService.ts`, `composables/occurrencesService.ts` or `composables/typesOccurrencesService.ts`.
10. The system SHALL NOT define `runtimeConfig.public.apiBase`, and `.env.example` SHALL NOT contain `NUXT_PUBLIC_API_BASE`.
11. The auth plugin SHALL call `useRequestFetch` and `GET /api/user/me`.
12. WHILE the user is absent the auth middleware SHALL navigate to `/`.

**Independent Test**: Abrir o mapa, entrar com senha certa e ver o toast sem reload. Errar a senha e ver "Credenciais inválidas". `document.cookie` não contém o segredo.

---

## Edge Cases

- IF the logout cookie is expired THEN the system SHALL respond 401 and SHALL expire auth_token.
- IF GET /api/occurrences receives an unknown cookie THEN the system SHALL respond 200 with liked_by_auth_user false.
- WHEN a second login succeeds THEN the first cookie SHALL still open GET /api/user/me.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| SESS-01 | P1: Cookie de sessão | Execute | Verified |
| SESS-02 | P1: Rotas leem o cookie | Execute | Verified |
| SESS-03 | P1: Cliente no mesmo origin | Execute | Verified |

**Coverage:** 3 total, 3 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [x] Cadastro e login respondem 200 com `user`, sem a chave `token`, e com `Set-Cookie` HttpOnly de 604800 segundos.
- [x] Bearer sem cookie recebe 401 nas rotas protegidas. A lista pública continua 200.
- [x] O cliente chama `/api` no mesmo origin, o login não recarrega a página, e a falha do login não diz "Erro ao registrar".
