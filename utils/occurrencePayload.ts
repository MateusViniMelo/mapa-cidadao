import type { EnderecoNominatim } from "@/interfaces/EnderecoNominatim";
import type { IOccurrencePayload } from "@/interfaces/IOccurrencePayload";
import type { InactivateOccurrenceSchema } from "@/validators/inactivateOccurrenceSchema";
import { toRequestCoordinates } from "@/utils/occurrencePoint";

export function buildOccurrencePayload(input: {
  point: { lat: number; lng: number } | null;
  typeId: number | undefined;
  description: string;
  address: EnderecoNominatim | null;
}): IOccurrencePayload | null {
  if (!input.point || input.typeId == null) return null;

  return {
    location: {
      type: "Point",
      coordinates: toRequestCoordinates(input.point.lat, input.point.lng),
    },
    type_id: input.typeId,
    description: input.description,
    address_name: input.address?.display_name,
    city: input.address?.address.city,
    state: input.address?.address.state,
    country: input.address?.address.country,
  };
}

export function closeOccurrenceSubmission(
  occurrenceId: number,
  data: InactivateOccurrenceSchema,
): InactivateOccurrenceSchema & { id: number } {
  return { id: occurrenceId, ...data };
}
