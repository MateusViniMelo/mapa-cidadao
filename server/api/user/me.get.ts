import { defineEventHandler, getHeader, setResponseStatus } from "h3";
import { getPrisma } from "../../db/client";
import { bearerToken, readSession } from "../../domain/auth/session";

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

  return session;
});
