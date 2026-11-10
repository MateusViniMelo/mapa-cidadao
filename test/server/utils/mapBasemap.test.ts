import { expect, test } from "vitest";
import {
  CURRENT_LOCATION_ZOOM,
  MAP_CENTER,
  MAP_ZOOM,
  currentLocationView,
  occurrenceLngLat,
  rasterStyle,
} from "../../../utils/mapBasemap";

const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

test("voyager raster", () => {
  const style = rasterStyle("chave-teste");
  const source = style.sources.basemap;

  expect(source.tiles[0]).toBe(
    "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=chave-teste",
  );
  expect(source.tileSize).toBe(256);
  expect(source.maxzoom).toBe(20);
  expect(source.attribution).toBe(CARTO_ATTRIBUTION);
});

test("openstreetmap raster", () => {
  const style = rasterStyle("");
  const source = style.sources.basemap;

  expect(source.tiles[0]).toBe("https://tile.openstreetmap.org/{z}/{x}/{y}.png");
  expect(source.tileSize).toBe(256);
  expect(source.maxzoom).toBe(19);
  expect(source.attribution).toBe(OSM_ATTRIBUTION);
});

test("opens at Belem", () => {
  expect(MAP_CENTER).toEqual([-48.49, -1.45]);
  expect(MAP_ZOOM).toBe(13);
});

test("current location zoom", () => {
  expect(currentLocationView(-1.455, -48.503)).toEqual({
    center: [-48.503, -1.455],
    zoom: CURRENT_LOCATION_ZOOM,
  });
  expect(CURRENT_LOCATION_ZOOM).toBe(16);
});

test("geojson longitude first", () => {
  expect(occurrenceLngLat([-46.633308, -23.55052])).toEqual([-46.633308, -23.55052]);
});
