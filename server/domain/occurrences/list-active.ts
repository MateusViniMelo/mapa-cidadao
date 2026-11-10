import { Prisma, type PrismaClient } from "generated/prisma/client";

export type LikeRow = {
  occurrence_id: number;
  user_id: number;
};

export type ListedType = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export type ListedOccurrence = {
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
  type_closure: "resolved" | "mistake" | "other" | null;
  created_at: string;
  updated_at: string;
  location: { type: "Point"; coordinates: [number, number] };
  type: ListedType;
  likes_count: number;
  liked_by_auth_user: boolean;
};

type RawOccurrence = {
  id: number | bigint;
  type_id: number | bigint;
  user_id: number | bigint;
  description: string;
  address_name: string;
  city: string | null;
  state: string | null;
  country: string | null;
  is_active: boolean;
  solution_description: string | null;
  resolution_date: string | null;
  type_closure: "resolved" | "mistake" | "other" | null;
  created_at: Date | string;
  updated_at: Date | string;
  latitude: number | string;
  longitude: number | string;
  type_row_id: number | bigint;
  type_name: string;
  type_created_at: Date | string;
  type_updated_at: Date | string;
};

function asNumber(value: number | bigint | string): number {
  return typeof value === "number" ? value : Number(value);
}

function asIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toListed(row: RawOccurrence) {
  const latitude = asNumber(row.latitude);
  const longitude = asNumber(row.longitude);
  return {
    id: asNumber(row.id),
    type_id: asNumber(row.type_id),
    user_id: asNumber(row.user_id),
    description: row.description,
    address_name: row.address_name,
    city: row.city,
    state: row.state,
    country: row.country,
    is_active: row.is_active,
    solution_description: row.solution_description,
    resolution_date: row.resolution_date,
    type_closure: row.type_closure,
    created_at: asIso(row.created_at),
    updated_at: asIso(row.updated_at),
    location: {
      type: "Point" as const,
      coordinates: [longitude, latitude] as [number, number],
    },
    type: {
      id: asNumber(row.type_row_id),
      name: row.type_name,
      created_at: asIso(row.type_created_at),
      updated_at: asIso(row.type_updated_at),
    },
  };
}

type SqlDb = Pick<PrismaClient, "$queryRaw">;

export async function loadOccurrences(
  db: SqlDb,
  where: Prisma.Sql,
  userId: number | null,
): Promise<ListedOccurrence[]> {
  const rows = await db.$queryRaw<RawOccurrence[]>(Prisma.sql`
    SELECT
      o.id,
      o.type_id,
      o.user_id,
      o.description,
      o.address_name,
      o.city,
      o.state,
      o.country,
      o.is_active,
      o.solution_description,
      o.type_closure::text AS type_closure,
      to_char(o.resolution_date, 'YYYY-MM-DD') AS resolution_date,
      o.created_at,
      o.updated_at,
      ST_Y(o.location)::float8 AS latitude,
      ST_X(o.location)::float8 AS longitude,
      t.id AS type_row_id,
      t.name AS type_name,
      t.created_at AS type_created_at,
      t.updated_at AS type_updated_at
    FROM occurrences o
    INNER JOIN types_occurrence t ON t.id = o.type_id
    WHERE ${where}
    ORDER BY o.id ASC
  `);

  const listed = rows.map(toListed);
  if (listed.length === 0) {
    return [];
  }

  const likes = await db.$queryRaw<LikeRow[]>`
    SELECT user_id, occurrence_id
    FROM like_occurrences
    WHERE occurrence_id IN (${Prisma.join(listed.map((row) => row.id))})
  `;

  return withLikeFlags(
    listed,
    likes.map((like) => ({
      user_id: asNumber(like.user_id),
      occurrence_id: asNumber(like.occurrence_id),
    })),
    userId,
  );
}

export function listActive(db: PrismaClient, userId: number | null): Promise<ListedOccurrence[]> {
  return loadOccurrences(db, Prisma.sql`o.is_active = true`, userId);
}

export async function findOccurrence(
  db: SqlDb,
  id: number,
  userId: number | null,
): Promise<ListedOccurrence | null> {
  const rows = await loadOccurrences(db, Prisma.sql`o.id = ${id}`, userId);
  return rows[0] ?? null;
}

export function withLikeFlags<T extends { id: number }>(
  rows: readonly T[],
  likes: readonly LikeRow[],
  userId: number | null,
): Array<T & { liked_by_auth_user: boolean; likes_count: number }> {
  const byOccurrence = new Map<number, { count: number; liked: boolean }>();

  for (const like of likes) {
    const current = byOccurrence.get(like.occurrence_id) ?? { count: 0, liked: false };
    current.count += 1;
    if (userId !== null && like.user_id === userId) {
      current.liked = true;
    }
    byOccurrence.set(like.occurrence_id, current);
  }

  return rows.map((row) => {
    const aggregate = byOccurrence.get(row.id) ?? { count: 0, liked: false };
    return {
      ...row,
      liked_by_auth_user: aggregate.liked,
      likes_count: aggregate.count,
    };
  });
}
