import { afterAll, beforeEach, expect, test, vi } from "vitest";
import { disconnectPrisma, getPrisma } from "../../../../server/db/client";
import { resetTestDatabase } from "../../../../server/db/migrate";
import { callHandler } from "../../../../server/test/call-handler";
import registerHandler from "../../../../server/api/register.post";
import meHandler from "../../../../server/api/user/me.get";

vi.mock("../../../../server/domain/auth/email-domain", () => ({
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

function sessionToken(setCookie: string[]): string {
  const line = setCookie.find((item) => item.startsWith("auth_token="));
  return line?.split(";")[0]?.slice("auth_token=".length) ?? "";
}

async function register() {
  const response = await callHandler<{ user: { id: number } }>(registerHandler, {
    method: "POST",
    url: "/api/register",
    body: payload,
  });
  expect(response.status).toBe(200);
  return { user: response.body.user, token: sessionToken(response.setCookie) };
}

function getMe(cookie?: string) {
  return callHandler<MeBody>(meHandler, {
    method: "GET",
    url: "/api/user/me",
    headers: cookie === undefined ? undefined : { cookie },
  });
}

test("me returns the user without a token", async () => {
  const created = await register();
  const before = await prisma.accessToken.count({ where: { user_id: created.user.id } });

  const me = await getMe(`auth_token=${created.token}`);

  expect(me.status).toBe(200);
  expect(me.body).not.toHaveProperty("token");
  expect(me.body.user.id).toBe(created.user.id);
  expect(Object.keys(me.body).sort()).toEqual(["user"]);
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

test("me rejects a bad cookie", async () => {
  await register();

  const missing = await getMe();
  expect(missing.status).toBe(401);
  expect(missing.body).toMatchObject({ message: "Não autenticado" });

  const empty = await getMe("auth_token=");
  expect(empty.status).toBe(401);

  const unknown = await getMe("auth_token=not-a-real-token");
  expect(unknown.status).toBe(401);
  expect(unknown.body).toMatchObject({ message: "Não autenticado" });
});

test("me rejects bearer without a cookie", async () => {
  const created = await register();

  for (const scheme of ["bearer", "Bearer"]) {
    const me = await callHandler<MeBody>(meHandler, {
      method: "GET",
      url: "/api/user/me",
      headers: { authorization: `${scheme} ${created.token}` },
    });
    expect(me.status).toBe(401);
    expect(me.body).toMatchObject({ message: "Não autenticado" });
  }
});
