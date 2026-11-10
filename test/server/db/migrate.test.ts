import { expect, test } from "vitest";
import { disconnectPrisma, getPrisma } from "../../../server/db/client";
import { resetTestDatabase } from "../../../server/db/migrate";

const TYPE_NAMES = [
  "Problema de Iluminação",
  "Problema de Pavimentação",
  "Alagamento",
  "Acúmulo de Lixo",
  "Falta de Pavimentação",
];

test("seeds the five types and PostGIS answers ST_MakePoint", async () => {
  const prisma = getPrisma();

  try {
    await resetTestDatabase(prisma);

    const current = await prisma.$queryRaw<Array<{ current_database: string }>>`
      SELECT current_database()
    `;
    expect(current[0]?.current_database).toBe("mapa_cidadao_test");

    const types = await prisma.typeOcurrence.findMany();
    expect(types).toHaveLength(5);
    expect(types.map((type) => type.name).sort()).toEqual([...TYPE_NAMES].sort());

    const point = await prisma.$queryRaw<Array<{ ok: boolean }>>`
      SELECT ST_MakePoint(-46.633308, -23.55052) IS NOT NULL AS ok
    `;
    expect(point[0]?.ok).toBe(true);
  } finally {
    await disconnectPrisma();
  }
});
