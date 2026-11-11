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

  const { lookupAddress, addressError, loadingAddress } = useReverseGeocoding();
  const pending = lookupAddress(-1.45, -48.49, controller.signal);
  controller.abort();
  await pending;

  expect(addressError.value).toBeNull();
  expect(loadingAddress.value).toBe(false);
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

  const { lookupAddress, loadingAddress } = useReverseGeocoding();
  const first = lookupAddress(-1.45, -48.49);
  const second = lookupAddress(-1.46, -48.5);
  expect(loadingAddress.value).toBe(true);

  pending[0]?.(jsonResponse("Primeiro"));
  await first;
  expect(loadingAddress.value).toBe(true);

  pending[1]?.(jsonResponse("Segundo"));
  await second;
  expect(loadingAddress.value).toBe(false);
});

test("address flags are readonly", () => {
  const { loadingAddress, addressError } = useReverseGeocoding();

  expect(isReadonly(loadingAddress)).toBe(true);
  expect(isReadonly(addressError)).toBe(true);

  const draft = useCreateOccurrence();
  expect(isReadonly(draft.loadingAddress)).toBe(true);
  expect(isReadonly(draft.addressError)).toBe(true);
  expect(isReadonly(draft.address)).toBe(true);
});
