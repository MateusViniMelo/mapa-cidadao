import { afterAll, beforeEach, expect, test } from "vitest";
import { disconnectPrisma, getPrisma } from "../../../../../server/db/client";
import { resetTestDatabase } from "../../../../../server/db/migrate";
import { createToken, hashToken } from "../../../../../server/domain/auth/session";
import { callHandler } from "../../../../../server/test/call-handler";
import likeHandler from "../../../../../server/api/ocurrences/like/[id].get";

const LIKED = "Ocorrência curtida com sucesso.";
const REMOVED = "Curtida removida com sucesso.";
const LATITUDE = -23.55052;
const LONGITUDE = -46.633308;

type LikeBody = {
  message?: string;
  ocurrence?: {
    liked_by_auth_user: boolean;
    likes_count: number;
  };
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
    INSERT INTO ocurrences (
      location, type_id, user_id, description, address_name, city, state, country, is_active
    ) VALUES (
      ST_SetSRID(ST_MakePoint(${LONGITUDE}::float8, ${LATITUDE}::float8), 4326),
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

function getLike(id: number, token?: string) {
  return callHandler<LikeBody>(likeHandler, {
    method: "GET",
    url: `/api/ocurrences/like/${id}`,
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
}

test("first like returns 201", async () => {
  const caller = await createUser("caller@example.invalid");
  const other = await createUser("other@example.invalid");
  const type = await prisma.typeOcurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  const id = await insertOccurrence(caller.user.id, type.id);
  await prisma.likeOcurrence.create({
    data: { user_id: other.user.id, ocurrence_id: id },
  });
  const before = await prisma.likeOcurrence.count({ where: { ocurrence_id: id } });

  const response = await getLike(id, caller.token);

  expect(response.status).toBe(201);
  expect(response.body.message).toBe(LIKED);
  expect(response.body.ocurrence?.liked_by_auth_user).toBe(true);
  expect(response.body.ocurrence?.likes_count).toBe(before + 1);
  expect(await prisma.likeOcurrence.count({ where: { ocurrence_id: id } })).toBe(before + 1);
});

test("second like returns 200 and removes the row", async () => {
  const caller = await createUser("caller@example.invalid");
  const type = await prisma.typeOcurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  const id = await insertOccurrence(caller.user.id, type.id);

  const first = await getLike(id, caller.token);
  expect(first.status).toBe(201);

  const second = await getLike(id, caller.token);

  expect(second.status).toBe(200);
  expect(second.body.message).toBe(REMOVED);
  expect(second.body.ocurrence?.liked_by_auth_user).toBe(false);
  expect(
    await prisma.likeOcurrence.count({
      where: { user_id: caller.user.id, ocurrence_id: id },
    }),
  ).toBe(0);
});

test("like rejects a missing token", async () => {
  const owner = await createUser("owner@example.invalid");
  const type = await prisma.typeOcurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  const id = await insertOccurrence(owner.user.id, type.id);

  const response = await getLike(id);

  expect(response.status).toBe(401);
  expect(await prisma.likeOcurrence.count({ where: { ocurrence_id: id } })).toBe(0);
});

test("like missing id returns 404", async () => {
  const caller = await createUser("caller@example.invalid");

  const response = await getLike(999999, caller.token);

  expect(response.status).toBe(404);
  expect(await prisma.likeOcurrence.count()).toBe(0);
});
