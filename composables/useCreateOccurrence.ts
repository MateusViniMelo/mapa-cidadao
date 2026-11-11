import { readonly, shallowRef } from "vue";
import type { EnderecoNominatim } from "@/interfaces/EnderecoNominatim";
import type { IOccurrencePayload } from "@/interfaces/IOccurrencePayload";
import { buildOccurrencePayload } from "@/utils/occurrencePayload";
import { useOccurrenceTypes } from "./useOccurrenceTypes";
import { useReverseGeocoding } from "./useReverseGeocoding";

export function useCreateOccurrence() {
  const description = shallowRef("");
  const selectedType = shallowRef<number | undefined>(undefined);
  const address = shallowRef<EnderecoNominatim | null>(null);
  const geocoding = useReverseGeocoding();
  const catalog = useOccurrenceTypes();
  let controller: AbortController | null = null;
  let session = 0;

  function resetDraft() {
    session += 1;
    controller?.abort();
    controller = null;
    address.value = null;
    description.value = "";
  }

  async function begin(point: { lat: number; lng: number } | null) {
    const ticket = session;
    let next: AbortController | null = null;
    if (point) {
      controller?.abort();
      next = new AbortController();
      controller = next;
      address.value = null;
    }

    const typesResult = await catalog.ensureLoaded();
    if (ticket !== session || !point || !next || controller !== next) return typesResult;

    const found = await geocoding.lookupAddress(point.lat, point.lng, next.signal);
    if (ticket !== session || controller !== next || next.signal.aborted) return typesResult;
    address.value = found ?? null;
    return typesResult;
  }

  function payload(point: { lat: number; lng: number } | null): IOccurrencePayload | null {
    return buildOccurrencePayload({
      point,
      typeId: selectedType.value,
      description: description.value,
      address: address.value,
    });
  }

  return {
    description,
    selectedType,
    address: readonly(address),
    loadingAddress: geocoding.loadingAddress,
    addressError: geocoding.addressError,
    typeOptions: catalog.typeOptions,
    begin,
    resetDraft,
    payload,
  };
}
