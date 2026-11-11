import { beforeEach, expect, test, vi } from "vitest";
import { $fetch } from "ofetch";
import handler from "../../../server/api/reverse-geocoding";
import { NOMINATIM_USER_AGENT, resetReverseGeocodeState } from "../../../server/domain/geo/reverse-geocode";
import { callHandler } from "../../../server/test/call-handler";

vi.mock("ofetch", () => ({
  $fetch: vi.fn(async () => ({ display_name: "Av. Nazaré, Belém" })),
}));

beforeEach(() => {
  resetReverseGeocodeState();
  vi.mocked($fetch).mockClear();
});

function getPoint(query: string) {
  return callHandler<{ error?: string; display_name?: string }>(handler, {
    method: "GET",
    url: `/api/reverse-geocoding${query}`,
  });
}

test("invalid coordinates do not call nominatim", async () => {
  for (const query of ["", "?lat=foo&lng=1", "?lat=91&lng=0", "?lng=10", "?lat=0&lng=Infinity"]) {
    const response = await getPoint(query);
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Coordenadas inválidas" });
  }

  expect($fetch).not.toHaveBeenCalled();
});

test("a finite point is cached and sent with a real contact", async () => {
  const first = await getPoint("?lat=-1.45&lng=-48.49");
  const second = await getPoint("?lat=-1.45&lng=-48.49");

  expect(first.status).toBe(200);
  expect(first.body.display_name).toBe("Av. Nazaré, Belém");
  expect(second.body).toEqual(first.body);
  expect($fetch).toHaveBeenCalledTimes(1);
  expect($fetch).toHaveBeenCalledWith(
    "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=-1.45&lon=-48.49",
    {
      headers: {
        "Accept-Language": "pt-BR",
        "User-Agent": NOMINATIM_USER_AGENT,
      },
    },
  );
  expect(NOMINATIM_USER_AGENT).toBe("MapaCidadao/1.0 (mateusmelo04@gmail.com)");
  expect(NOMINATIM_USER_AGENT).not.toContain("email.com@gmail.com");
});

test("the equator is a valid point", async () => {
  const response = await getPoint("?lat=0&lng=0");

  expect(response.status).toBe(200);
  expect($fetch).toHaveBeenCalledWith(
    "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=0&lon=0",
    expect.objectContaining({
      headers: expect.objectContaining({ "User-Agent": NOMINATIM_USER_AGENT }),
    }),
  );
});
