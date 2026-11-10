import { afterAll, beforeEach, expect, test } from "vitest";
import { disconnectPrisma, getPrisma } from "../../../server/db/client";
import { resetTestDatabase } from "../../../server/db/migrate";
import { callHandler } from "../../../server/test/call-handler";
import typesHandler from "../../../server/api/types-occurrence.get";

const TYPE_NAMES = [
  "Problema de Iluminação",
  "Problema de Pavimentação",
  "Alagamento",
  "Acúmulo de Lixo",
  "Falta de Pavimentação",
];

const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

type TypeJson = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

const prisma = getPrisma();

beforeEach(async () => {
  await resetTestDatabase(prisma);
});

afterAll(async () => {
  await disconnectPrisma();
});

test("lists the five seeded types", async () => {
  const response = await callHandler<{ types_occurrence: TypeJson[] }>(typesHandler, {
    method: "GET",
    url: "/api/types-occurrence",
  });

  expect(response.status).toBe(200);
  expect(response.body.types_occurrence.map((type) => type.name)).toEqual(TYPE_NAMES);

  for (const type of response.body.types_occurrence) {
    expect(type.id).toEqual(expect.any(Number));
    expect(type.name).toEqual(expect.any(String));
    expect(type.created_at).toMatch(ISO_8601);
    expect(type.updated_at).toMatch(ISO_8601);
    expect(Object.keys(type).sort()).toEqual(["created_at", "id", "name", "updated_at"]);
  }

  const stored = await prisma.typeOccurrence.findMany({ orderBy: { id: "asc" } });
  expect(response.body.types_occurrence.map((type) => type.id)).toEqual(stored.map((type) => type.id));
});
