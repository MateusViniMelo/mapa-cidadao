import { defineEventHandler } from "h3";
import { getPrisma } from "../../db/client";
import { readSessionCookie } from "../../domain/auth/cookie";
import { readSession } from "../../domain/auth/session";
import { listActive } from "../../domain/occurrences/list-active";

export default defineEventHandler(async (event) => {
  const token = readSessionCookie(event);
  let userId: number | null = null;
  if (token) {
    const session = await readSession(getPrisma(), token);
    userId = session?.user.id ?? null;
  }

  return { occurrences: await listActive(getPrisma(), userId) };
});
