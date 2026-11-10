import { afterAll, expect, test } from "vitest";
import { disconnectPrisma, getPrisma } from "../../../../server/db/client";
import { resetTestDatabase } from "../../../../server/db/migrate";
import { callHandler } from "../../../../server/test/call-handler";
import registerHandler from "../../../../server/api/register.post";
import { emailDomainAcceptsMail } from "../../../../server/domain/auth/email-domain";
import { validateRegistration, type RegistrationInput } from "../../../../server/domain/auth/register";

const EMAIL_MESSAGE = "O e-mail informado não é válido ou o domínio não existe.";
const PASSWORD_MESSAGE =
  "A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.";
const CONFIRMATION_MESSAGE = "A confirmação da senha não corresponde.";
const AGE_MESSAGE = "Você deve ter pelo menos 18 anos.";

const valid: RegistrationInput = {
  name: "Ana Silva",
  email: "ana@example.com",
  password: "Abcdef1!",
  password_confirmation: "Abcdef1!",
  date_birth: "1990-01-15",
};

const acceptDomain = async () => true;

afterAll(async () => {
  await disconnectPrisma();
});

function utcYearsAgo(years: number, now: Date): string {
  const date = new Date(
    Date.UTC(now.getUTCFullYear() - years, now.getUTCMonth(), now.getUTCDate()),
  );
  return date.toISOString().slice(0, 10);
}

function plusUtcDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

test("rejects a blank name", async () => {
  const prisma = getPrisma();
  await resetTestDatabase(prisma);
  const before = await prisma.user.count();

  for (const name of ["", "   ", undefined]) {
    const response = await callHandler<{ errors?: { name?: string[] } }>(registerHandler, {
      method: "POST",
      url: "/api/register",
      body: { ...valid, name, email: "not-an-email" },
    });
    expect(response.status).toBe(422);
    expect(response.body.errors?.name?.length ?? 0).toBeGreaterThan(0);
    expect(await prisma.user.count()).toBe(before);
  }
});

test("rejects a name over 100 characters", async () => {
  const result = await validateRegistration(
    { ...valid, name: "a".repeat(101) },
    acceptDomain,
  );
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.errors.name?.length ?? 0).toBeGreaterThan(0);
    expect(result).not.toHaveProperty("value");
  }

  const boundary = await validateRegistration(
    { ...valid, name: "a".repeat(100) },
    acceptDomain,
  );
  expect(boundary.ok).toBe(true);
});

test("rejects an email the domain check refuses", async () => {
  const refused = await validateRegistration(valid, async () => false);
  expect(refused.ok).toBe(false);
  if (!refused.ok) {
    expect(refused.errors.email).toContain(EMAIL_MESSAGE);
  }

  const accepted = await validateRegistration(valid, async () => true);
  expect(accepted.ok).toBe(true);

  const malformed = await validateRegistration(
    { ...valid, email: "not-an-email" },
    async () => true,
  );
  expect(malformed.ok).toBe(false);
  if (!malformed.ok) {
    expect(malformed.errors.email).toContain(EMAIL_MESSAGE);
  }

  const thrown = await emailDomainAcceptsMail("ana@example.com", async () => {
    throw new Error("dns");
  });
  expect(thrown).toBe(false);

  const empty = await emailDomainAcceptsMail("ana@example.com", async () => []);
  expect(empty).toBe(false);
});

test("rejects a password outside the pattern", async () => {
  const accepted = await validateRegistration(
    { ...valid, password: "Abcdef1!", password_confirmation: "Abcdef1!" },
    acceptDomain,
  );
  expect(accepted.ok).toBe(true);

  for (const password of [undefined, "Ab1!", "Abcdefg1", "Abcde1!", "abcdef1!"]) {
    const result = await validateRegistration(
      { ...valid, password, password_confirmation: password },
      acceptDomain,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.password).toContain(PASSWORD_MESSAGE);
    }
  }
});

test("rejects a mismatched confirmation", async () => {
  const result = await validateRegistration(
    { ...valid, password_confirmation: "Abcdef1?" },
    acceptDomain,
  );
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.errors.password).toContain(CONFIRMATION_MESSAGE);
  }
});

test("rejects a birth date under 18", async () => {
  const limit = utcYearsAgo(18, new Date());
  const tooYoung = await validateRegistration(
    { ...valid, date_birth: plusUtcDays(limit, 1) },
    acceptDomain,
  );
  expect(tooYoung.ok).toBe(false);
  if (!tooYoung.ok) {
    expect(tooYoung.errors.date_birth).toContain(AGE_MESSAGE);
  }

  const turnsEighteen = await validateRegistration(
    { ...valid, date_birth: limit },
    acceptDomain,
  );
  expect(turnsEighteen.ok).toBe(true);
});
