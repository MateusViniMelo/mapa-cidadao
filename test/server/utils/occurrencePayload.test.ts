import { expect, test } from "vitest";
import type { EnderecoNominatim } from "../../../interfaces/EnderecoNominatim";
import { TypeOccurrenceClosure } from "../../../enums/TypeOccurrenceClosure";
import {
  buildOccurrencePayload,
  closeOccurrenceSubmission,
} from "../../../utils/occurrencePayload";

const address = {
  display_name: "Rua X",
  address: { city: "Belém", state: "Pará", country: "Brasil" },
} as EnderecoNominatim;

test("payload keeps the chosen type and the geojson point", () => {
  expect(
    buildOccurrencePayload({
      point: { lat: -1.45, lng: -48.49 },
      typeId: 4,
      description: "buraco",
      address,
    }),
  ).toEqual({
    location: { type: "Point", coordinates: [-48.49, -1.45] },
    type_id: 4,
    description: "buraco",
    address_name: "Rua X",
    city: "Belém",
    state: "Pará",
    country: "Brasil",
  });
});

test("payload refuses a missing category", () => {
  expect(
    buildOccurrencePayload({
      point: { lat: -1.45, lng: -48.49 },
      typeId: undefined,
      description: "buraco",
      address,
    }),
  ).toBeNull();
});

test("payload does not invent type 1", () => {
  const payload = buildOccurrencePayload({
    point: { lat: -1.45, lng: -48.49 },
    typeId: undefined,
    description: "buraco",
    address,
  });

  expect(payload).toBeNull();
  expect(payload).not.toEqual(expect.objectContaining({ type_id: 1 }));
});

test("payload refuses a missing point", () => {
  expect(
    buildOccurrencePayload({
      point: null,
      typeId: 4,
      description: "buraco",
      address,
    }),
  ).toBeNull();
});

test("close submission carries the occurrence id", () => {
  expect(
    closeOccurrenceSubmission(9, {
      type_closure: TypeOccurrenceClosure.RESOLVED,
      solution_description: "feito",
      resolution_date: "2026-11-10",
    }),
  ).toEqual({
    id: 9,
    type_closure: "resolved",
    solution_description: "feito",
    resolution_date: "2026-11-10",
  });
});
