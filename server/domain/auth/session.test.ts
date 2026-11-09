import { createHash } from "node:crypto";
import { expect, test } from "vitest";
import { createMemorySessions, hashToken } from "./session";

test("hashes the token with sha-256", () => {
  const token = "plain-token";
  const digest = createHash("sha256").update(token).digest("hex");

  expect(hashToken(token)).toBe(digest);
  expect(hashToken(token)).not.toBe(token);
  expect(hashToken(token)).toHaveLength(64);
});

test("read returns the same token", () => {
  const sessions = createMemorySessions();
  const token = "same-token-value";

  sessions.save(token, 7);

  expect(sessions.read(token)).toEqual({ token, userId: 7 });
});

test("logout removes the token", () => {
  const sessions = createMemorySessions();
  const token = "token-to-revoke";

  sessions.save(token, 7);
  expect(sessions.logout(token)).toBe(true);
  expect(sessions.read(token)).toBeNull();
});
