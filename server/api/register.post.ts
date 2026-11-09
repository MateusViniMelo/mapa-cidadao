import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { Prisma } from "generated/prisma/client";
import { getPrisma } from "../db/client";
import { emailDomainAcceptsMail } from "../domain/auth/email-domain";
import {
  firstErrorMessage,
  registerUser,
  validateRegistration,
  type RegistrationInput,
} from "../domain/auth/register";

const DUPLICATE_EMAIL = "O e-mail já está cadastrado.";

export default defineEventHandler(async (event) => {
  const body = (await readBody<RegistrationInput>(event)) ?? {};
  const validated = await validateRegistration(body, emailDomainAcceptsMail);
  if (!validated.ok) {
    setResponseStatus(event, 422);
    return {
      message: firstErrorMessage(validated.errors),
      errors: validated.errors,
    };
  }

  try {
    return await registerUser(getPrisma(), validated.value);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      setResponseStatus(event, 422);
      const errors = { email: [DUPLICATE_EMAIL] };
      return { message: errors.email[0], errors };
    }

    throw error;
  }
});
