import bcrypt from "bcryptjs";
import type { PrismaClient } from "generated/prisma/client";
import { createToken, hashToken, sessionExpiry, toPublicUser, type PublicUser } from "./session";

const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&^()\-_=+])[A-Za-z\d@$!%*#?&^()\-_=+]{8,}$/;
const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const EMAIL_MESSAGE = "O e-mail informado não é válido ou o domínio não existe.";
const PASSWORD_MESSAGE =
  "A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.";
const CONFIRMATION_MESSAGE = "A confirmação da senha não corresponde.";
const AGE_MESSAGE = "Você deve ter pelo menos 18 anos.";

export type RegistrationInput = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  password_confirmation?: unknown;
  date_birth?: unknown;
};

export type RegistrationValue = {
  name: string;
  email: string;
  password: string;
  date_birth: string;
};

export type FieldErrors = {
  name?: string[];
  email?: string[];
  password?: string[];
  date_birth?: string[];
};

export type RegistrationResult =
  | { ok: true; value: RegistrationValue }
  | { ok: false; errors: FieldErrors };

export type DomainCheck = (email: string) => boolean | Promise<boolean>;

function calendarDate(isoDate: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return isoDate;
}

function adultLimit(now: Date): string {
  const date = new Date(
    Date.UTC(now.getUTCFullYear() - 18, now.getUTCMonth(), now.getUTCDate()),
  );
  return date.toISOString().slice(0, 10);
}

export function isAtLeast18(isoDate: string, now = new Date()): boolean {
  const normalized = calendarDate(isoDate);
  if (!normalized) {
    return false;
  }

  return normalized <= adultLimit(now);
}

export function firstErrorMessage(errors: FieldErrors): string {
  for (const messages of Object.values(errors)) {
    if (messages && messages.length > 0) {
      return messages[0];
    }
  }

  return "Não foi possível validar o cadastro.";
}

export async function validateRegistration(
  input: RegistrationInput,
  domainCheck: DomainCheck,
): Promise<RegistrationResult> {
  const errors: FieldErrors = {};
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const confirmation =
    typeof input.password_confirmation === "string" ? input.password_confirmation : "";
  const dateBirth = typeof input.date_birth === "string" ? input.date_birth : "";

  if (!name) {
    errors.name = ["O nome é obrigatório."];
  } else if (name.length > 100) {
    errors.name = ["O nome deve ter no máximo 100 caracteres."];
  }

  if (!EMAIL_PATTERN.test(email)) {
    errors.email = [EMAIL_MESSAGE];
  } else {
    let accepted = false;
    try {
      accepted = await domainCheck(email);
    } catch {
      accepted = false;
    }
    if (!accepted) {
      errors.email = [EMAIL_MESSAGE];
    }
  }

  const passwordErrors: string[] = [];
  if (!PASSWORD_PATTERN.test(password)) {
    passwordErrors.push(PASSWORD_MESSAGE);
  }
  if (password !== confirmation) {
    passwordErrors.push(CONFIRMATION_MESSAGE);
  }
  if (passwordErrors.length > 0) {
    errors.password = passwordErrors;
  }

  if (!isAtLeast18(dateBirth)) {
    errors.date_birth = [AGE_MESSAGE];
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      name,
      email,
      password,
      date_birth: dateBirth,
    },
  };
}

export async function registerUser(
  db: PrismaClient,
  input: RegistrationValue,
): Promise<{ user: PublicUser; token: string }> {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const token = createToken();
  const createdAt = new Date();

  const user = await db.$transaction((tx) =>
    tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: passwordHash,
        date_birth: new Date(`${input.date_birth}T00:00:00.000Z`),
        access_tokens: {
          create: {
            token_hash: hashToken(token),
            created_at: createdAt,
            expires_at: sessionExpiry(createdAt),
          },
        },
      },
    }),
  );

  return { user: toPublicUser(user), token };
}
