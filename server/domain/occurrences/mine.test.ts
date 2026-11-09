import { expect, test } from "vitest";
import { sliceMine } from "./mine";

test("orders by created_at descending", () => {
  const older = "2026-01-01T00:00:00.000Z";
  const middle = "2026-02-01T00:00:00.000Z";
  const newer = "2026-03-01T00:00:00.000Z";

  const page = sliceMine(
    [
      { id: 1, created_at: older },
      { id: 2, created_at: newer },
      { id: 3, created_at: middle },
    ],
    1,
  );

  expect(page.data[0]?.created_at >= page.data[1]?.created_at).toBe(true);
  expect(page.data.map((row) => row.created_at)).toEqual([newer, middle, older]);
});

test("cuts fifteen rows into ten then five", () => {
  const rows = Array.from({ length: 15 }, (_, index) => ({
    id: index + 1,
    created_at: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
  }));

  const first = sliceMine(rows, 1);
  const second = sliceMine(rows, 2);

  expect(first.data).toHaveLength(10);
  expect(second.data).toHaveLength(5);
  expect(first.per_page).toBe(10);
  expect(second.per_page).toBe(10);
  expect(first.total).toBe(15);
  expect(second.total).toBe(15);
  expect(first.data.map((row) => row.id)).toEqual([15, 14, 13, 12, 11, 10, 9, 8, 7, 6]);
  expect(second.data.map((row) => row.id)).toEqual([5, 4, 3, 2, 1]);
});
