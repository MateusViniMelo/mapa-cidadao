import { defineEventHandler, getHeader, readBody, setResponseStatus } from "h3";
import { getPrisma } from "../../db/client";
import { bearerToken, readSession } from "../../domain/auth/session";
import { createOccurrence, firstOccurrenceError } from "../../domain/occurrences/create";

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

  const body = (await readBody(event)) ?? {};
  const result = await createOccurrence(getPrisma(), session.user.id, body);
  if (!result.ok) {
    setResponseStatus(event, result.status);
    return { message: firstOccurrenceError(result.errors), errors: result.errors };
  }

  setResponseStatus(event, 201);
  return { occurrence: result.occurrence };
});
