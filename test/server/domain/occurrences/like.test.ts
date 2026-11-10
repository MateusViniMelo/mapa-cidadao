import { afterAll, beforeEach, expect, test } from "vitest";
import { disconnectPrisma, getPrisma } from "../../../../server/db/client";
import { resetTestDatabase } from "../../../../server/db/migrate";
import { toggleLike } from "../../../../server/domain/occurrences/like";

const LATITUDE = -23.55052;
const LONGITUDE = -46.633308;

const prisma = getPrisma();

beforeEach(async () => {
  await resetTestDatabase(prisma);
});

afterAll(async () => {
  await disconnectPrisma();
});

async function seedPair() {
  const user = await prisma.user.create({
    data: {
      name: "Ana Silva",
      email: "like@example.invalid",
      password: "not-used",
      date_birth: new Date("1990-01-15T00:00:00.000Z"),
    },
  });
  const type = await prisma.typeOccurrence.findFirstOrThrow({ orderBy: { id: "asc" } });
  const rows = await prisma.$queryRaw<Array<{ id: number }>>`
    INSERT INTO occurrences (
      location, type_id, user_id, description, address_name, city, state, country, is_active
    ) VALUES (
      ST_SetSRID(ST_MakePoint(${LONGITUDE}::float8, ${LATITUDE}::float8), 4326),
      ${type.id}::int,
      ${user.id}::int,
      ${"Buraco na rua"}::text,
      ${"Av. Paulista, 1000"}::text,
      ${"São Paulo"}::text,
      ${"SP"}::text,
      ${"Brasil"}::text,
      true
    )
    RETURNING id
  `;
  return { userId: user.id, occurrenceId: Number(rows[0]?.id) };
}

function countPair(userId: number, occurrenceId: number) {
  return prisma.likeOccurrence.count({
    where: { user_id: userId, occurrence_id: occurrenceId },
  });
}

test("keeps one row per user and occurrence", async () => {
  const { userId, occurrenceId } = await seedPair();

  await toggleLike(prisma, userId, occurrenceId);
  await expect(
    prisma.likeOccurrence.create({
      data: { user_id: userId, occurrence_id: occurrenceId },
    }),
  ).rejects.toMatchObject({ code: "P2002" });

  expect(await countPair(userId, occurrenceId)).toBe(1);
});

test("creates the like and removes it on the second call", async () => {
  const { userId, occurrenceId } = await seedPair();

  await toggleLike(prisma, userId, occurrenceId);
  expect(await countPair(userId, occurrenceId)).toBe(1);

  await toggleLike(prisma, userId, occurrenceId);
  expect(await countPair(userId, occurrenceId)).toBe(0);
});
