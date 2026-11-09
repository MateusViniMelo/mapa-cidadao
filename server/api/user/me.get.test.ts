import { afterAll, beforeEach, expect, test, vi } from "vitest";
import { disconnectPrisma, getPrisma } from "../../db/client";
import { resetTestDatabase } from "../../db/migrate";
import { callHandler } from "../../test/call-handler";
import registerHandler from "../register.post";
import meHandler from "./me.get";

vi.mock("../../domain/auth/email-domain", () => ({
  emailDomainAcceptsMail: async () => true,
}));

const payload = {
  name: "Ana Silva",
  email: "ana@example.invalid",
  password: "Abcdef1!",
  password_confirmation: "Abcdef1!",
  date_birth: "1990-01-15",
};

type MeUser = {
  id: number;
  name: string;
  email: string;
  date_birth: string;
  created_at: string;
  updated_at: string;
};

type MeBody = {
  user: MeUser;
  token?: string;
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

async function register() {
  const response = await callHandler<{ user: { id: number }; token: string }>(registerHandler, {
    method: "POST",
    url: "/api/register",
    body: payload,
  });
  expect(response.status).toBe(200);
  return response.body;
}

function getMe(authorization?: string) {
  return callHandler<MeBody>(meHandler, {
    method: "GET",
    url: "/api/user/me",
    headers: authorization === undefined ? undefined : { authorization },
  });
}

test("me returns the same token", async () => {
  const created = await register();
  const before = await prisma.accessToken.count({ where: { user_id: created.user.id } });

  const me = await getMe(`Bearer ${created.token}`);

  expect(me.status).toBe(200);
  expect(me.body.token).toBe(created.token);
  expect(me.body.user.id).toBe(created.user.id);
  expect(Object.keys(me.body).sort()).toEqual(["token", "user"]);
  expect(Object.keys(me.body.user).sort()).toEqual([
    "created_at",
    "date_birth",
    "email",
    "id",
    "name",
    "updated_at",
  ]);
  expect(me.body).not.toHaveProperty("password");
  expect(me.body).not.toHaveProperty("remember_token");
  expect(me.body.user).not.toHaveProperty("password");
  expect(me.body.user).not.toHaveProperty("remember_token");
  expect(await prisma.accessToken.count({ where: { user_id: created.user.id } })).toBe(before);
});

test("me rejects a missing token", async () => {
  await register();

  const missing = await getMe();
  expect(missing.status).toBe(401);

  const empty = await getMe("");
  expect(empty.status).toBe(401);

  const unknown = await getMe("Bearer not-a-real-token");
  expect(unknown.status).toBe(401);
});

test("me accepts a lowercase bearer scheme", async () => {
  const created = await register();

  for (const scheme of ["bearer", "Bearer"]) {
    const me = await getMe(`${scheme} ${created.token}`);
    expect(me.status).toBe(200);
    expect(me.body.token).toBe(created.token);
    expect(me.body.user.id).toBe(created.user.id);
  }
});
