import { defineEventHandler, setResponseStatus } from "h3";
import { getPrisma } from "../../db/client";
import { readSessionCookie } from "../../domain/auth/cookie";
import { readSession } from "../../domain/auth/session";

export default defineEventHandler(async (event) => {
  const token = readSessionCookie(event);
  if (!token) {
    setResponseStatus(event, 401);
    return { message: "Não autenticado" };
  }

  const session = await readSession(getPrisma(), token);
  if (!session) {
    setResponseStatus(event, 401);
    return { message: "Não autenticado" };
  }

  return { user: session.user };
});
