import { afterAll, beforeEach, expect, test } from "vitest";
import { disconnectPrisma, getPrisma } from "../db/client";
import { resetTestDatabase } from "../db/migrate";
import { callHandler } from "../test/call-handler";
import typesHandler from "./types-ocurrence.get";

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
  const response = await callHandler<{ types_ocurrence: TypeJson[] }>(typesHandler, {
    method: "GET",
    url: "/api/types-ocurrence",
  });

  expect(response.status).toBe(200);
  expect(response.body.types_ocurrence.map((type) => type.name)).toEqual(TYPE_NAMES);

  for (const type of response.body.types_ocurrence) {
    expect(type.id).toEqual(expect.any(Number));
    expect(type.name).toEqual(expect.any(String));
    expect(type.created_at).toMatch(ISO_8601);
    expect(type.updated_at).toMatch(ISO_8601);
    expect(Object.keys(type).sort()).toEqual(["created_at", "id", "name", "updated_at"]);
  }

  const stored = await prisma.typeOcurrence.findMany({ orderBy: { id: "asc" } });
  expect(response.body.types_ocurrence.map((type) => type.id)).toEqual(stored.map((type) => type.id));
});
