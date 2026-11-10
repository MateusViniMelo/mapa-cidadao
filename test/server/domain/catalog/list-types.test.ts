import { afterAll, beforeEach, expect, test } from "vitest";
import { disconnectPrisma, getPrisma } from "../../../../server/db/client";
import { resetTestDatabase } from "../../../../server/db/migrate";
import { listTypes } from "../../../../server/domain/catalog/list-types";

const TYPE_NAMES = [
  "Problema de Iluminação",
  "Problema de Pavimentação",
  "Alagamento",
  "Acúmulo de Lixo",
  "Falta de Pavimentação",
];

const prisma = getPrisma();

beforeEach(async () => {
  await resetTestDatabase(prisma);
});

afterAll(async () => {
  await disconnectPrisma();
});

test("reads the five seeded names from the database", async () => {
  const seeded = await listTypes(prisma);
  expect(seeded.map((type) => type.name)).toEqual(TYPE_NAMES);

  const extra = await prisma.typeOccurrence.create({
    data: { name: "Tipo extra de prova" },
  });
  const again = await listTypes(prisma);
  const found = again.find((type) => type.id === extra.id);

  expect(found?.name).toBe(extra.name);
  expect(again).toHaveLength(TYPE_NAMES.length + 1);
});
