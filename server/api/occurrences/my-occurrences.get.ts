import { defineEventHandler, getHeader, getQuery, setResponseStatus } from "h3";
import { getPrisma } from "../../db/client";
import { bearerToken, readSession } from "../../domain/auth/session";
import { listMine, toMineResponse } from "../../domain/occurrences/mine";

function readPage(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = typeof raw === "string" || typeof raw === "number" ? Number(raw) : Number.NaN;
  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }
  return page;
}

export default defineEventHandler(async (event) => {
  const token = bearerToken(getHeader(event, "authorization"));
  if (!token) {
    setResponseStatus(event, 401);
    return { message: "Não autenticado" };
  }

  const session = await readSession(getPrisma(), token);
  if (!session) {
    setResponseStatus(event, 401);
    return { message: "Não autenticado" };
  }

  const slice = await listMine(getPrisma(), session.user.id, readPage(getQuery(event).page));
  return toMineResponse(slice);
});
