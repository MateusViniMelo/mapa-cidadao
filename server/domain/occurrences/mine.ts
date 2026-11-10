import { Prisma, type PrismaClient } from "generated/prisma/client";
import { loadOccurrences, type ListedOccurrence } from "./list-active";

export const MINE_PAGE_SIZE = 10;

export type MinePage<T> = {
  data: T[];
  total: number;
  per_page: number;
  current_page: number;
};

export function sliceMine<T extends { created_at: string }>(
  rows: readonly T[],
  page: number,
): MinePage<T> {
  const current = Number.isInteger(page) && page > 0 ? page : 1;
  const ordered = [...rows].sort((left, right) => {
    if (left.created_at === right.created_at) {
      return 0;
    }
    return left.created_at > right.created_at ? -1 : 1;
  });
  const start = (current - 1) * MINE_PAGE_SIZE;

  return {
    data: ordered.slice(start, start + MINE_PAGE_SIZE),
    total: ordered.length,
    per_page: MINE_PAGE_SIZE,
    current_page: current,
  };
}

export function listMine(
  db: PrismaClient,
  userId: number,
  page: number,
): Promise<MinePage<ListedOccurrence>> {
  return loadOccurrences(db, Prisma.sql`o.user_id = ${userId}`, userId).then((rows) =>
    sliceMine(rows, page),
  );
}

export function toMineResponse<T>(page: MinePage<T>): {
  data: T[];
  page: number;
  per_page: number;
  total: number;
} {
  return {
    data: page.data,
    page: page.current_page,
    per_page: page.per_page,
    total: page.total,
  };
}
