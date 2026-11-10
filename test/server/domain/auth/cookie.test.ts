import { createEvent } from "h3";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { expect, test } from "vitest";
import { setSessionCookie } from "../../../../server/domain/auth/cookie";

function captureSessionCookie(): string {
  const req = new IncomingMessage(new Socket());
  const res = new ServerResponse(req);
  req.method = "GET";
  req.url = "/";
  req.headers = { host: "localhost" };
  setSessionCookie(createEvent(req, res), "opaque-token");
  const header = res.getHeader("set-cookie");
  return Array.isArray(header) ? header.map(String).join("\n") : String(header ?? "");
}

test("production cookie is secure", () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    expect(captureSessionCookie()).toContain("Secure");
  } finally {
    process.env.NODE_ENV = previous;
  }
});

test("non-production cookie omits secure", () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  try {
    expect(captureSessionCookie()).not.toContain("Secure");
  } finally {
    process.env.NODE_ENV = previous;
  }
});
