import { afterEach, expect, test, vi } from "vitest";
import { useCreateOccurrence } from "../../../composables/useCreateOccurrence";

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function addressBody(name: string) {
  return {
    place_id: 1,
    licence: "",
    osm_type: "way",
    osm_id: 1,
    lat: "-1.45",
    lon: "-48.49",
    display_name: name,
    address: { city: "Belém", state: "Pará", country: "Brasil" },
    boundingbox: ["0", "0", "0", "0"],
  };
}

type Geocode = {
  signal: AbortSignal;
  resolve: (response: Response) => void;
  reject: (error: unknown) => void;
};

function stubGeocode() {
  const geocodes: Geocode[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      if (String(url).includes("types-occurrence")) {
        return Promise.resolve(
          ok({ types_occurrence: [{ id: 3, name: "Lixo" }] }),
        );
      }
      return new Promise<Response>((resolve, reject) => {
        geocodes.push({ signal: init?.signal as AbortSignal, resolve, reject });
      });
    }),
  );
  return geocodes;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("a second search keeps its address", async () => {
  const geocodes = stubGeocode();
  const draft = useCreateOccurrence();
  const point = { lat: -1.45, lng: -48.49 };

  const first = draft.begin(point);
  await vi.waitFor(() => expect(geocodes).toHaveLength(1));
  geocodes[0]?.resolve(ok(addressBody("Primeiro")));
  await first;
  expect(draft.address.value?.display_name).toBe("Primeiro");

  const second = draft.begin({ lat: -1.46, lng: -48.5 });
  await vi.waitFor(() => expect(geocodes).toHaveLength(2));

  expect(geocodes[0]?.signal.aborted).toBe(true);
  expect(draft.address.value).toBeNull();

  geocodes[1]?.resolve(ok(addressBody("Segundo")));
  await second;

  expect(draft.address.value?.display_name).toBe("Segundo");
  expect(draft.erroEndereco.value).toBeNull();
});

test("the newer search stays loading", async () => {
  const geocodes = stubGeocode();
  const draft = useCreateOccurrence();

  const first = draft.begin({ lat: -1.45, lng: -48.49 });
  await vi.waitFor(() => expect(geocodes).toHaveLength(1));
  const second = draft.begin({ lat: -1.46, lng: -48.5 });
  await vi.waitFor(() => expect(geocodes).toHaveLength(2));

  expect(draft.carregando.value).toBe(true);

  const aborted = new Error("The operation was aborted");
  aborted.name = "AbortError";
  geocodes[0]?.reject(aborted);
  await first;

  expect(draft.carregando.value).toBe(true);
  expect(draft.erroEndereco.value).toBeNull();

  geocodes[1]?.resolve(ok(addressBody("Segundo")));
  await second;
  expect(draft.carregando.value).toBe(false);
});

test("closing drops a late address", async () => {
  const geocodes = stubGeocode();
  const draft = useCreateOccurrence();
  const pending = draft.begin({ lat: -1.45, lng: -48.49 });
  await vi.waitFor(() => expect(geocodes).toHaveLength(1));

  draft.resetDraft();
  expect(geocodes[0]?.signal.aborted).toBe(true);
  geocodes[0]?.resolve(ok(addressBody("Tarde")));
  await pending;

  expect(draft.address.value).toBeNull();
});

test("a late first address does not win", async () => {
  const geocodes = stubGeocode();
  const draft = useCreateOccurrence();
  const first = draft.begin({ lat: -1.45, lng: -48.49 });
  await vi.waitFor(() => expect(geocodes).toHaveLength(1));
  const second = draft.begin({ lat: -1.46, lng: -48.5 });
  await vi.waitFor(() => expect(geocodes).toHaveLength(2));

  geocodes[1]?.resolve(ok(addressBody("Segundo")));
  await second;
  geocodes[0]?.resolve(ok(addressBody("Primeiro")));
  await first;

  expect(draft.address.value?.display_name).toBe("Segundo");
});

test("reset keeps the category", async () => {
  const geocodes = stubGeocode();
  const draft = useCreateOccurrence();
  draft.selectedType.value = 4;
  draft.description.value = "buraco";

  const pending = draft.begin({ lat: -1.45, lng: -48.49 });
  await vi.waitFor(() => expect(geocodes).toHaveLength(1));
  geocodes[0]?.resolve(ok(addressBody("Rua X")));
  await pending;

  draft.resetDraft();

  expect(draft.selectedType.value).toBe(4);
  expect(draft.description.value).toBe("");
  expect(draft.address.value).toBeNull();
});
