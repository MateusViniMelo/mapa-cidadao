import { afterAll, beforeEach, expect, test } from "vitest";
import { disconnectPrisma, getPrisma } from "../../../../../server/db/client";
import { resetTestDatabase } from "../../../../../server/db/migrate";
import { createToken, hashToken } from "../../../../../server/domain/auth/session";
import { callHandler } from "../../../../../server/test/call-handler";
import inactivateHandler from "../../../../../server/api/occurrences/inactivate/[id].post";

const SUCCESS = "Ocorrência inativada com sucesso.";
const FORBIDDEN = "Você não tem permissão para inativar esta ocorrência.";

type MessageBody = { message?: string };

type StoredRow = {
  is_active: boolean;
  type_closure: string | null;
  solution_description: string | null;
  resolution_date: string | null;
};

const prisma = getPrisma();

beforeEach(async () => {
  await resetTestDatabase(prisma);
});

afterAll(async () => {
  await disconnectPrisma();
});

async function createUser(email: string) {
  const user = await prisma.user.create({
    data: {
      name: "Ana Silva",
      email,
      password: "not-used",
      date_birth: new Date("1990-01-15T00:00:00.000Z"),
    },
  });
  const token = createToken();
  await prisma.accessToken.create({
    data: { user_id: user.id, token_hash: hashToken(token) },
  });
  return { user, token };
}

async function insertOccurrence(userId: number, typeId: number) {
  const rows = await prisma.$queryRaw<Array<{ id: number }>>`
    INSERT INTO occurrences (
      location, type_id, user_id, description, address_name, city, state, country, is_active
    ) VALUES (
      ST_SetSRID(ST_MakePoint(${-46.633308}::float8, ${-23.55052}::float8), 4326),
      ${typeId}::int,
      ${userId}::int,
      ${"Buraco na rua"}::text,
      ${"Av. Paulista, 1000"}::text,
      ${"São Paulo"}::text,
      ${"SP"}::text,
      ${"Brasil"}::text,
      true
    )
    RETURNING id
  `;
  return Number(rows[0]?.id);
}

async function readRow(id: number): Promise<StoredRow | null> {
  const rows = await prisma.$queryRaw<StoredRow[]>`
    SELECT
      is_active,
      type_closure::text AS type_closure,
      solution_description,
      to_char(resolution_date, 'YYYY-MM-DD') AS resolution_date
    FROM occurrences
    WHERE id = ${id}
  `;
  return rows[0] ?? null;
}

function postInactivate(id: number | string, body: unknown, token?: string) {
  return callHandler<MessageBody>(inactivateHandler, {
    method: "POST",
    url: `/api/occurrences/inactivate/${id}`,
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
    body,
  });
}

test("owner closes with resolved", async () => {
  const { user, token } = await createUser("owner@example.invalid");
  const type = await prisma.typeOccurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  const resolvedId = await insertOccurrence(user.id, type.id);
  const otherId = await insertOccurrence(user.id, type.id);

  const resolved = await postInactivate(
    resolvedId,
    {
      type_closure: "resolved",
      solution_description: "Equipe consertou o buraco.",
      resolution_date: "2020-05-01",
    },
    token,
  );
  expect(resolved.status).toBe(200);
  expect(resolved.body).toEqual({ message: SUCCESS });
  expect(await readRow(resolvedId)).toEqual({
    is_active: false,
    type_closure: "resolved",
    solution_description: "Equipe consertou o buraco.",
    resolution_date: "2020-05-01",
  });

  const other = await postInactivate(
    otherId,
    { type_closure: "other", solution_description: "Outro motivo." },
    token,
  );
  expect(other.status).toBe(200);
  expect(other.body).toEqual({ message: SUCCESS });
  expect(await readRow(otherId)).toEqual({
    is_active: false,
    type_closure: "other",
    solution_description: "Outro motivo.",
    resolution_date: null,
  });
});

test("owner mistake deletes the row", async () => {
  const { user, token } = await createUser("owner@example.invalid");
  const type = await prisma.typeOccurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  const id = await insertOccurrence(user.id, type.id);

  const response = await postInactivate(id, { type_closure: "mistake" }, token);

  expect(response.status).toBe(200);
  expect(response.body).toEqual({ message: SUCCESS });
  expect(await readRow(id)).toBeNull();
});

test("other user receives 403", async () => {
  const owner = await createUser("owner@example.invalid");
  const other = await createUser("other@example.invalid");
  const type = await prisma.typeOccurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  const id = await insertOccurrence(owner.user.id, type.id);
  const before = await readRow(id);

  const response = await postInactivate(
    id,
    { type_closure: "resolved", solution_description: "Não sou o dono." },
    other.token,
  );

  expect(response.status).toBe(403);
  expect(response.body).toEqual({ message: FORBIDDEN });
  expect(await readRow(id)).toEqual(before);
});

test("inactivate rejects a missing token", async () => {
  const { user } = await createUser("owner@example.invalid");
  const type = await prisma.typeOccurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  const id = await insertOccurrence(user.id, type.id);
  const before = await readRow(id);
  const body = { type_closure: "mistake" };

  const missing = await postInactivate(id, body);
  const unknown = await callHandler<MessageBody>(inactivateHandler, {
    method: "POST",
    url: `/api/occurrences/inactivate/${id}`,
    headers: { authorization: "Bearer not-a-real-token" },
    body,
  });

  expect(missing.status).toBe(401);
  expect(unknown.status).toBe(401);
  expect(await readRow(id)).toEqual(before);
});

test("inactivate missing id returns 404", async () => {
  const { user, token } = await createUser("owner@example.invalid");
  const type = await prisma.typeOccurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  const id = await insertOccurrence(user.id, type.id);
  const before = await readRow(id);

  const response = await postInactivate(
    999999,
    { type_closure: "resolved", solution_description: "Não existe." },
    token,
  );

  expect(response.status).toBe(404);
  expect(await readRow(id)).toEqual(before);
});
