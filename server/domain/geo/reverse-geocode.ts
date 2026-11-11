import { $fetch } from "ofetch";

export const NOMINATIM_USER_AGENT = "MapaCidadao/1.0 (mateusmelo04@gmail.com)";
const MIN_INTERVAL_MS = 1000;
const DECIMAL = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;

type Clock = {
  now: () => number;
  sleep: (ms: number) => Promise<void>;
};

type PlaceFetch = (latitude: number, longitude: number) => Promise<unknown>;

const defaultClock: Clock = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();
let nextAllowedAt = 0;

export function resetReverseGeocodeState(): void {
  cache.clear();
  inflight.clear();
  nextAllowedAt = 0;
}

function parseCoordinate(value: unknown, min: number, max: number): number | null {
  const raw = Array.isArray(value) ? (value.length === 1 ? value[0] : undefined) : value;
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw < min || raw > max) return null;
    return raw;
  }
  if (typeof raw !== "string" || !DECIMAL.test(raw.trim())) return null;

  const parsed = Number(raw.trim());
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

export function parseLatitude(value: unknown): number | null {
  return parseCoordinate(value, -90, 90);
}

export function parseLongitude(value: unknown): number | null {
  return parseCoordinate(value, -180, 180);
}

async function acquireSlot(clock: Clock): Promise<void> {
  const start = Math.max(clock.now(), nextAllowedAt);
  nextAllowedAt = start + MIN_INTERVAL_MS;
  const wait = start - clock.now();
  if (wait > 0) await clock.sleep(wait);
}

async function loadPlace(
  key: string,
  latitude: number,
  longitude: number,
  fetchPlace: PlaceFetch,
  clock: Clock,
): Promise<unknown> {
  await acquireSlot(clock);
  const body = await fetchPlace(latitude, longitude);
  cache.set(key, body);
  return body;
}

export async function reverseGeocodePoint(
  latitude: number,
  longitude: number,
  fetchPlace: PlaceFetch,
  clock: Clock = defaultClock,
): Promise<unknown> {
  const key = `${latitude},${longitude}`;
  if (cache.has(key)) return cache.get(key);

  const running = inflight.get(key);
  if (running) return running;

  const job = loadPlace(key, latitude, longitude, fetchPlace, clock);
  inflight.set(key, job);
  try {
    return await job;
  } finally {
    inflight.delete(key);
  }
}

export function fetchNominatimPlace(latitude: number, longitude: number): Promise<unknown> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));

  return $fetch(url.toString(), {
    headers: {
      "Accept-Language": "pt-BR",
      "User-Agent": NOMINATIM_USER_AGENT,
    },
  });
}
