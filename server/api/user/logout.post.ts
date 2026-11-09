import { defineEventHandler, getHeader, setResponseStatus } from "h3";
import { getPrisma } from "../../db/client";
import { bearerToken, logout } from "../../domain/auth/session";

const SUCCESS = "Logout realizado com sucesso";

export default defineEventHandler(async (event) => {
  const token = bearerToken(getHeader(event, "authorization"));
  if (!token) {
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
