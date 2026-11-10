import { afterAll, beforeEach, expect, test } from "vitest";
import { disconnectPrisma, getPrisma } from "../../../../server/db/client";
import { resetTestDatabase } from "../../../../server/db/migrate";
import { createToken, hashToken } from "../../../../server/domain/auth/session";
import { callHandler } from "../../../../server/test/call-handler";
import myOccurrencesHandler from "../../../../server/api/occurrences/my-occurrences.get";

const LATITUDE = -23.55052;
const LONGITUDE = -46.633308;
const PAGE_KEYS = ["data", "page", "per_page", "total"];

const OCCURRENCE_KEYS = [
  "address_name",
  "city",
  "country",
  "created_at",
  "description",
  "id",
  "is_active",
  "liked_by_auth_user",
  "likes_count",
  "location",
  "resolution_date",
  "solution_description",
  "state",
  "type",
  "type_closure",
  "type_id",
  "updated_at",
  "user_id",
];

type Listed = {
  id: number;
  user_id: number;
  is_active: boolean;
  location: { type: string; coordinates: [number, number] };
};

type MineBody = {
  data: Listed[];
  page: number;
  per_page: number;
  total: number;
  message?: string;
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

async function insertOccurrence(input: {
  userId: number;
  typeId: number;
  description: string;
  isActive?: boolean;
  createdAt: string;
}) {
  const rows = await prisma.$queryRaw<Array<{ id: number }>>`
    INSERT INTO occurrences (
      location, type_id, user_id, description, address_name, city, state, country,
      is_active, created_at, updated_at
    ) VALUES (
      ST_SetSRID(ST_MakePoint(${LONGITUDE}::float8, ${LATITUDE}::float8), 4326),
      ${input.typeId}::int,
      ${input.userId}::int,
      ${input.description}::text,
      ${"Av. Paulista, 1000"}::text,
      ${"São Paulo"}::text,
      ${"SP"}::text,
      ${"Brasil"}::text,
      ${input.isActive ?? true},
      ${input.createdAt}::timestamptz,
      ${input.createdAt}::timestamptz
    )
    RETURNING id
  `;
  return Number(rows[0]?.id);
}

async function insertOwned(
  userId: number,
  typeId: number,
  count: number,
  isActive = true,
) {
  const ids: number[] = [];
  for (let index = 0; index < count; index += 1) {
    ids.push(
      await insertOccurrence({
        userId,
        typeId,
        description: `Ocorrência ${userId}-${index}`,
        isActive,
        createdAt: new Date(Date.UTC(2026, 0, 1, 0, index, userId)).toISOString(),
      }),
    );
  }
  return ids;
}

function getMine(token?: string, page?: number) {
  const query = page === undefined ? "" : `?page=${page}`;
  return callHandler<MineBody>(myOccurrencesHandler, {
    method: "GET",
    url: `/api/occurrences/my-occurrences${query}`,
    headers: token ? { cookie: `auth_token=${token}` } : undefined,
  });
}

test("pages the caller ten then five", async () => {
  const caller = await createUser("caller@example.invalid");
  const other = await createUser("other@example.invalid");
  const type = await prisma.typeOccurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  const callerIds = await insertOwned(caller.user.id, type.id, 15);
  const otherIds = await insertOwned(other.user.id, type.id, 3);

  const page1 = await getMine(caller.token, 1);
  const page2 = await getMine(caller.token, 2);

  expect(page1.status).toBe(200);
  expect(Object.keys(page1.body).sort()).toEqual(PAGE_KEYS);
  expect(page1.body.page).toBe(1);
  expect(page1.body.per_page).toBe(10);
  expect(page1.body.total).toBe(15);
  expect(page1.body.data).toHaveLength(10);
  expect(page1.body.data.every((row) => row.user_id === caller.user.id)).toBe(true);
  expect(page1.body.data.every((row) => otherIds.includes(row.id))).toBe(false);
  expect(page1.body.data.every((row) => callerIds.includes(row.id))).toBe(true);
  for (const row of page1.body.data) {
    expect(Object.keys(row).sort()).toEqual(OCCURRENCE_KEYS);
    expect(row.location).toEqual({
      type: "Point",
      coordinates: [LONGITUDE, LATITUDE],
    });
  }

  expect(page2.status).toBe(200);
  expect(page2.body.page).toBe(2);
  expect(page2.body.per_page).toBe(10);
  expect(page2.body.total).toBe(15);
  expect(page2.body.data).toHaveLength(5);
  expect(page2.body.data.every((row) => row.user_id === caller.user.id)).toBe(true);
  expect(page2.body.data.every((row) => callerIds.includes(row.id))).toBe(true);
  expect(page2.body.data.every((row) => otherIds.includes(row.id))).toBe(false);

  const seen = new Set([...page1.body.data, ...page2.body.data].map((row) => row.id));
  expect(seen.size).toBe(15);
  expect([...seen].every((id) => callerIds.includes(id))).toBe(true);
});

test("mine body omits laravel links", async () => {
  const caller = await createUser("links@example.invalid");
  const type = await prisma.typeOccurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  await insertOwned(caller.user.id, type.id, 15);

  const response = await getMine(caller.token, 1);
  const absent = [
    "links",
    "from",
    "to",
    "path",
    "current_page",
    "first_page_url",
    "last_page_url",
    "next_page_url",
    "prev_page_url",
  ];

  expect(response.status).toBe(200);
  expect(Object.keys(response.body).sort()).toEqual(PAGE_KEYS);
  for (const key of absent) {
    expect(response.body).not.toHaveProperty(key);
  }
});

test("includes inactive rows", async () => {
  const caller = await createUser("inactive@example.invalid");
  const type = await prisma.typeOccurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  const inactiveId = await insertOccurrence({
    userId: caller.user.id,
    typeId: type.id,
    description: "Já encerrada",
    isActive: false,
    createdAt: "2026-04-01T00:00:00.000Z",
  });

  const response = await getMine(caller.token, 1);

  expect(response.status).toBe(200);
  const row = response.body.data.find((item) => item.id === inactiveId);
  expect(row?.user_id).toBe(caller.user.id);
  expect(row?.is_active).toBe(false);
  expect(row?.location).toEqual({
    type: "Point",
    coordinates: [LONGITUDE, LATITUDE],
  });
});

test("my occurrences rejects a missing token", async () => {
  const missing = await getMine();
  expect(missing.status).toBe(401);

  const rejected = await callHandler<MineBody>(myOccurrencesHandler, {
    method: "GET",
    url: "/api/occurrences/my-occurrences",
    headers: { cookie: "auth_token=not-a-session" },
  });
  expect(rejected.status).toBe(401);
});

test("omitted page is page 1", async () => {
  const caller = await createUser("first@example.invalid");
  const type = await prisma.typeOccurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  await insertOwned(caller.user.id, type.id, 1);

  const response = await getMine(caller.token);

  expect(response.status).toBe(200);
  expect(response.body.page).toBe(1);
  expect(response.body.per_page).toBe(10);
  expect(response.body.data).toHaveLength(1);
  expect(response.body.data[0]?.user_id).toBe(caller.user.id);
});

test("page zero is page 1", async () => {
  const caller = await createUser("zero@example.invalid");
  const type = await prisma.typeOccurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  await insertOwned(caller.user.id, type.id, 1);

  const response = await getMine(caller.token, 0);

  expect(response.status).toBe(200);
  expect(response.body.page).toBe(1);
  expect(response.body.data).toHaveLength(1);
});

test("page past the end is empty", async () => {
  const caller = await createUser("past@example.invalid");
  const type = await prisma.typeOccurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  await insertOwned(caller.user.id, type.id, 1);

  const response = await getMine(caller.token, 99);

  expect(response.status).toBe(200);
  expect(response.body.data).toEqual([]);
  expect(response.body.total).toBe(1);
  expect(response.body.page).toBe(99);
});

test("page abc is page 1", async () => {
  const caller = await createUser("abc@example.invalid");
  const type = await prisma.typeOccurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  await insertOwned(caller.user.id, type.id, 1);

  const response = await callHandler<MineBody>(myOccurrencesHandler, {
    method: "GET",
    url: "/api/occurrences/my-occurrences?page=abc",
    headers: { cookie: `auth_token=${caller.token}` },
  });

  expect(response.status).toBe(200);
  expect(response.body.page).toBe(1);
  expect(response.body.data).toHaveLength(1);
});
