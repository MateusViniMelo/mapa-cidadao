import { afterAll, beforeEach, expect, test, vi } from "vitest";
import type { EventHandler } from "h3";
import { disconnectPrisma, getPrisma } from "../../../server/db/client";
import { resetTestDatabase } from "../../../server/db/migrate";
import { callHandler } from "../../../server/test/call-handler";
import registerHandler from "../../../server/api/register.post";
import meHandler from "../../../server/api/user/me.get";
import logoutHandler from "../../../server/api/user/logout.post";
import createHandler from "../../../server/api/occurrences/index.post";
import inactivateHandler from "../../../server/api/occurrences/inactivate/[id].post";
import mineHandler from "../../../server/api/occurrences/my-occurrences.get";
import likeHandler from "../../../server/api/occurrences/like/[id].get";

vi.mock("../../../server/domain/auth/email-domain", () => ({
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

async function register() {
  const response = await callHandler<{ user: { id: number } }>(registerHandler, {
    method: "POST",
    url: "/api/register",
    body: payload,
  });
  expect(response.status).toBe(200);
  return sessionToken(response.setCookie);
}

function call(
  handler: EventHandler,
  method: string,
  url: string,
  headers?: Record<string, string>,
  body?: unknown,
) {
  return callHandler<{ message?: string; occurrence?: { id: number } }>(handler, {
    method,
    url,
    headers,
    body,
  });
}

const routes: Array<{
  handler: EventHandler;
  method: string;
  url: string;
  body?: unknown;
}> = [
  { handler: meHandler, method: "GET", url: "/api/user/me" },
  { handler: createHandler, method: "POST", url: "/api/occurrences", body: {} },
  { handler: inactivateHandler, method: "POST", url: "/api/occurrences/inactivate/1", body: {} },
  { handler: mineHandler, method: "GET", url: "/api/occurrences/my-occurrences" },
  { handler: likeHandler, method: "GET", url: "/api/occurrences/like/1" },
  { handler: logoutHandler, method: "POST", url: "/api/user/logout" },
];

async function expectUnauthorized(headers?: Record<string, string>) {
  for (const route of routes) {
    const response = await call(route.handler, route.method, route.url, headers, route.body);
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Não autenticado");
  }
}

test("cookie opens protected routes", async () => {
  const token = await register();
  const cookie = { cookie: `auth_token=${token}` };
  const type = await prisma.typeOccurrence.findFirstOrThrow({ orderBy: { id: "asc" } });

  const me = await call(meHandler, "GET", "/api/user/me", cookie);
  expect(me.status).toBe(200);

  const created = await call(createHandler, "POST", "/api/occurrences", cookie, {
    location: { type: "Point", coordinates: [-46.633308, -23.55052] },
    type_id: type.id,
    description: "Buraco na rua",
    address_name: "Av. Paulista, 1000",
    city: "São Paulo",
    state: "SP",
    country: "Brasil",
  });
  expect(created.status).toBe(201);
  const id = created.body.occurrence?.id;
  expect(id).toEqual(expect.any(Number));

  const mine = await call(mineHandler, "GET", "/api/occurrences/my-occurrences", cookie);
  expect(mine.status).toBe(200);

  const liked = await call(likeHandler, "GET", `/api/occurrences/like/${id}`, cookie);
  expect(liked.status).toBe(201);

  const closed = await call(inactivateHandler, "POST", `/api/occurrences/inactivate/${id}`, cookie, {
    type_closure: "mistake",
  });
  expect(closed.status).toBe(200);

  const logout = await call(logoutHandler, "POST", "/api/user/logout", cookie);
  expect(logout.status).toBe(200);
  expect(logout.body.message).toBe("Logout realizado com sucesso");
});

test("protected routes reject a bad cookie", async () => {
  const token = await register();

  await expectUnauthorized();
  await expectUnauthorized({ cookie: "auth_token=not-a-session" });

  await prisma.accessToken.updateMany({
    data: { expires_at: new Date(Date.now() - 1000) },
  });
  await expectUnauthorized({ cookie: `auth_token=${token}` });
});

test("bearer without a cookie is rejected", async () => {
  const token = await register();
  await expectUnauthorized({ authorization: `Bearer ${token}` });
});
