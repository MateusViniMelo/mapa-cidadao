import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { getPrisma } from "../../db/client";
import { login } from "../../domain/auth/session";

const INVALID_CREDENTIALS = "Credenciais inválidas";

export default defineEventHandler(async (event) => {
  const body = (await readBody<{ email?: string; password?: string }>(event)) ?? {};
  const result = await login(getPrisma(), body.email ?? "", body.password ?? "");
  if (!result) {
    setResponseStatus(event, 401);
    return { message: INVALID_CREDENTIALS };
  }

  return result;
});
