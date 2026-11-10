import { afterAll, beforeEach, expect, test } from "vitest";
import { disconnectPrisma, getPrisma } from "../../../server/db/client";
import { resetTestDatabase } from "../../../server/db/migrate";
import { callHandler } from "../../../server/test/call-handler";
import registerHandler from "../../../server/api/register.post";
import loginHandler from "../../../server/api/user/login.post";
import meHandler from "../../../server/api/user/me.get";
import logoutHandler from "../../../server/api/user/logout.post";
import typesHandler from "../../../server/api/types-ocurrence.get";
import occurrencesGetHandler from "../../../server/api/ocurrences/index.get";
import occurrencesPostHandler from "../../../server/api/ocurrences/index.post";
import inactivateHandler from "../../../server/api/ocurrences/inactivate/[id].post";
import myOccurrencesHandler from "../../../server/api/ocurrences/my-ocurrences.get";
import likeHandler from "../../../server/api/ocurrences/like/[id].get";

const handlers = [
  registerHandler,
  loginHandler,
  meHandler,
  logoutHandler,
  typesHandler,
  occurrencesGetHandler,
  occurrencesPostHandler,
  inactivateHandler,
  myOccurrencesHandler,
  likeHandler,
];

const prisma = getPrisma();

beforeEach(async () => {
  await resetTestDatabase(prisma);
});

afterAll(async () => {
  await disconnectPrisma();
});

test("mounted paths answer", async () => {
  const paths = [
    { handler: registerHandler, method: "POST", url: "/api/register" },
    { handler: loginHandler, method: "POST", url: "/api/user/login" },
    { handler: meHandler, method: "GET", url: "/api/user/me" },
    { handler: logoutHandler, method: "POST", url: "/api/user/logout" },
    { handler: typesHandler, method: "GET", url: "/api/types-ocurrence" },
    { handler: occurrencesGetHandler, method: "GET", url: "/api/ocurrences" },
    { handler: occurrencesPostHandler, method: "POST", url: "/api/ocurrences" },
    { handler: inactivateHandler, method: "POST", url: "/api/ocurrences/inactivate/1" },
    { handler: myOccurrencesHandler, method: "GET", url: "/api/ocurrences/my-ocurrences" },
    { handler: likeHandler, method: "GET", url: "/api/ocurrences/like/1" },
  ];

  expect(handlers).toHaveLength(10);
  expect(paths).toHaveLength(10);

  for (const path of paths) {
    const response = await callHandler(path.handler, {
      method: path.method,
      url: path.url,
      body: path.method === "POST" ? {} : undefined,
    });
    expect(response.status, path.url).not.toBe(404);
  }
});
