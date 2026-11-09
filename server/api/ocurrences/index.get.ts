import { defineEventHandler, getHeader } from "h3";
import { getPrisma } from "../../db/client";
import { bearerToken, readSession } from "../../domain/auth/session";
import { listActive } from "../../domain/occurrences/list-active";

export default defineEventHandler(async (event) => {
  const token = bearerToken(getHeader(event, "authorization"));
  let userId: number | null = null;
  if (token) {
    const session = await readSession(getPrisma(), token);
    userId = session?.user.id ?? null;
  }

  return { ocurrences: await listActive(getPrisma(), userId) };
});
