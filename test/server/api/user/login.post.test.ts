import { afterAll, beforeEach, expect, test, vi } from "vitest";
import { disconnectPrisma, getPrisma } from "../../../../server/db/client";
import { resetTestDatabase } from "../../../../server/db/migrate";
import { callHandler } from "../../../../server/test/call-handler";
import registerHandler from "../../../../server/api/register.post";
import loginHandler from "../../../../server/api/user/login.post";

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

type UserJson = {
  id: number;
  name: string;
  email: string;
  password?: string;
  remember_token?: string;
};

type LoginBody = {
  user: UserJson;
  token?: string;
  message?: string;
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
  const response = await callHandler<{ user: UserJson; token: string }>(registerHandler, {
    method: "POST",
    url: "/api/register",
    body: payload,
  });
  expect(response.status).toBe(200);
  return response.body;
}

function postLogin(body: { email: string; password: string }) {
  return callHandler<LoginBody>(loginHandler, {
    method: "POST",
    url: "/api/user/login",
    body,
  });
}

test("login returns 200", async () => {
  const created = await register();
  const response = await postLogin({ email: payload.email, password: payload.password });

  expect(response.status).toBe(200);
  expect(response.body.user.id).toBe(created.user.id);
  expect(response.body.user.email).toBe(payload.email);
  expect(response.body.user.name).toBe(payload.name);
  expect(response.body.token).toEqual(expect.any(String));
  expect(response.body.user).not.toHaveProperty("password");
});

test("login rejects bad credentials", async () => {
  await register();

  const wrongPassword = await postLogin({
    email: payload.email,
    password: "Wrongpass1!",
  });
  expect(wrongPassword.status).toBe(401);
  expect(wrongPassword.body.message).toBe("Credenciais inválidas");
  expect(wrongPassword.body).not.toHaveProperty("token");

  const unknownEmail = await postLogin({
    email: "missing@example.invalid",
    password: payload.password,
  });
  expect(unknownEmail.status).toBe(401);
  expect(unknownEmail.body.message).toBe("Credenciais inválidas");
  expect(unknownEmail.body).not.toHaveProperty("token");
});

test("login omits the password", async () => {
  await register();
  const response = await postLogin({ email: payload.email, password: payload.password });

  expect(response.status).toBe(200);
  expect(response.body).not.toHaveProperty("password");
  expect(response.body).not.toHaveProperty("remember_token");
  expect(response.body.user).not.toHaveProperty("password");
  expect(response.body.user).not.toHaveProperty("remember_token");
});
