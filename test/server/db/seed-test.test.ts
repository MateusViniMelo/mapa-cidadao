import bcrypt from "bcryptjs";
import { afterAll, beforeEach, expect, test } from "vitest";
import { disconnectPrisma, getPrisma } from "../../../server/db/client";
import { resetTestDatabase } from "../../../server/db/migrate";
import { readSession } from "../../../server/domain/auth/session";
import { assertLocalTestUrl } from "../../../prisma/seed-test";
import {
  assertTestDatabaseName,
  seedTestFixtures,
  TEST_OCCURRENCES,
  TEST_USERS,
} from "../../../prisma/test-fixtures";

const prisma = getPrisma();

beforeEach(async () => {
  await resetTestDatabase(prisma);
});

afterAll(async () => {
  await disconnectPrisma();
});

test("refuses a database that is not the test database", () => {
  expect(() => assertTestDatabaseName("mapa_cidadao")).toThrow(/recusa o banco mapa_cidadao$/);
  expect(() => assertTestDatabaseName("postgres")).toThrow(/recusa o banco postgres/);
  expect(() => assertTestDatabaseName("")).toThrow(/recusa o banco \(indefinido\)/);
  expect(() =>
    assertLocalTestUrl("postgresql://mapa_cidadao:mapa_cidadao@localhost:5432/mapa_cidadao"),
  ).toThrow(/recusa o banco mapa_cidadao$/);
  expect(() =>
    assertLocalTestUrl(
      "postgresql://mapa_cidadao:mapa_cidadao@db.example.com:5432/mapa_cidadao_test",
    ),
  ).toThrow(/db\.example\.com/);
});

test("seeds logged-in users and occurrences in Belém and Ananindeua", async () => {
  const seeded = await seedTestFixtures(prisma);
  const emails = TEST_USERS.map((user) => user.email);

  expect(seeded.users.map((user) => user.email)).toEqual(emails);
  expect(seeded.occurrences).toHaveLength(TEST_OCCURRENCES.length);

  for (const user of seeded.users) {
    const row = await prisma.user.findUniqueOrThrow({ where: { email: user.email } });
    expect(await bcrypt.compare(seeded.password, row.password)).toBe(true);
    expect(row.password).not.toBe(seeded.password);

    const session = await readSession(prisma, user.token);
    expect(session?.user).toMatchObject({ id: user.id, email: user.email });
  }

  const points = await prisma.$queryRaw<
    Array<{ city: string; state: string; country: string; latitude: number; longitude: number }>
  >`
    SELECT city, state, country,
      ST_Y(location)::float8 AS latitude,
      ST_X(location)::float8 AS longitude
    FROM occurrences
    WHERE user_id IN (${seeded.users[0]?.id}, ${seeded.users[1]?.id})
  `;

  expect(points.filter((point) => point.city === "Belém")).toHaveLength(3);
  expect(points.filter((point) => point.city === "Ananindeua")).toHaveLength(3);
  for (const point of points) {
    expect(point.state).toBe("PA");
    expect(point.country).toBe("Brasil");
    expect(point.latitude).toBeGreaterThan(-1.55);
    expect(point.latitude).toBeLessThan(-1.3);
    expect(point.longitude).toBeGreaterThan(-48.55);
    expect(point.longitude).toBeLessThan(-48.35);
  }
  for (const point of points.filter((row) => row.city === "Belém")) {
    expect(point.longitude).toBeLessThan(-48.45);
  }
  for (const point of points.filter((row) => row.city === "Ananindeua")) {
    expect(point.longitude).toBeGreaterThan(-48.42);
  }

  expect(await prisma.likeOccurrence.count()).toBe(2);
  expect(await prisma.accessToken.count()).toBe(TEST_USERS.length);
});

test("seeding again keeps one session per user", async () => {
  await seedTestFixtures(prisma);
  const seeded = await seedTestFixtures(prisma);
  const userIds = seeded.users.map((user) => user.id);

  expect(await prisma.user.count({ where: { id: { in: userIds } } })).toBe(TEST_USERS.length);
  expect(await prisma.accessToken.count({ where: { user_id: { in: userIds } } })).toBe(
    TEST_USERS.length,
  );
  expect(await prisma.occurrence.count({ where: { user_id: { in: userIds } } })).toBe(
    TEST_OCCURRENCES.length,
  );

  for (const user of seeded.users) {
    expect(await readSession(prisma, user.token)).toMatchObject({
      user: { id: user.id },
    });
  }
});
