import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { registerUserSchema } from "../../../validators/registerUserSchema";
import { adultLimit, isAtLeast18 } from "../../../utils/adultAge";

const form = {
  name: "Ana Silva",
  email: "ana@example.com",
  password: "Abcdef1!",
  password_confirmation: "Abcdef1!",
};

function plusUtcDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

test("eighteen years is a UTC civil date on or before the limit", () => {
  const now = new Date("2026-11-12T02:30:00.000Z");

  expect(adultLimit(now)).toBe("2008-11-12");
  expect(isAtLeast18("2008-11-12", now)).toBe(true);
  expect(isAtLeast18("2008-11-13", now)).toBe(false);
  expect(isAtLeast18("2026-02-31", now)).toBe(false);
});

test("the registration form accepts the UTC birthday of turning 18", () => {
  const source = readFileSync("validators/registerUserSchema.ts", "utf8");
  expect(source).toContain('from "@/utils/adultAge"');
  expect(source).not.toContain("dayjs");

  const limit = adultLimit(new Date());
  expect(registerUserSchema.safeParse({ ...form, date_birth: limit }).success).toBe(true);
  expect(
    registerUserSchema.safeParse({ ...form, date_birth: plusUtcDays(limit, 1) }).success,
  ).toBe(false);
});
