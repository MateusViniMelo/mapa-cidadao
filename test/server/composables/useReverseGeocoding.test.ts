import { afterEach, expect, test, vi } from "vitest";
import { isReadonly } from "vue";
import { useCreateOccurrence } from "../../../composables/useCreateOccurrence";
import { useReverseGeocoding } from "../../../composables/useReverseGeocoding";

function abortError() {
  const error = new Error("The operation was aborted");
  error.name = "AbortError";
  return error;
}

function jsonResponse(name: string) {
  return new Response(
    JSON.stringify({
      display_name: name,
      address: { city: "Belém" },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("an aborted search does not raise the address error", async () => {
  const controller = new AbortController();
  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(abortError()), {
          once: true,
        });
      });
    }),
  );

  const { buscarEndereco, erroEndereco, carregando } = useReverseGeocoding();
  const pending = buscarEndereco(-1.45, -48.49, controller.signal);
  controller.abort();
  await pending;

  expect(erroEndereco.value).toBeNull();
  expect(carregando.value).toBe(false);
});

test("an older search does not clear the newer loading flag", async () => {
  const pending: Array<(value: Response) => void> = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          pending.push(resolve);
        }),
    ),
  );

  const { buscarEndereco, carregando } = useReverseGeocoding();
  const first = buscarEndereco(-1.45, -48.49);
  const second = buscarEndereco(-1.46, -48.5);
  expect(carregando.value).toBe(true);

  pending[0]?.(jsonResponse("Primeiro"));
  await first;
  expect(carregando.value).toBe(true);

  pending[1]?.(jsonResponse("Segundo"));
  await second;
  expect(carregando.value).toBe(false);
});

test("address flags are readonly", () => {
  const { carregando, erroEndereco } = useReverseGeocoding();

  expect(isReadonly(carregando)).toBe(true);
  expect(isReadonly(erroEndereco)).toBe(true);

  const draft = useCreateOccurrence();
  expect(isReadonly(draft.carregando)).toBe(true);
  expect(isReadonly(draft.erroEndereco)).toBe(true);
  expect(isReadonly(draft.address)).toBe(true);
});
