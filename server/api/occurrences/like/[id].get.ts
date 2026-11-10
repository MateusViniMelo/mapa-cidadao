import {
  defineEventHandler,
  getHeader,
  getRequestURL,
  getRouterParam,
  setResponseStatus,
  type H3Event,
} from "h3";
import { getPrisma } from "../../../db/client";
import { bearerToken, readSession } from "../../../domain/auth/session";
import { toggleLike } from "../../../domain/occurrences/like";
import { findOccurrence } from "../../../domain/occurrences/list-active";

const LIKED = "Ocorrência curtida com sucesso.";
const REMOVED = "Curtida removida com sucesso.";

function occurrenceId(event: H3Event): number | null {
  const routed = getRouterParam(event, "id");
  const pathId = getRequestURL(event).pathname.match(/\/like\/(\d+)\/?$/)?.[1];
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

  const db = getPrisma();
  const current = await findOccurrence(db, id, session.user.id);
  if (!current) {
    setResponseStatus(event, 404);
    return { message: "Não encontrado" };
  }

  const action = await toggleLike(db, session.user.id, id);
  const occurrence = await findOccurrence(db, id, session.user.id);
  setResponseStatus(event, action === "created" ? 201 : 200);
  return {
    message: action === "created" ? LIKED : REMOVED,
    occurrence,
  };
});
