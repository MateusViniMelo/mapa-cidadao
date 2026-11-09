# migrar-backend verification

**Verdict**: FAIL
**Mutations**: 3 - probed C6, C5, C3
**Proofs**: `proofs.md` at 106c7c8
**Verifier**: independent sub-agent (author != verifier)

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| O mínimo da senha pode passar de 8 para 9 e C6 continua verde | mutation `password minimum length 8 -> 9` not killed. C6 só rejeita `undefined`, `Ab1!` (4) e `Abcdefg1` (8 sem especial); os três continuam inválidos com `{9,}`. O mesmo conjunto também não isola a classe `(?=.*[A-Z])` | No C6, aceitar `Abcdef1!` (8 caracteres no padrão do spec) e recusar `Abcde1!` (7) e `abcdef1!` (sem maiúscula), com a frase da senha | C6 |
| Falha de MX passa a aceitar o e-mail e C5 continua verde | mutation `mx failure accepts the email` not killed em `server/domain/auth/email-domain.ts:12` (`catch` devolve `true`). C5 injeta `async () => false` e não chama `emailDomainAcceptsMail` | Testar `emailDomainAcceptsMail` com `resolveMx` que lança e com lista MX vazia; os dois casos recusam | C5 |
| O cadastro inválido pode responder 400 e C3 continua verde | mutation `registration validation status 422 -> 400` not killed. `register.test.ts` afirma `ok === false` e `errors.name` não vazio; não lê o status HTTP nem a contagem de usuários. O 422 mora na rota, camada que a matriz marca como integração | Postar nome em branco em `POST /api/register`, esperar 422 e a mesma contagem de usuários | C3 |
| GET /api/user/me pode incluir password no JSON do usuário | MIG-01 AC 11 exige omitir `password` e `remember_token` em todo JSON de usuário. C11 trava as chaves do cadastro e C14 as do login. C15 (`me.get.test.ts`, "me returns the same token") afirma o token, `user.id` e a contagem de tokens | No teste de `GET /api/user/me`, afirmar as chaves públicas e a ausência de `password` e `remember_token` | C15 |
| C51 pede um dos dez caminhos | MIG-10 AC 1 lista dez caminhos. `route-map.test.ts` afirma que há 10 funções e chama só `GET /api/types-ocurrence`, com `status !== 404` | Pedir os dez caminhos do contrato e esperar status diferente de 404 em cada um | C51 |

Os dois exemplos que o spec não nomeia seguraram a regra no código atual: `abcdef1!` recebe a frase da senha (MIG-01 AC 6); `resolution_date` `2024-02-29` grava essa data e responde 200 (MIG-07 AC 1).
