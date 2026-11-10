import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { toRequestCoordinates } from "../../../utils/occurrencePoint";

test("click becomes longitude first", () => {
  const map = readFileSync("components/map/LeafletMap.vue", "utf8");

  expect(toRequestCoordinates(-23.55052, -46.633308)).toEqual([-46.633308, -23.55052]);
  expect(map).toContain(
    "coordinates: toRequestCoordinates(\n      localizacaoSelecionada.value.lat,\n      localizacaoSelecionada.value.lng,\n    )",
  );
});
