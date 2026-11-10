import { afterAll, beforeEach, expect, test } from "vitest";
import { disconnectPrisma, getPrisma } from "../../../../server/db/client";
import { resetTestDatabase } from "../../../../server/db/migrate";
import { createToken, hashToken } from "../../../../server/domain/auth/session";
import { callHandler } from "../../../../server/test/call-handler";
import listHandler from "../../../../server/api/occurrences/index.get";

const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const LATITUDE = -23.55052;
const LONGITUDE = -46.633308;

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
  type_id: number;
  user_id: number;
  description: string;
  address_name: string;
  city: string | null;
  state: string | null;
  country: string | null;
  is_active: boolean;
  solution_description: string | null;
  resolution_date: string | null;
  type_closure: string | null;
  created_at: string;
  updated_at: string;
  location: { type: string; coordinates: [number, number] };
  type: { id: number; name: string; created_at: string; updated_at: string };
  likes_count: number;
  liked_by_auth_user: boolean;
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
}) {
  const rows = await prisma.$queryRaw<Array<{ id: number }>>`
    INSERT INTO occurrences (
      location, type_id, user_id, description, address_name, city, state, country, is_active
    ) VALUES (
      ST_SetSRID(ST_MakePoint(${LONGITUDE}, ${LATITUDE}), 4326),
      ${input.typeId},
      ${input.userId},
      ${input.description},
      ${"Av. Paulista, 1000"},
      ${"São Paulo"},
      ${"SP"},
      ${"Brasil"},
      ${input.isActive ?? true}
    )
    RETURNING id
  `;
  return Number(rows[0]?.id);
}

function getOccurrences(headers?: Record<string, string>) {
  return callHandler<{ occurrences: Listed[] }>(listHandler, {
    method: "GET",
    url: "/api/occurrences",
    headers,
  });
}

test("lists under the occurrences key", async () => {
  const { user } = await createUser("key@example.invalid");
  const type = await prisma.typeOccurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  const activeId = await insertOccurrence({
    userId: user.id,
    typeId: type.id,
    description: "Chave da lista",
  });

  const response = await getOccurrences();

  expect(response.status).toBe(200);
  expect(Object.keys(response.body)).toEqual(["occurrences"]);
  expect(response.body.occurrences.map((row) => row.id)).toEqual([activeId]);
});

test("lists only active occurrences", async () => {
  const { user } = await createUser("ana@example.invalid");
  const liker = await createUser("liker@example.invalid");
  const type = await prisma.typeOccurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  const activeId = await insertOccurrence({
    userId: user.id,
    typeId: type.id,
    description: "Buraco na rua",
  });
  const inactiveId = await insertOccurrence({
    userId: user.id,
    typeId: type.id,
    description: "Já encerrada",
    isActive: false,
  });
  await prisma.likeOccurrence.create({
    data: { user_id: liker.user.id, occurrence_id: activeId },
  });

  const response = await getOccurrences();
  expect(response.status).toBe(200);
  expect(response.body.occurrences.map((row) => row.id)).toEqual([activeId]);
  expect(response.body.occurrences.map((row) => row.id)).not.toContain(inactiveId);

  const row = response.body.occurrences[0];
  expect(Object.keys(row).sort()).toEqual(OCCURRENCE_KEYS);
  expect(row).toMatchObject({
    id: activeId,
    type_id: type.id,
    user_id: user.id,
    description: "Buraco na rua",
    address_name: "Av. Paulista, 1000",
    city: "São Paulo",
    state: "SP",
    country: "Brasil",
    is_active: true,
    solution_description: null,
    resolution_date: null,
    type_closure: null,
    likes_count: 1,
    liked_by_auth_user: false,
  });
  expect(row.created_at).toMatch(ISO_8601);
  expect(row.updated_at).toMatch(ISO_8601);
  expect(row.location.type).toBe("Point");
  expect(row.location.coordinates).toEqual([LONGITUDE, LATITUDE]);
  expect(row.type).toMatchObject({ id: type.id, name: type.name });
  expect(row.type.created_at).toMatch(ISO_8601);
  expect(row.type.updated_at).toMatch(ISO_8601);
});

test("anonymous flag is false", async () => {
  const owner = await createUser("owner@example.invalid");
  const liker = await createUser("other@example.invalid");
  const type = await prisma.typeOccurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  const activeId = await insertOccurrence({
    userId: owner.user.id,
    typeId: type.id,
    description: "Sem sessão",
  });
  await prisma.likeOccurrence.create({
    data: { user_id: liker.user.id, occurrence_id: activeId },
  });

  const response = await getOccurrences();

  expect(response.status).toBe(200);
  expect(response.body.occurrences).toHaveLength(1);
  expect(response.body.occurrences[0]?.liked_by_auth_user).toBe(false);
  expect(response.body.occurrences[0]?.likes_count).toBe(1);
});

test("authenticated flag reports the caller like", async () => {
  const caller = await createUser("caller@example.invalid");
  const other = await createUser("second@example.invalid");
  const type = await prisma.typeOccurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  const activeId = await insertOccurrence({
    userId: caller.user.id,
    typeId: type.id,
    description: "Curtida do chamador",
  });
  await prisma.likeOccurrence.create({
    data: { user_id: caller.user.id, occurrence_id: activeId },
  });
  await prisma.likeOccurrence.create({
    data: { user_id: other.user.id, occurrence_id: activeId },
  });

  const response = await getOccurrences({
    authorization: `Bearer ${caller.token}`,
  });

  expect(response.status).toBe(200);
  expect(response.body.occurrences).toHaveLength(1);
  expect(response.body.occurrences[0]?.liked_by_auth_user).toBe(true);
  expect(response.body.occurrences[0]?.likes_count).toBe(2);
});

test("empty authorization still lists", async () => {
  const { user } = await createUser("public@example.invalid");
  const type = await prisma.typeOccurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  const activeId = await insertOccurrence({
    userId: user.id,
    typeId: type.id,
    description: "Header vazio",
  });

  const empty = await getOccurrences({ authorization: "" });
  const missing = await getOccurrences();

  expect(empty.status).toBe(200);
  expect(empty.body.occurrences.map((row) => row.id)).toEqual([activeId]);
  expect(missing.status).toBe(200);
  expect(missing.body.occurrences.map((row) => row.id)).toEqual([activeId]);
});
