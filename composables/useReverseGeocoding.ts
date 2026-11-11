import { readonly, shallowRef } from "vue";
import type { EnderecoNominatim } from "@/interfaces/EnderecoNominatim";

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function useReverseGeocoding() {
  const loadingAddress = shallowRef(false);
  const addressError = shallowRef<string | null>(null);
  let active = 0;

  async function lookupAddress(
    lat: number,
    lng: number,
    signal?: AbortSignal,
  ): Promise<EnderecoNominatim | undefined> {
    const id = ++active;
    loadingAddress.value = true;
    addressError.value = null;

    try {
      const res = await fetch(`/api/reverse-geocoding?lat=${lat}&lng=${lng}`, {
        signal,
      });
      if (id !== active || signal?.aborted) return;
      if (!res.ok) throw new Error("Erro ao buscar endereço");
      const data = (await res.json()) as EnderecoNominatim;
      if (id !== active || signal?.aborted) return;
      return data;
    } catch (error: unknown) {
      if (isAbort(error) || signal?.aborted || id !== active) return;
      addressError.value =
        error instanceof Error && error.message
          ? error.message
          : "Erro desconhecido";
    } finally {
      if (id === active) loadingAddress.value = false;
    }
  }

  return {
    loadingAddress: readonly(loadingAddress),
    addressError: readonly(addressError),
    lookupAddress,
  };
}
