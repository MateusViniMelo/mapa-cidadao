import { afterAll, beforeEach, expect, test, vi } from "vitest";
import { disconnectPrisma, getPrisma } from "../../../../server/db/client";
import { resetTestDatabase } from "../../../../server/db/migrate";
import { callHandler } from "../../../../server/test/call-handler";
import registerHandler from "../../../../server/api/register.post";
import meHandler from "../../../../server/api/user/me.get";
import logoutHandler from "../../../../server/api/user/logout.post";

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

function expiresAuthToken(setCookie: string[]): boolean {
  return setCookie.some((line) => {
    if (!line.startsWith("auth_token=") || !line.includes("Max-Age=0")) return false;
    const attrs = line.split(";").slice(1).map((part) => part.trim());
    return attrs.includes("Path=/") && attrs.includes("HttpOnly") && attrs.includes("SameSite=Lax");
  });
}

async function register() {
  const response = await callHandler(registerHandler, {
    method: "POST",
    url: "/api/register",
    body: payload,
  });
  expect(response.status).toBe(200);
  return sessionToken(response.setCookie);
}

test("logout revokes the cookie", async () => {
  const token = await register();
  const response = await callHandler<{ message: string }>(logoutHandler, {
    method: "POST",
    url: "/api/user/logout",
    headers: { cookie: `auth_token=${token}` },
  });

  expect(response.status).toBe(200);
  expect(response.body.message).toBe("Logout realizado com sucesso");
  expect(expiresAuthToken(response.setCookie)).toBe(true);
  expect(await prisma.accessToken.count()).toBe(0);

  const me = await callHandler(meHandler, {
    method: "GET",
    url: "/api/user/me",
    headers: { cookie: `auth_token=${token}` },
  });
  expect(me.status).toBe(401);
});

test("logout clears a bad cookie", async () => {
  const missing = await callHandler<{ message: string }>(logoutHandler, {
    method: "POST",
    url: "/api/user/logout",
  });
  expect(missing.status).toBe(401);
  expect(missing.body.message).toBe("Não autenticado");
  expect(expiresAuthToken(missing.setCookie)).toBe(true);

  const empty = await callHandler<{ message: string }>(logoutHandler, {
    method: "POST",
    url: "/api/user/logout",
    headers: { cookie: "auth_token=" },
  });
  expect(empty.status).toBe(401);
  expect(expiresAuthToken(empty.setCookie)).toBe(true);

  const unknown = await callHandler<{ message: string }>(logoutHandler, {
    method: "POST",
    url: "/api/user/logout",
    headers: { cookie: "auth_token=not-a-session" },
  });
  expect(unknown.status).toBe(401);
  expect(unknown.body.message).toBe("Não autenticado");
  expect(expiresAuthToken(unknown.setCookie)).toBe(true);

  const token = await register();
  await prisma.accessToken.updateMany({
    data: { expires_at: new Date(Date.now() - 1000) },
  });
  const expired = await callHandler<{ message: string }>(logoutHandler, {
    method: "POST",
    url: "/api/user/logout",
    headers: { cookie: `auth_token=${token}` },
  });
  expect(expired.status).toBe(401);
  expect(expired.body.message).toBe("Não autenticado");
  expect(expiresAuthToken(expired.setCookie)).toBe(true);
});
