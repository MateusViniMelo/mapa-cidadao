import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { toRequestCoordinates } from "../../../utils/occurrencePoint";

test("click becomes longitude first", () => {
  const payload = readFileSync("utils/occurrencePayload.ts", "utf8");

  expect(toRequestCoordinates(-23.55052, -46.633308)).toEqual([-46.633308, -23.55052]);
  expect(payload).toContain(
    "coordinates: toRequestCoordinates(input.point.lat, input.point.lng)",
  );
});
