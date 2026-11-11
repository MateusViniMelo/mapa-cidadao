import { readonly, shallowRef } from "vue";
import type { EnderecoNominatim } from "@/interfaces/EnderecoNominatim";

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function useReverseGeocoding() {
  const carregando = shallowRef(false);
  const erroEndereco = shallowRef<string | null>(null);
  let active = 0;

  async function buscarEndereco(
    lat: number,
    lng: number,
    signal?: AbortSignal,
  ): Promise<EnderecoNominatim | undefined> {
    const id = ++active;
    carregando.value = true;
    erroEndereco.value = null;

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
      erroEndereco.value =
        error instanceof Error && error.message
          ? error.message
          : "Erro desconhecido";
    } finally {
      if (id === active) carregando.value = false;
    }
  }

  return {
    carregando: readonly(carregando),
    erroEndereco: readonly(erroEndereco),
    buscarEndereco,
  };
}
