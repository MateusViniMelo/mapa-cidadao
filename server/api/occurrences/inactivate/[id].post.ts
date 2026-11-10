import {
  defineEventHandler,
  getHeader,
  getRequestURL,
  getRouterParam,
  readBody,
  setResponseStatus,
  type H3Event,
} from "h3";
import { getPrisma } from "../../../db/client";
import { bearerToken, readSession } from "../../../domain/auth/session";
import { inactivateOccurrence, prismaInactivateStore } from "../../../domain/occurrences/inactivate";

function occurrenceId(event: H3Event): number | null {
  const routed = getRouterParam(event, "id");
  const pathId = getRequestURL(event).pathname.match(/\/inactivate\/(\d+)\/?$/)?.[1];
  const raw = routed ?? pathId;
  if (!raw || !/^\d+$/.test(raw)) {
    return null;
  }

  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }
  return id;
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

  const id = occurrenceId(event);
  if (id === null) {
    setResponseStatus(event, 404);
    return { message: "Não encontrado" };
  }

  const body = (await readBody(event)) ?? {};
  const result = await inactivateOccurrence(
    prismaInactivateStore(getPrisma()),
    session.user.id,
    id,
    body,
  );
  setResponseStatus(event, result.status);
  return result.body;
});
