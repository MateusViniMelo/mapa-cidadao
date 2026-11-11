import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { afterAll, beforeEach, expect, test, vi } from "vitest";
import { disconnectPrisma, getPrisma } from "../../../server/db/client";
import { resetTestDatabase } from "../../../server/db/migrate";
import { callHandler } from "../../../server/test/call-handler";
import registerHandler from "../../../server/api/register.post";
import meHandler from "../../../server/api/user/me.get";

vi.mock("../../../server/domain/auth/email-domain", () => ({
  emailDomainAcceptsMail: async () => true,
}));

const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const payload = {
  name: "Ana Silva",
  email: "ana@example.invalid",
  password: "Abcdef1!",
  password_confirmation: "Abcdef1!",
  date_birth: "1990-01-15",
};

type UserJson = {
  id: number;
  name: string;
  email: string;
  date_birth: string;
  created_at: string;
  updated_at: string;
  password?: string;
  remember_token?: string;
};

type RegisterBody = {
  user: UserJson;
  token?: string;
  message?: string;
  errors?: { email?: string[] };
  password?: string;
  remember_token?: string;
};

const prisma = getPrisma();

beforeEach(async () => {
  await resetTestDatabase(prisma);
});

afterAll(async () => {
  await disconnectPrisma();
});

function postRegister(body: typeof payload = payload) {
  return callHandler<RegisterBody>(registerHandler, {
    method: "POST",
    url: "/api/register",
    body,
  });
}

test("register returns the user without a token", async () => {
  const response = await postRegister();

  expect(response.status).toBe(200);
  expect(response.body.user.id).toEqual(expect.any(Number));
  expect(response.body.user.name).toBe(payload.name);
  expect(response.body.user.email).toBe(payload.email);
  expect(response.body.user.date_birth).toBe(payload.date_birth);
  expect(response.body.user.created_at).toMatch(ISO_8601);
  expect(response.body.user.updated_at).toMatch(ISO_8601);
  expect(response.body).not.toHaveProperty("token");
  expect(response.body.user).not.toHaveProperty("password");
});

test("register sets the session cookie", async () => {
  const response = await postRegister();
  const line = response.setCookie.find((item) => item.startsWith("auth_token="));
  const token = line?.split(";")[0]?.slice("auth_token=".length) ?? "";

  expect(response.status).toBe(200);
  expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(line).toContain("HttpOnly");
  expect(line).toContain("SameSite=Lax");
  expect(line).toContain("Path=/");
  expect(line).toContain("Max-Age=604800");
  expect(line).not.toContain("Secure");

  const stored = await prisma.accessToken.findFirstOrThrow({
    where: { user_id: response.body.user.id },
  });
  expect(stored.token_hash).toBe(createHash("sha256").update(token).digest("hex"));
  expect(stored.token_hash).not.toBe(token);
  expect(stored.expires_at.getTime() - stored.created_at.getTime()).toBe(604800 * 1000);
});

test("register stores a bcrypt password", async () => {
  const response = await postRegister();
  expect(response.status).toBe(200);

  const row = await prisma.user.findUniqueOrThrow({ where: { email: payload.email } });
  expect(await bcrypt.compare(payload.password, row.password)).toBe(true);
  expect(row.password).not.toBe(payload.password);
  expect(row.password.split("$")[2]).toBe("12");
});

test("rejects the same email with different casing", async () => {
  const first = await postRegister({ ...payload, email: "Ana@Example.invalid" });
  expect(first.status).toBe(200);
  expect(first.body.user.email).toBe("ana@example.invalid");

  const row = await prisma.user.findUnique({ where: { email: "ana@example.invalid" } });
  expect(row?.email).toBe("ana@example.invalid");

  const second = await postRegister({ ...payload, email: "ana@example.invalid" });
  expect(second.status).toBe(422);
  expect(await prisma.user.count()).toBe(1);
});

test("rejects a duplicate email", async () => {
  const first = await postRegister();
  expect(first.status).toBe(200);

  const second = await postRegister();
  expect(second.status).toBe(422);
  expect(second.body.errors?.email?.length ?? 0).toBeGreaterThan(0);
  expect(second.body.message).toBe(second.body.errors?.email?.[0]);
  expect(await prisma.user.count()).toBe(1);
});

test("register token reads me", async () => {
  const registered = await postRegister();
  const token = registered.setCookie
    .find((item) => item.startsWith("auth_token="))
    ?.split(";")[0]
    ?.slice("auth_token=".length);

  const me = await callHandler<{ user: UserJson }>(meHandler, {
    method: "GET",
    url: "/api/user/me",
    headers: { cookie: `auth_token=${token}` },
  });

  expect(me.status).toBe(200);
  expect(me.body.user.id).toBe(registered.body.user.id);
});

test("register omits the password", async () => {
  const response = await postRegister();
  expect(response.status).toBe(200);
  expect(response.body).not.toHaveProperty("password");
  expect(response.body).not.toHaveProperty("remember_token");
  expect(response.body.user).not.toHaveProperty("password");
  expect(response.body.user).not.toHaveProperty("remember_token");
  expect(Object.keys(response.body.user).sort()).toEqual([
    "created_at",
    "date_birth",
    "email",
    "id",
    "name",
    "updated_at",
  ]);
});
