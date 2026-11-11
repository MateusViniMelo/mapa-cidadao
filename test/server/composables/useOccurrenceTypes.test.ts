import { readFileSync } from "node:fs";
import { afterEach, expect, test, vi } from "vitest";
import { useCreateOccurrence } from "../../../composables/useCreateOccurrence";
import {
  typesErrorWhileOpen,
  useOccurrenceTypes,
} from "../../../composables/useOccurrenceTypes";
import { mapNotices } from "../../../utils/mapNotices";

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("opening loads category labels", async () => {
  const fetchMock = vi.fn(async () =>
    ok({ types_occurrence: [{ id: 3, name: "Lixo" }] }),
  );
  vi.stubGlobal("fetch", fetchMock);

  const catalog = useOccurrenceTypes();
  expect(await catalog.ensureLoaded()).toBe("ok");

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/types-occurrence");
  expect(catalog.typeOptions.value).toEqual([{ label: "Lixo", value: 3 }]);
});

test("a loaded catalog is not requested again", async () => {
  const fetchMock = vi.fn(async () =>
    ok({ types_occurrence: [{ id: 3, name: "Lixo" }] }),
  );
  vi.stubGlobal("fetch", fetchMock);

  const catalog = useOccurrenceTypes();
  await catalog.ensureLoaded();
  await catalog.ensureLoaded();

  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("an empty catalog is not requested again", async () => {
  const fetchMock = vi.fn(async () => ok({ types_occurrence: [] }));
  vi.stubGlobal("fetch", fetchMock);

  const catalog = useOccurrenceTypes();
  expect(await catalog.ensureLoaded()).toBe("ok");
  expect(await catalog.ensureLoaded()).toBe("ok");

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(catalog.typeOptions.value).toEqual([]);
});

test("a catalog failure logs the category error", async () => {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("no", { status: 500 })),
  );

  const catalog = useOccurrenceTypes();
  expect(await catalog.ensureLoaded()).toBe("error");
  expect(spy).toHaveBeenCalledWith(
    "Erro ao carregar tipos de ocorrência:",
    expect.any(Error),
  );
  expect(mapNotices.typesError).toEqual({
    title: "Erro",
    description: "Não foi possível carregar as categorias.",
    color: "error",
  });

  const draft = useCreateOccurrence();
  expect(await draft.begin(null)).toBe("error");
  expect(typesErrorWhileOpen(true, "error")).toBe(true);
  expect(typesErrorWhileOpen(false, "error")).toBe(false);
  expect(typesErrorWhileOpen(true, "ok")).toBe(false);

  const dialog = readFileSync("components/map/CreateOccurrenceModal.vue", "utf8");
  const page = readFileSync("components/map/OccurrenceMap.vue", "utf8");
  expect(dialog).toContain(
    'if (typesErrorWhileOpen(current, result)) emit("types-error")',
  );
  expect(page).toContain('@types-error="onTypesError"');
  expect(page).toContain("toast.add(mapNotices.typesError)");
});

test("a failed catalog is requested on the next open", async () => {
  let calls = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      calls += 1;
      if (calls === 1) return new Response("no", { status: 500 });
      return ok({ types_occurrence: [{ id: 3, name: "Lixo" }] });
    }),
  );
  vi.spyOn(console, "error").mockImplementation(() => {});

  const catalog = useOccurrenceTypes();
  expect(await catalog.ensureLoaded()).toBe("error");
  expect(await catalog.ensureLoaded()).toBe("ok");

  expect(calls).toBe(2);
  expect(catalog.typeOptions.value).toEqual([{ label: "Lixo", value: 3 }]);
});

test("a catalog failure leaves the category empty", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("no", { status: 500 })),
  );
  vi.spyOn(console, "error").mockImplementation(() => {});

  const catalog = useOccurrenceTypes();
  await catalog.ensureLoaded();

  expect(catalog.typeOptions.value).toEqual([]);
  expect(readFileSync("components/map/CreateOccurrenceModal.vue", "utf8")).toContain(
    ':disabled="selectedType == null"',
  );
});
