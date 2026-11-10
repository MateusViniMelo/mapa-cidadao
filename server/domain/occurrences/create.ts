import type { PrismaClient } from "generated/prisma/client";
import { findOccurrence, type ListedOccurrence } from "./list-active";

const DESCRIPTION_MAX = 250;
const ADDRESS_MAX = 500;
const UNKNOWN_TYPE = "O campo type id selecionado é inválido.";

export type OccurrenceFieldErrors = {
  description?: string[];
  address_name?: string[];
  location?: string[];
  type_id?: string[];
  city?: string[];
  state?: string[];
  country?: string[];
};

export type NormalizedOccurrence = {
  latitude: number;
  longitude: number;
  type_id: number;
  description: string;
  address_name: string;
  city: string | null;
  state: string | null;
  country: string | null;
};

export type NormalizeResult =
  | { ok: true; value: NormalizedOccurrence }
  | { ok: false; status: 422; errors: OccurrenceFieldErrors };

export function requestPoint(coordinates: [number, number]): {
  latitude: number;
  longitude: number;
} {
  return { latitude: coordinates[1], longitude: coordinates[0] };
}

export function geoJsonCoordinates(latitude: number, longitude: number): [number, number] {
  return [longitude, latitude];
}

function limitedText(
  value: unknown,
  max: number,
  field: "description" | "address_name",
  errors: OccurrenceFieldErrors,
): string {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value !== "string") {
    errors[field] = ["O campo informado é inválido."];
    return "";
  }
  if (value.length > max) {
    errors[field] = [`O campo deve ter no máximo ${max} caracteres.`];
    return "";
  }
  return value;
}

function nullableText(
  value: unknown,
  field: "city" | "state" | "country",
  errors: OccurrenceFieldErrors,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string") {
    errors[field] = ["O campo informado é inválido."];
    return null;
  }
  return value;
}

function readPoint(
  location: unknown,
  errors: OccurrenceFieldErrors,
): { latitude: number; longitude: number } | null {
  if (!location || typeof location !== "object") {
    errors.location = ["O campo location deve ser um ponto."];
    return null;
  }

  const point = location as { type?: unknown; coordinates?: unknown };
  if (point.type !== "Point" || !Array.isArray(point.coordinates) || point.coordinates.length !== 2) {
    errors.location = ["O campo location deve ser um ponto."];
    return null;
  }

  const [longitude, latitude] = point.coordinates;
  if (
    typeof longitude !== "number" ||
    typeof latitude !== "number" ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude)
  ) {
    errors.location = ["O campo location deve ser um ponto."];
    return null;
  }

  return requestPoint([longitude, latitude]);
}

function readTypeId(value: unknown, errors: OccurrenceFieldErrors): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    errors.type_id = [UNKNOWN_TYPE];
    return null;
  }
  return value;
}

export function normalizeOccurrence(body: unknown): NormalizeResult {
  const input = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const errors: OccurrenceFieldErrors = {};
  const point = readPoint(input.location, errors);
  const typeId = readTypeId(input.type_id, errors);
  const description = limitedText(input.description, DESCRIPTION_MAX, "description", errors);
  const addressName = limitedText(input.address_name, ADDRESS_MAX, "address_name", errors);
  const city = nullableText(input.city, "city", errors);
  const state = nullableText(input.state, "state", errors);
  const country = nullableText(input.country, "country", errors);

  if (Object.keys(errors).length > 0 || !point || typeId === null) {
    return { ok: false, status: 422, errors };
  }

  return {
    ok: true,
    value: {
      latitude: point.latitude,
      longitude: point.longitude,
      type_id: typeId,
      description,
      address_name: addressName,
      city,
      state,
      country,
    },
  };
}

export function firstOccurrenceError(errors: OccurrenceFieldErrors): string {
  for (const messages of Object.values(errors)) {
    if (messages && messages.length > 0) {
      return messages[0];
    }
  }

  return "Não foi possível validar a ocorrência.";
}

export type CreateResult =
  | { ok: true; status: 201; occurrence: ListedOccurrence }
  | { ok: false; status: 422; errors: OccurrenceFieldErrors };

export async function createOccurrence(
  db: PrismaClient,
  userId: number,
  body: unknown,
): Promise<CreateResult> {
  const normalized = normalizeOccurrence(body);
  if (!normalized.ok) {
    return normalized;
  }

  const type = await db.typeOccurrence.findUnique({
    where: { id: normalized.value.type_id },
  });
  if (!type) {
    return { ok: false, status: 422, errors: { type_id: [UNKNOWN_TYPE] } };
  }

  const value = normalized.value;
  const occurrence = await db.$transaction(async (tx) => {
    const inserted = await tx.$queryRaw<Array<{ id: number }>>`
      INSERT INTO occurrences (
        location, type_id, user_id, description, address_name, city, state, country
      ) VALUES (
        ST_SetSRID(ST_MakePoint(${value.longitude}::float8, ${value.latitude}::float8), 4326),
        ${value.type_id}::int,
        ${userId}::int,
        ${value.description}::text,
        ${value.address_name}::text,
        ${value.city}::text,
        ${value.state}::text,
        ${value.country}::text
      )
      RETURNING id
    `;
    const id = Number(inserted[0]?.id);
    const row = await findOccurrence(tx, id, userId);
    if (!row) {
      throw new Error("Não foi possível criar a ocorrência.");
    }
    return row;
  });

  return { ok: true, status: 201, occurrence };
}
