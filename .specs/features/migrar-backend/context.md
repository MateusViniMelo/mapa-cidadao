# Migrar backend Context

**Gathered:** 2026-11-09
**Spec:** `.specs/features/migrar-backend/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Trazer para este Nuxt as rotas que o front já chama na API Laravel: cadastro, login, sessão, tipos, listagem pública, criação, inativação, minhas ocorrências e curtida. O banco é PostgreSQL com PostGIS, novo, só com o seed dos cinco tipos. Nenhum dado do Postgres Laravel é copiado.

---

## Implementation Decisions

### Stack

- Nitro neste repositório + PostgreSQL/PostGIS.
- Palavras da escolha: "Nitro neste repositório + PostgreSQL/PostGIS (recomendado)".

### Contrato e dados

- Paridade do contrato que o front já chama.
- Banco novo só com o seed dos 5 tipos.
- Palavras da escolha: "Paridade do contrato que o front já chama; banco novo só com o seed dos 5 tipos (recomendado)".
- `POST /api/register` fica em 200. Palavras da escolha: "200, igual ao controller e ao teste do Laravel (recomendado)". O 201 escrito no plano vinha da anotação Scribe, não do código.

### Ajustes já escritos no plano

- `/user/me` devolve o mesmo token da requisição.
- No máximo uma curtida por usuário e ocorrência.
- Contagem de curtidas numa consulta só.
- Checagem de MX substituível nos testes, com a mesma mensagem.
- Senha em bcrypt e token opaco hasheado.
- Paginator sem os rótulos HTML `&laquo;` e `&raquo;`.

### Acesso ao banco

- Prisma ORM no lugar do pacote `postgres` e do SQL à mão. O PostgreSQL com PostGIS do AD-001 permanece.
- Palavras da escolha: "mude o .specs/features/migrar-backend/ para usar o prisma orm".
- Linha fechada: Prisma ORM 7. Palavras da escolha: "Prisma 7 estável. Ponto via SQL no campo Unsupported".
- A coluna do ponto fica `Unsupported("geometry(Point, 4326)")`. A geometria entra e sai por `$queryRaw` e `$executeRaw`. O restante usa o client.

### Agent's Discretion

Vitest permanece. O cliente SQL e a ausência de ORM deixaram de valer em 2026-11-09.

### Declined / Undiscussed Gray Areas → Assumptions

Nenhuma área foi recusada. O status 200 do cadastro está confirmado na tabela de premissas.

---

## Specific References

- Front: `composables/authService.ts`, `composables/ocurrencesService.ts`, `components/map/LeafletMap.vue`.
- API: `routes/api.php`, FormRequests, `OcurrenceService`, testes Feature em `mapa_cidadao_api`.

---

## Deferred Ideas

- Copiar usuários e ocorrências do Postgres atual.
- Implementar `DELETE /api/ocurrences/:id`.
- Expor `GET /api/ocurrences/listar`.
- Trocar autenticação para Supabase.
