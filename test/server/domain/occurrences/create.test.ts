import { expect, test } from "vitest";
import { geoJsonCoordinates, normalizeOccurrence, requestPoint } from "../../../../server/domain/occurrences/create";

const point = {
  location: { type: "Point" as const, coordinates: [-23.55052, -46.633308] as [number, number] },
  type_id: 1,
};

test("request point keeps latitude first", () => {
  expect(requestPoint([-23.55052, -46.633308])).toEqual({
    latitude: -23.55052,
    longitude: -46.633308,
  });
  expect(geoJsonCoordinates(-23.55052, -46.633308)).toEqual([-46.633308, -23.55052]);
});

test("stores blank description and address", () => {
  for (const body of [point, { ...point, description: null, address_name: null }]) {
    const result = normalizeOccurrence(body);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.description).toBe("");
      expect(result.value.address_name).toBe("");
    }
  }

  const kept = normalizeOccurrence({
    ...point,
    description: "Buraco na rua",
    address_name: "Av. Paulista, 1000",
  });
  expect(kept.ok).toBe(true);
  if (kept.ok) {
    expect(kept.value.description).toBe("Buraco na rua");
    expect(kept.value.address_name).toBe("Av. Paulista, 1000");
  }
});

test("stores null city state and country", () => {
  for (const body of [point, { ...point, city: null, state: null, country: null }]) {
    const result = normalizeOccurrence(body);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.city).toBeNull();
      expect(result.value.state).toBeNull();
      expect(result.value.country).toBeNull();
    }
  }

  const kept = normalizeOccurrence({
    ...point,
    city: "São Paulo",
    state: "SP",
    country: "Brasil",
  });
  expect(kept.ok).toBe(true);
  if (kept.ok) {
    expect(kept.value.city).toBe("São Paulo");
    expect(kept.value.state).toBe("SP");
    expect(kept.value.country).toBe("Brasil");
  }
});

test("rejects a description over 250", () => {
  const longDescription = normalizeOccurrence({
    ...point,
    description: "a".repeat(251),
  });
  expect(longDescription.ok).toBe(false);
  if (!longDescription.ok) {
    expect(longDescription.status).toBe(422);
    expect(longDescription.errors.description?.length ?? 0).toBeGreaterThan(0);
    expect(longDescription).not.toHaveProperty("value");
  }

  const longAddress = normalizeOccurrence({
    ...point,
    address_name: "b".repeat(501),
  });
  expect(longAddress.ok).toBe(false);
  if (!longAddress.ok) {
    expect(longAddress.status).toBe(422);
    expect(longAddress.errors.address_name?.length ?? 0).toBeGreaterThan(0);
    expect(longAddress).not.toHaveProperty("value");
  }

  const boundary = normalizeOccurrence({
    ...point,
    description: "a".repeat(250),
    address_name: "b".repeat(500),
  });
  expect(boundary.ok).toBe(true);
});
