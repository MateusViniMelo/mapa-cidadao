import { Prisma, type PrismaClient } from "generated/prisma/client";
import type { IPaginationLink } from "../../../interfaces/IPaginationLink";
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

function pageUrl(path: string, page: number): string {
  return `${path}?page=${page}`;
}

export function toMineResponse(page: MinePage<ListedOccurrence>, path: string) {
  const lastPage = Math.max(1, Math.ceil(page.total / page.per_page));
  const current = page.current_page;
  const hasRows = page.data.length > 0;
  const from = hasRows ? (current - 1) * page.per_page + 1 : 0;
  const to = hasRows ? from + page.data.length - 1 : 0;
  const links: IPaginationLink[] = [
    {
      url: current > 1 ? pageUrl(path, current - 1) : null,
      label: "Previous",
      page: current > 1 ? current - 1 : null,
      active: false,
    },
  ];

  for (let number = 1; number <= lastPage; number += 1) {
    links.push({
      url: pageUrl(path, number),
      label: String(number),
      page: number,
      active: number === current,
    });
  }

  links.push({
    url: current < lastPage ? pageUrl(path, current + 1) : null,
    label: "Next",
    page: current < lastPage ? current + 1 : null,
    active: false,
  });

  return {
    current_page: current,
    data: page.data,
    first_page_url: pageUrl(path, 1),
    from,
    last_page: lastPage,
    last_page_url: pageUrl(path, lastPage),
    links,
    next_page_url: current < lastPage ? pageUrl(path, current + 1) : null,
    path,
    per_page: page.per_page,
    prev_page_url: current > 1 ? pageUrl(path, current - 1) : null,
    to,
    total: page.total,
  };
}
