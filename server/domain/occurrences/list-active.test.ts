import { expect, test } from "vitest";
import { withLikeFlags, type LikeRow } from "./list-active";

const rows = [
  { id: 1, description: "ativa" },
  { id: 2, description: "outra" },
];

test("anonymous list sets liked_by_auth_user false", () => {
  const likes: LikeRow[] = [
    { ocurrence_id: 1, user_id: 8 },
    { ocurrence_id: 1, user_id: 9 },
    { ocurrence_id: 2, user_id: 8 },
  ];

  const listed = withLikeFlags(rows, likes, null);

  expect(listed.map((row) => row.liked_by_auth_user)).toEqual([false, false]);
  expect(listed.map((row) => row.likes_count)).toEqual([2, 1]);
});

test("list reports the caller like and the count", () => {
  const likes: LikeRow[] = [
    { ocurrence_id: 1, user_id: 4 },
    { ocurrence_id: 1, user_id: 7 },
    { ocurrence_id: 2, user_id: 9 },
  ];

  const listed = withLikeFlags(rows, likes, 7);
  const liked = listed.find((row) => row.id === 1);
  const other = listed.find((row) => row.id === 2);

  expect(liked?.liked_by_auth_user).toBe(true);
  expect(liked?.likes_count).toBe(2);
  expect(other?.liked_by_auth_user).toBe(false);
  expect(other?.likes_count).toBe(1);
});

test("counts likes the caller did not make", () => {
  const likes: LikeRow[] = [
    { ocurrence_id: 1, user_id: 8 },
    { ocurrence_id: 1, user_id: 9 },
    { ocurrence_id: 1, user_id: 10 },
  ];

  const listed = withLikeFlags(rows, likes, 7);

  expect(listed.find((row) => row.id === 1)).toMatchObject({
    liked_by_auth_user: false,
    likes_count: 3,
  });
  expect(listed.find((row) => row.id === 2)).toMatchObject({
    liked_by_auth_user: false,
    likes_count: 0,
  });
});
