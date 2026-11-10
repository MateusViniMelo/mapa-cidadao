import type { PrismaClient } from "generated/prisma/client";

export type TypeOccurrenceJson = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export async function listTypes(db: PrismaClient): Promise<TypeOccurrenceJson[]> {
  const rows = await db.typeOccurrence.findMany({ orderBy: { id: "asc" } });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }));
}
