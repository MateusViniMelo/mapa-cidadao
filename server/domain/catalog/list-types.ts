import type { PrismaClient } from "generated/prisma/client";

export type TypeOcurrenceJson = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export async function listTypes(db: PrismaClient): Promise<TypeOcurrenceJson[]> {
  const rows = await db.typeOcurrence.findMany({ orderBy: { id: "asc" } });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }));
}
