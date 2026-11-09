import { expect, test } from "vitest";
import {
  inactivateOccurrence,
  type CloseData,
  type OccurrenceState,
} from "./inactivate";

const SUCCESS = "Ocorrência inativada com sucesso.";
const NOW = new Date("2026-11-09T15:00:00.000Z");

function active(): OccurrenceState {
  return {
    id: 3,
    user_id: 1,
    is_active: true,
    type_closure: null,
    solution_description: null,
    resolution_date: null,
  };
}

function memory(initial: OccurrenceState | null, fail?: "close" | "remove") {
  let current = initial ? { ...initial } : null;
  return {
    current: () => (current ? { ...current } : null),
    async find(id: number) {
      if (!current || current.id !== id) {
        return null;
      }
      return { ...current };
    },
    async close(id: number, data: CloseData) {
      if (fail === "close") {
        throw new Error("disk");
      }
      if (!current || current.id !== id) {
        throw new Error("missing");
      }
      current = {
        ...current,
        is_active: false,
        type_closure: data.type_closure,
        solution_description: data.solution_description,
        resolution_date: data.resolution_date,
      };
    },
    async remove(id: number) {
      if (fail === "remove") {
        throw new Error("disk");
      }
      if (!current || current.id !== id) {
        throw new Error("missing");
      }
      current = null;
    },
  };
}

test("already inactive returns 422", async () => {
  const row: OccurrenceState = {
    ...active(),
    is_active: false,
    type_closure: "resolved",
    solution_description: "Antiga",
    resolution_date: "2020-01-01",
  };
  const store = memory(row);

  const result = await inactivateOccurrence(
    store,
    row.user_id,
    row.id,
    {
      type_closure: "other",
      solution_description: "Nova",
      resolution_date: "2020-02-02",
    },
    NOW,
  );

  expect(result.status).toBe(422);
  expect(result.body).toEqual({ message: "Ocorrência já inativada." });
  expect(store.current()?.type_closure).toBe("resolved");
  expect(store.current()).toEqual(row);
});

test("rejects a future resolution date", async () => {
  const row = active();
  const store = memory(row);
  const rejected = [
    { type_closure: "resolved", solution_description: "ok", resolution_date: "2026-11-10" },
    { type_closure: "nope", solution_description: "ok" },
    { solution_description: "ok" },
    { type_closure: "resolved" },
    { type_closure: "resolved", solution_description: null },
    { type_closure: "other", solution_description: "a".repeat(501) },
    { type_closure: "mistake", solution_description: "b".repeat(501) },
  ];

  for (const body of rejected) {
    const result = await inactivateOccurrence(store, row.user_id, row.id, body, NOW);
    expect(result.status).toBe(422);
    expect(store.current()).toEqual(row);
  }

  const accepted = await inactivateOccurrence(
    store,
    row.user_id,
    row.id,
    {
      type_closure: "resolved",
      solution_description: "a".repeat(500),
      resolution_date: "2026-11-09",
    },
    NOW,
  );

  expect(accepted.status).toBe(200);
  expect(accepted.body).toEqual({ message: SUCCESS });
  expect(store.current()).toMatchObject({
    is_active: false,
    type_closure: "resolved",
    solution_description: "a".repeat(500),
    resolution_date: "2026-11-09",
  });
});

test("save failure returns the message object", async () => {
  const row = active();
  const closing = memory(row, "close");
  const closed = await inactivateOccurrence(
    closing,
    row.user_id,
    row.id,
    {
      type_closure: "resolved",
      solution_description: "Feito",
      resolution_date: "2026-11-09",
    },
    NOW,
  );

  expect(closed.status).toBe(422);
  expect(closed.body).toEqual({ message: "Não foi possível inativar a ocorrência." });
  expect(closing.current()).toEqual(row);

  const deleting = memory(row, "remove");
  const removed = await inactivateOccurrence(
    deleting,
    row.user_id,
    row.id,
    { type_closure: "mistake" },
    NOW,
  );

  expect(removed.status).toBe(422);
  expect(removed.body).toEqual({ message: "Não foi possível inativar a ocorrência." });
  expect(deleting.current()).toEqual(row);
});

test("resolved and other store the closure", async () => {
  const resolvedStore = memory(active());
  const resolved = await inactivateOccurrence(
    resolvedStore,
    1,
    3,
    {
      type_closure: "resolved",
      solution_description: "Equipe consertou o buraco.",
      resolution_date: "2020-05-01",
    },
    NOW,
  );

  expect(resolved.status).toBe(200);
  expect(resolved.body).toEqual({ message: SUCCESS });
  expect(resolvedStore.current()).toEqual({
    ...active(),
    is_active: false,
    type_closure: "resolved",
    solution_description: "Equipe consertou o buraco.",
    resolution_date: "2020-05-01",
  });

  const otherStore = memory(active());
  const other = await inactivateOccurrence(
    otherStore,
    1,
    3,
    { type_closure: "other", solution_description: "Outro motivo." },
    NOW,
  );

  expect(other.status).toBe(200);
  expect(other.body).toEqual({ message: SUCCESS });
  expect(otherStore.current()).toEqual({
    ...active(),
    is_active: false,
    type_closure: "other",
    solution_description: "Outro motivo.",
    resolution_date: null,
  });
});

test("mistake deletes the row", async () => {
  const store = memory(active());
  const result = await inactivateOccurrence(
    store,
    1,
    3,
    { type_closure: "mistake" },
    NOW,
  );

  expect(result.status).toBe(200);
  expect(result.body).toEqual({ message: SUCCESS });
  expect(store.current()).toBeNull();
});

test("other user is forbidden", async () => {
  const row = active();
  const store = memory(row);
  const result = await inactivateOccurrence(
    store,
    2,
    row.id,
    { type_closure: "resolved", solution_description: "Não sou o dono." },
    NOW,
  );

  expect(result.status).toBe(403);
  expect(result.body).toEqual({
    message: "Você não tem permissão para inativar esta ocorrência.",
  });
  expect(store.current()).toEqual(row);
});
