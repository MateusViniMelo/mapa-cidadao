import { existsSync, readFileSync } from "node:fs";
import { expect, test } from "vitest";

const page = readFileSync("components/map/OccurrenceMap.vue", "utf8");
const map = readFileSync("components/map/MapLibreMap.vue", "utf8");
const createDialog = readFileSync("components/map/CreateOccurrenceModal.vue", "utf8");
const closeDialog = readFileSync("components/map/CloseOccurrenceModal.vue", "utf8");
const overlay = readFileSync("components/map/MapLoadingOverlay.vue", "utf8");

test("page omits document click", () => {
  expect(page).not.toContain("document.addEventListener");
  expect(map).not.toContain("document.addEventListener");
  expect(page).toContain('console.error("Erro ao carregar tipos de ocorrência:"');
  expect(page).toContain('console.error("Erro ao obter localização:"');
  expect(overlay).toContain("Carregando ocorrências…");
});

test("map omits leaflet", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  expect(existsSync("components/map/LeafletMap.vue")).toBe(false);
  expect(page).not.toContain('from "leaflet"');
  expect(map).not.toContain('from "leaflet"');
  expect(readFileSync("util/makerIcons.ts", "utf8")).not.toContain("leaflet");
  expect(pkg.dependencies?.leaflet).toBeUndefined();
  expect(pkg.devDependencies?.["@types/leaflet"]).toBeUndefined();
  expect(map).toContain("occurrenceLngLat");
  expect(map).toContain("rasterStyle");
});

test("dialogs keep their phrases", () => {
  const createText = createDialog.replace(/\s+/g, " ");
  expect(createText).toContain("UModal");
  expect(createText).toContain("Criar Ocorrência");
  expect(createText).toContain("Endereço");
  expect(createText).toContain(
    "Não foi possível obter o endereço, mas ainda é possível salvar a ocorrência.",
  );
  expect(createText).toContain("Categoria");
  expect(createText).toContain("Selecione uma categoria");
  expect(createText).toContain("Descrição do problema");
  expect(createText).toContain("Descreva a Ocorrência");
  expect(createText).toContain("Salvar");

  expect(closeDialog).toContain("UModal");
  expect(closeDialog).toContain("Encerrar Ocorrência");
  expect(closeDialog).toContain("Qual o motivo do encerramento?");
  expect(closeDialog).toContain("Escolha o tipo");
  expect(closeDialog).toContain("Data de solução do problema?");
  expect(closeDialog).toContain("Data de quando aconteceu?");
  expect(closeDialog).toContain("Descreva o motivo?");
  expect(closeDialog).toContain("Encerrar");
});
