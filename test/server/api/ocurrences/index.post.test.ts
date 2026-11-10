import { afterAll, beforeEach, expect, test } from "vitest";
import { disconnectPrisma, getPrisma } from "../../../../server/db/client";
import { resetTestDatabase } from "../../../../server/db/migrate";
import { createToken, hashToken } from "../../../../server/domain/auth/session";
import { callHandler } from "../../../../server/test/call-handler";
import createHandler from "../../../../server/api/ocurrences/index.post";

const LATITUDE = -23.55052;
const LONGITUDE = -46.633308;
const UNKNOWN_TYPE = "O campo type id selecionado é inválido.";

type CreateBody = {
  ocurrence?: {
    id: number;
    user_id: number;
    location: { type: string; coordinates: [number, number] };
  };
  message?: string;
  errors?: { type_id?: string[] };
};

const prisma = getPrisma();

beforeEach(async () => {
  await resetTestDatabase(prisma);
});

afterAll(async () => {
  await disconnectPrisma();
});

async function countOccurrences(): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count FROM ocurrences
  `;
  return Number(rows[0]?.count ?? 0);
}

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

function postOccurrence(body: unknown, token?: string) {
  return callHandler<CreateBody>(createHandler, {
    method: "POST",
    url: "/api/ocurrences",
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
    body,
  });
}

const saoPaulo = {
  location: { type: "Point", coordinates: [LATITUDE, LONGITUDE] },
};

test("stores latitude first and returns longitude first", async () => {
  const { user, token } = await createUser("ana@example.invalid");
  const type = await prisma.typeOcurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  const before = await countOccurrences();

  const response = await postOccurrence(
    {
      ...saoPaulo,
      type_id: type.id,
      description: "Buraco na rua",
      address_name: "Av. Paulista, 1000",
      city: "São Paulo",
      state: "SP",
      country: "Brasil",
    },
    token,
  );

  expect(response.status).toBe(201);
  expect(response.body.ocurrence?.user_id).toBe(user.id);
  expect(response.body.ocurrence?.location.type).toBe("Point");
  expect(response.body.ocurrence?.location.coordinates).toEqual([LONGITUDE, LATITUDE]);
  expect(await countOccurrences()).toBe(before + 1);

  const stored = await prisma.$queryRaw<
    Array<{ latitude: number; longitude: number; user_id: number }>
  >`
    SELECT ST_Y(location)::float8 AS latitude, ST_X(location)::float8 AS longitude, user_id
    FROM ocurrences
    WHERE id = ${response.body.ocurrence?.id ?? 0}
  `;
  expect(Number(stored[0]?.latitude)).toBe(LATITUDE);
  expect(Number(stored[0]?.longitude)).toBe(LONGITUDE);
  expect(Number(stored[0]?.user_id)).toBe(user.id);
});

test("create rejects a missing token", async () => {
  const type = await prisma.typeOcurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  const before = await countOccurrences();

  const missing = await postOccurrence({ ...saoPaulo, type_id: type.id });
  const unknown = await callHandler<CreateBody>(createHandler, {
    method: "POST",
    url: "/api/ocurrences",
    headers: { authorization: "Bearer not-a-real-token" },
    body: { ...saoPaulo, type_id: type.id },
  });

  expect(missing.status).toBe(401);
  expect(unknown.status).toBe(401);
  expect(await countOccurrences()).toBe(before);
});

test("create rejects an unknown type", async () => {
  const { token } = await createUser("ana@example.invalid");
  const before = await countOccurrences();

  const response = await postOccurrence({ ...saoPaulo, type_id: 999999 }, token);

  expect(response.status).toBe(422);
  expect(response.body.errors?.type_id).toContain(UNKNOWN_TYPE);
  expect(await countOccurrences()).toBe(before);
});

test("create ignores a body user id", async () => {
  const caller = await createUser("caller@example.invalid");
  const other = await createUser("other@example.invalid");
  const type = await prisma.typeOcurrence.findFirstOrThrow({ orderBy: { id: "asc" } });

  const response = await postOccurrence(
    { ...saoPaulo, type_id: type.id, user_id: other.user.id },
    caller.token,
  );

  expect(response.status).toBe(201);
  expect(response.body.ocurrence?.user_id).toBe(caller.user.id);

  const stored = await prisma.$queryRaw<Array<{ user_id: number }>>`
    SELECT user_id FROM ocurrences
  `;
  expect(stored).toHaveLength(1);
  expect(Number(stored[0]?.user_id)).toBe(caller.user.id);
  expect(Number(stored[0]?.user_id)).not.toBe(other.user.id);
});
