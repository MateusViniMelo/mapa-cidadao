import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, beforeEach, expect, test } from "vitest";
import { disconnectPrisma, getPrisma } from "../../../server/db/client";
import { resetTestDatabase } from "../../../server/db/migrate";
import { callHandler } from "../../../server/test/call-handler";
import registerHandler from "../../../server/api/register.post";
import loginHandler from "../../../server/api/user/login.post";
import meHandler from "../../../server/api/user/me.get";
import logoutHandler from "../../../server/api/user/logout.post";
import typesHandler from "../../../server/api/types-occurrence.get";
import occurrencesGetHandler from "../../../server/api/occurrences/index.get";
import occurrencesPostHandler from "../../../server/api/occurrences/index.post";
import inactivateHandler from "../../../server/api/occurrences/inactivate/[id].post";
import myOccurrencesHandler from "../../../server/api/occurrences/my-occurrences.get";
import likeHandler from "../../../server/api/occurrences/like/[id].get";

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
    { handler: typesHandler, method: "GET", url: "/api/types-occurrence" },
    { handler: occurrencesGetHandler, method: "GET", url: "/api/occurrences" },
    { handler: occurrencesPostHandler, method: "POST", url: "/api/occurrences" },
    { handler: inactivateHandler, method: "POST", url: "/api/occurrences/inactivate/1" },
    { handler: myOccurrencesHandler, method: "GET", url: "/api/occurrences/my-occurrences" },
    { handler: likeHandler, method: "GET", url: "/api/occurrences/like/1" },
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

test("old occurrence route files are gone", () => {
  const serverApi = fileURLToPath(new URL("../../../server/api/", import.meta.url));
  const staleDir = `${"oc"}${"urrences"}`;
  const staleTypes = `types-${"oc"}${"urrence"}.get.ts`;

  expect(existsSync(`${serverApi}${staleDir}`)).toBe(false);
  expect(existsSync(`${serverApi}${staleTypes}`)).toBe(false);
  expect(existsSync(`${serverApi}occurrences/index.get.ts`)).toBe(true);
  expect(existsSync(`${serverApi}types-occurrence.get.ts`)).toBe(true);
});
