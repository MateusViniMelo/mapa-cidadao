const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export const MAP_CENTER: [number, number] = [-48.49, -1.45];
export const MAP_ZOOM = 13;
export const CURRENT_LOCATION_ZOOM = 16;

export function rasterStyle(cartoApiKey: string) {
  const carto = cartoApiKey.length > 0;

  return {
    version: 8 as const,
    sources: {
      basemap: {
        type: "raster" as const,
        tiles: [
          carto
            ? `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${cartoApiKey}`
            : "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution: carto ? CARTO_ATTRIBUTION : OSM_ATTRIBUTION,
        maxzoom: carto ? 20 : 19,
      },
    },
    layers: [
      {
        id: "basemap",
        type: "raster" as const,
        source: "basemap",
      },
    ],
  };
}

export function currentLocationView(latitude: number, longitude: number) {
  return {
    center: [longitude, latitude] as [number, number],
    zoom: CURRENT_LOCATION_ZOOM,
  };
}

export function occurrenceLngLat(
  coordinates: [number, number],
): [number, number] {
  return [coordinates[0], coordinates[1]];
}
