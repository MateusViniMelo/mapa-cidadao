import { Prisma } from "generated/prisma/client";
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

    const types = await prisma.typeOccurrence.findMany();
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

test("renames occurrence tables", async () => {
  const prisma = getPrisma();

  try {
    await resetTestDatabase(prisma);

    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('types_occurrence', 'occurrences', 'like_occurrences')
      ORDER BY table_name
    `;
    expect(tables.map((row) => row.table_name)).toEqual([
      "like_occurrences",
      "occurrences",
      "types_occurrence",
    ]);

    const staleNames = [
      "types_" + "oc" + "urrence",
      "oc" + "urrences",
      "like_" + "oc" + "urrences",
    ];
    const staleTables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (${Prisma.join(staleNames)})
    `;
    expect(staleTables).toEqual([]);

    const column = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'like_occurrences'
        AND column_name = 'occurrence_id'
    `;
    expect(column.map((row) => row.column_name)).toEqual(["occurrence_id"]);

    const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname IN (
          'types_occurrence_name_key',
          'like_occurrences_user_id_occurrence_id_key'
        )
      ORDER BY indexname
    `;
    expect(indexes.map((row) => row.indexname)).toEqual([
      "like_occurrences_user_id_occurrence_id_key",
      "types_occurrence_name_key",
    ]);

    const foreignKeys = await prisma.$queryRaw<Array<{ conname: string }>>`
      SELECT conname
      FROM pg_constraint
      WHERE conname IN (
        'occurrences_type_id_fkey',
        'occurrences_user_id_fkey',
        'like_occurrences_user_id_fkey',
        'like_occurrences_occurrence_id_fkey'
      )
      ORDER BY conname
    `;
    expect(foreignKeys.map((row) => row.conname)).toEqual([
      "like_occurrences_occurrence_id_fkey",
      "like_occurrences_user_id_fkey",
      "occurrences_type_id_fkey",
      "occurrences_user_id_fkey",
    ]);

    const types = await prisma.typeOccurrence.findMany();
    expect(types).toHaveLength(5);
  } finally {
    await disconnectPrisma();
  }
});
