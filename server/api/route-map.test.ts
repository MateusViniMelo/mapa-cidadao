import { afterAll, beforeEach, expect, test } from "vitest";
import { disconnectPrisma, getPrisma } from "../db/client";
import { resetTestDatabase } from "../db/migrate";
import { callHandler } from "../test/call-handler";
import registerHandler from "./register.post";
import loginHandler from "./user/login.post";
import meHandler from "./user/me.get";
import logoutHandler from "./user/logout.post";
import typesHandler from "./types-ocurrence.get";
import occurrencesGetHandler from "./ocurrences/index.get";
import occurrencesPostHandler from "./ocurrences/index.post";
import inactivateHandler from "./ocurrences/inactivate/[id].post";
import myOccurrencesHandler from "./ocurrences/my-ocurrences.get";
import likeHandler from "./ocurrences/like/[id].get";

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
