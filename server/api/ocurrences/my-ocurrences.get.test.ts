import { afterAll, beforeEach, expect, test } from "vitest";
import { disconnectPrisma, getPrisma } from "../../db/client";
import { resetTestDatabase } from "../../db/migrate";
import { createToken, hashToken } from "../../domain/auth/session";
import { callHandler } from "../../test/call-handler";
import myOccurrencesHandler from "./my-ocurrences.get";

const LATITUDE = -23.55052;
const LONGITUDE = -46.633308;
const PATH = "http://localhost/api/ocurrences/my-ocurrences";

const PAGE_KEYS = [
  "current_page",
  "data",
  "first_page_url",
  "from",
  "last_page",
  "last_page_url",
  "links",
  "next_page_url",
  "path",
  "per_page",
  "prev_page_url",
  "to",
  "total",
];

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

type Link = {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
};

type MineBody = {
  current_page: number;
  data: Listed[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Link[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
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
    INSERT INTO ocurrences (
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
    url: `/api/ocurrences/my-ocurrences${query}`,
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
}

test("pages the caller ten then five", async () => {
  const caller = await createUser("caller@example.invalid");
  const other = await createUser("other@example.invalid");
  const type = await prisma.typeOcurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  const callerIds = await insertOwned(caller.user.id, type.id, 15);
  const otherIds = await insertOwned(other.user.id, type.id, 3);

  const page1 = await getMine(caller.token, 1);
  const page2 = await getMine(caller.token, 2);

  expect(page1.status).toBe(200);
  expect(Object.keys(page1.body).sort()).toEqual(PAGE_KEYS);
  expect(page1.body.current_page).toBe(1);
  expect(page1.body.per_page).toBe(10);
  expect(page1.body.total).toBe(15);
  expect(page1.body.data).toHaveLength(10);
  expect(page1.body.from).toBe(1);
  expect(page1.body.to).toBe(10);
  expect(page1.body.last_page).toBe(2);
  expect(page1.body.path).toBe(PATH);
  expect(page1.body.first_page_url).toBe(`${PATH}?page=1`);
  expect(page1.body.last_page_url).toBe(`${PATH}?page=2`);
  expect(page1.body.next_page_url).toBe(`${PATH}?page=2`);
  expect(page1.body.prev_page_url).toBeNull();
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
  expect(page2.body.current_page).toBe(2);
  expect(page2.body.per_page).toBe(10);
  expect(page2.body.total).toBe(15);
  expect(page2.body.data).toHaveLength(5);
  expect(page2.body.from).toBe(11);
  expect(page2.body.to).toBe(15);
  expect(page2.body.next_page_url).toBeNull();
  expect(page2.body.prev_page_url).toBe(`${PATH}?page=1`);
  expect(page2.body.data.every((row) => row.user_id === caller.user.id)).toBe(true);
  expect(page2.body.data.every((row) => callerIds.includes(row.id))).toBe(true);
  expect(page2.body.data.every((row) => otherIds.includes(row.id))).toBe(false);

  const seen = new Set([...page1.body.data, ...page2.body.data].map((row) => row.id));
  expect(seen.size).toBe(15);
  expect([...seen].every((id) => callerIds.includes(id))).toBe(true);
});

test("links have no html entities", async () => {
  const caller = await createUser("links@example.invalid");
  const type = await prisma.typeOcurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  await insertOwned(caller.user.id, type.id, 15);

  const response = await getMine(caller.token, 1);

  expect(response.status).toBe(200);
  expect(response.body.links.length).toBeGreaterThan(0);
  for (const link of response.body.links) {
    expect(Object.keys(link).sort()).toEqual(["active", "label", "page", "url"]);
    expect(typeof link.label).toBe("string");
    expect(link.label.includes("&laquo;")).toBe(false);
    expect(link.label.includes("&raquo;")).toBe(false);
    expect(link.page === null || typeof link.page === "number").toBe(true);
    expect(link.url === null || typeof link.url === "string").toBe(true);
    expect(typeof link.active).toBe("boolean");
  }
});

test("includes inactive rows", async () => {
  const caller = await createUser("inactive@example.invalid");
  const type = await prisma.typeOcurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
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
    url: "/api/ocurrences/my-ocurrences",
    headers: { authorization: "Bearer not-a-session" },
  });
  expect(rejected.status).toBe(401);
});

test("omitted page is page 1", async () => {
  const caller = await createUser("first@example.invalid");
  const type = await prisma.typeOcurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  await insertOwned(caller.user.id, type.id, 1);

  const response = await getMine(caller.token);

  expect(response.status).toBe(200);
  expect(response.body.current_page).toBe(1);
  expect(response.body.per_page).toBe(10);
  expect(response.body.data).toHaveLength(1);
  expect(response.body.data[0]?.user_id).toBe(caller.user.id);
});
