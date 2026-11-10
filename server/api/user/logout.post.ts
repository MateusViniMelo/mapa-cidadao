import { defineEventHandler, setResponseStatus } from "h3";
import { getPrisma } from "../../db/client";
import { clearSessionCookie, readSessionCookie } from "../../domain/auth/cookie";
import { logout, readSession } from "../../domain/auth/session";

const SUCCESS = "Logout realizado com sucesso";

export default defineEventHandler(async (event) => {
  const token = readSessionCookie(event);
  clearSessionCookie(event);
  if (!token) {
    setResponseStatus(event, 401);
    return { message: "Não autenticado" };
  }

  const session = await readSession(getPrisma(), token);
  if (!session) {
    await logout(getPrisma(), token);
    setResponseStatus(event, 401);
    return { message: "Não autenticado" };
  }

  const revoked = await logout(getPrisma(), token);
  if (!revoked) {
    setResponseStatus(event, 401);
    return { message: "Não autenticado" };
  }

  return { message: SUCCESS };
});
