import bcrypt from "bcryptjs";
import { afterAll, beforeEach, expect, test } from "vitest";
import { disconnectPrisma, getPrisma } from "../../../../server/db/client";
import { resetTestDatabase } from "../../../../server/db/migrate";
import {
  createToken,
  hashToken,
  login,
  readSession,
  SESSION_TTL_SECONDS,
} from "../../../../server/domain/auth/session";

const prisma = getPrisma();

beforeEach(async () => {
  await resetTestDatabase(prisma);
});

afterAll(async () => {
  await disconnectPrisma();
});

test("expired session is refused", async () => {
  const user = await prisma.user.create({
    data: {
      name: "Ana Silva",
      email: "vencido@example.invalid",
      password: "not-used",
      date_birth: new Date("1990-01-15T00:00:00.000Z"),
    },
  });
  const token = createToken();
  await prisma.accessToken.create({
    data: {
      user_id: user.id,
      token_hash: hashToken(token),
      expires_at: new Date(Date.now() - 1000),
    },
  });

  expect(await readSession(prisma, token)).toBeNull();
});

test("login stores a seven day expiry", async () => {
  const password = "Abcdef1!";
  await prisma.user.create({
    data: {
      name: "Ana Silva",
      email: "prazo-login@example.invalid",
      password: await bcrypt.hash(password, 12),
      date_birth: new Date("1990-01-15T00:00:00.000Z"),
    },
  });

  const session = await login(prisma, "prazo-login@example.invalid", password);
  expect(session?.user.email).toBe("prazo-login@example.invalid");

  const row = await prisma.accessToken.findFirstOrThrow({
    where: { user_id: session?.user.id },
  });
  expect(row.expires_at.getTime() - row.created_at.getTime()).toBe(SESSION_TTL_SECONDS * 1000);
  expect(await readSession(prisma, session?.token ?? "")).toMatchObject({
    user: { id: session?.user.id },
  });
});
