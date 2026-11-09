import { afterAll, beforeEach, expect, test, vi } from "vitest";
import { disconnectPrisma, getPrisma } from "../../db/client";
import { resetTestDatabase } from "../../db/migrate";
import { callHandler } from "../../test/call-handler";
import registerHandler from "../register.post";
import meHandler from "./me.get";
import logoutHandler from "./logout.post";

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

const prisma = getPrisma();

beforeEach(async () => {
  await resetTestDatabase(prisma);
});

afterAll(async () => {
  await disconnectPrisma();
});

async function register() {
  const response = await callHandler<{ token: string }>(registerHandler, {
    method: "POST",
    url: "/api/register",
    body: payload,
  });
  expect(response.status).toBe(200);
  return response.body.token;
}

test("logout revokes the token", async () => {
  const token = await register();
  const response = await callHandler<{ message: string }>(logoutHandler, {
    method: "POST",
    url: "/api/user/logout",
    headers: { authorization: `Bearer ${token}` },
  });

  expect(response.status).toBe(200);
  expect(response.body.message).toBe("Logout realizado com sucesso");

  const me = await callHandler(meHandler, {
    method: "GET",
    url: "/api/user/me",
    headers: { authorization: `Bearer ${token}` },
  });
  expect(me.status).toBe(401);
});

test("logout rejects a missing token", async () => {
  const missing = await callHandler(logoutHandler, {
    method: "POST",
    url: "/api/user/logout",
  });
  expect(missing.status).toBe(401);

  const empty = await callHandler(logoutHandler, {
    method: "POST",
    url: "/api/user/logout",
    headers: { authorization: "" },
  });
  expect(empty.status).toBe(401);
});
