import { existsSync, readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { useCurrentLocation } from "../../../composables/useCurrentLocation";
import { locateFailureNotice, mapNotices } from "../../../utils/mapNotices";

function deferredGeo() {
  let success: (position: {
    coords: { latitude: number; longitude: number };
  }) => void = () => {};
  let failure: (error: unknown) => void = () => {};
  return {
    geolocation: {
      getCurrentPosition(
        ok: typeof success,
        err: typeof failure,
      ) {
        success = ok;
        failure = err;
      },
    },
    succeed(latitude: number, longitude: number) {
      success({ coords: { latitude, longitude } });
    },
    fail(error: unknown) {
      failure(error);
    },
  };
}

const page = readFileSync("components/map/OccurrenceMap.vue", "utf8");
const map = readFileSync("components/map/MapLibreMap.vue", "utf8");
const createDialog = readFileSync("components/map/CreateOccurrenceModal.vue", "utf8");
const closeDialog = readFileSync("components/map/CloseOccurrenceModal.vue", "utf8");
const overlay = readFileSync("components/map/MapLoadingOverlay.vue", "utf8");
const types = readFileSync("composables/useOccurrenceTypes.ts", "utf8");

function sliceFunction(text: string, name: string): string {
  const start = text.indexOf(`async function ${name}`);
  expect(start).toBeGreaterThanOrEqual(0);
  const next = text.indexOf("async function ", start + 1);
  return text.slice(start, next === -1 ? undefined : next);
}

test("page omits document click", () => {
  expect(page).not.toContain("document.addEventListener");
  expect(map).not.toContain("document.addEventListener");
  expect(types).toContain('console.error("Erro ao carregar tipos de ocorrência:"');
  expect(map).toContain('console.error("Erro ao obter localização:"');
  expect(page).not.toContain('"/api/types-occurrence"');
  expect(overlay).toContain("Carregando ocorrências…");
});

test("home skips the catalog", () => {
  const mounted = page.slice(page.indexOf("onMounted"));
  expect(mounted).toContain("loadOccurrences");
  expect(mounted).not.toContain("types-occurrence");
  expect(page).not.toContain('"/api/types-occurrence"');
});

test("page leaves the draft", () => {
  expect(page).not.toContain("descricao");
  expect(page).not.toContain("selectedType");
  expect(page).not.toContain("enderecoAchado");
  expect(page).not.toContain("ocorrenciaRemover");
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

test("map does not expose the camera", () => {
  expect(map).not.toContain("defineExpose");
  expect(map).toContain("placeCurrentLocation(coords.latitude, coords.longitude)");
  expect(map).toContain("jumpTo(placed.view)");
  expect(map).toContain("point.value = placed.point");
  expect(map).toContain("focusToken.value += 1");
});

test("locate button owns its busy state", async () => {
  expect(map).toContain(':disabled="locating"');
  expect(map).toContain(':aria-busy="locating"');
  expect(map).toContain("await request(");
  expect(map).not.toContain("locating: boolean");
  expect(page).not.toContain(":locating=");

  const { locating, request } = useCurrentLocation();
  const geo = deferredGeo();
  const pending = request(geo.geolocation);
  expect(locating.value).toBe(true);
  geo.succeed(-1.45, -48.49);
  await expect(pending).resolves.toEqual({
    status: "placed",
    latitude: -1.45,
    longitude: -48.49,
  });
  expect(locating.value).toBe(false);
});

test("missing geolocation uses the unavailable notice", async () => {
  expect(map).toContain('emit("locate-error", "unavailable")');
  expect(page).toContain("locateFailureNotice(reason)");
  expect(locateFailureNotice("unavailable")).toBe(mapNotices.geoUnavailable);
  expect(locateFailureNotice("unavailable").title).toBe(
    "Geolocalização não disponível no seu navegador.",
  );

  const { locating, request } = useCurrentLocation();
  await expect(request(undefined)).resolves.toEqual({ status: "unavailable" });
  expect(locating.value).toBe(false);
});

test("denied geolocation logs and emits denied", async () => {
  expect(map).toContain('emit("locate-error", "denied")');
  expect(map).toContain('console.error("Erro ao obter localização:", err)');

  const err = new Error("denied");
  const { request } = useCurrentLocation();
  const geo = deferredGeo();
  const pending = request(geo.geolocation);
  geo.fail(err);
  await expect(pending).resolves.toEqual({ status: "denied", error: err });
});

test("save without a point asks the page", () => {
  expect(createDialog).toContain('emit("missing-point")');
  expect(page).toContain("mapNotices.pointRequired");
});

test("save stays disabled without a category", () => {
  expect(createDialog).toContain(':disabled="selectedType == null"');
});

test("save closes the dialog on success", () => {
  const save = sliceFunction(page, "salvarOcorrencia");
  const closeAt = save.indexOf("modalAberto.value = false");
  expect(save).toContain("mapNotices.created");
  expect(closeAt).toBeGreaterThan(save.indexOf("finally"));
});

test("save closes the dialog on error", () => {
  const save = sliceFunction(page, "salvarOcorrencia");
  const closeAt = save.indexOf("modalAberto.value = false");
  expect(save).toContain("mapNotices.createError");
  expect(closeAt).toBeGreaterThan(save.indexOf("finally"));
});

test("page inactivates with the submitted id", () => {
  expect(page).toContain("occurrenceStore.inactive(data, id)");
  expect(page).not.toContain("ocorrenciaRemover");
  expect(closeDialog).toContain(
    "closeOccurrenceSubmission(props.occurrenceId, event.data)",
  );
});

test("each operation keeps its own loading flag", () => {
  const mine = readFileSync("pages/my-occurrences.vue", "utf8");
  const popup = readFileSync("components/map/MapPopupContent.vue", "utf8");

  expect(page).toContain(':loading="saving"');
  expect(page).toContain(':loading="closing"');
  expect(page).toContain(':liking-id="likingId"');
  expect(page).not.toContain("occurrenceStore.loading");
  expect(map).toContain(':liking="likingId === ocorrencia.id"');
  expect(popup).toContain(':aria-busy="liking"');
  expect(popup).toContain(':disabled="liking"');
  expect(mine).toContain("loadingMine");
  expect(mine).not.toContain("saving");
  expect(mine).not.toContain("likingId");
  expect(mine).not.toContain("closing");
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
