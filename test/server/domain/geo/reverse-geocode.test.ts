import { beforeEach, expect, test, vi } from "vitest";
import {
  parseLatitude,
  parseLongitude,
  resetReverseGeocodeState,
  reverseGeocodePoint,
} from "../../../../server/domain/geo/reverse-geocode";

beforeEach(() => {
  resetReverseGeocodeState();
});

function instantClock() {
  const waits: number[] = [];
  return {
    waits,
    clock: {
      now: () => 1_700_000_000_000,
      sleep: async (ms: number) => {
        waits.push(ms);
      },
    },
  };
}

test("coordinates must be finite decimal degrees", () => {
  expect(parseLatitude("0")).toBe(0);
  expect(parseLatitude(0)).toBe(0);
  expect(parseLatitude(" -1.45 ")).toBe(-1.45);
  expect(parseLatitude("90")).toBe(90);
  expect(parseLatitude("-90")).toBe(-90);
  expect(parseLatitude(["1"])).toBe(1);

  for (const value of ["", "   ", "NaN", "Infinity", "1e2", "12abc", "90.0001", "-90.1", ["1", "2"], null]) {
    expect(parseLatitude(value)).toBeNull();
  }

  expect(parseLongitude("180")).toBe(180);
  expect(parseLongitude("-180")).toBe(-180);
  expect(parseLongitude("-48.49")).toBe(-48.49);
  expect(parseLongitude("180.0001")).toBeNull();
  expect(parseLongitude(Number.POSITIVE_INFINITY)).toBeNull();
});

test("the same point is fetched once", async () => {
  const { clock, waits } = instantClock();
  const fetchPlace = vi.fn(async () => ({ display_name: "Rua" }));

  await expect(reverseGeocodePoint(-1.45, -48.49, fetchPlace, clock)).resolves.toEqual({
    display_name: "Rua",
  });
  await expect(reverseGeocodePoint(-1.45, -48.49, fetchPlace, clock)).resolves.toEqual({
    display_name: "Rua",
  });

  expect(fetchPlace).toHaveBeenCalledTimes(1);
  expect(waits).toEqual([]);
});

test("two points leave one second between nominatim calls", async () => {
  const { clock, waits } = instantClock();
  const fetchPlace = vi.fn(async (latitude: number) => ({ display_name: String(latitude) }));

  await reverseGeocodePoint(-1.45, -48.49, fetchPlace, clock);
  await reverseGeocodePoint(-1.46, -48.5, fetchPlace, clock);

  expect(fetchPlace).toHaveBeenCalledTimes(2);
  expect(waits).toEqual([1000]);
});

test("parallel lookups of one point share the nominatim call", async () => {
  const { clock } = instantClock();
  let release: (value: unknown) => void = () => {};
  const fetchPlace = vi.fn(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );

  const first = reverseGeocodePoint(-1.45, -48.49, fetchPlace, clock);
  const second = reverseGeocodePoint(-1.45, -48.49, fetchPlace, clock);
  await Promise.resolve();
  expect(fetchPlace).toHaveBeenCalledTimes(1);

  release({ display_name: "Rua" });
  await expect(first).resolves.toEqual({ display_name: "Rua" });
  await expect(second).resolves.toEqual({ display_name: "Rua" });
});

test("a failed lookup is not cached", async () => {
  const { clock } = instantClock();
  const fetchPlace = vi
    .fn()
    .mockRejectedValueOnce(new Error("nominatim"))
    .mockResolvedValueOnce({ display_name: "Rua" });

  await expect(reverseGeocodePoint(-1.45, -48.49, fetchPlace, clock)).rejects.toThrow(
    "nominatim",
  );
  await expect(reverseGeocodePoint(-1.45, -48.49, fetchPlace, clock)).resolves.toEqual({
    display_name: "Rua",
  });
  expect(fetchPlace).toHaveBeenCalledTimes(2);
});
