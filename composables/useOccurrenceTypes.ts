import { computed, shallowRef } from "vue";
import type { ITypeOccurrence } from "@/interfaces/ITypeOccurrence";

export function typesErrorWhileOpen(
  current: boolean,
  result: "ok" | "error",
): boolean {
  return current && result === "error";
}

export function useOccurrenceTypes() {
  const types = shallowRef<ITypeOccurrence[]>([]);
  let loaded = false;
  let pending: Promise<"ok" | "error"> | null = null;

  async function load(): Promise<"ok" | "error"> {
    try {
      const res = await fetch("/api/types-occurrence");
      if (!res.ok) throw new Error("Erro ao carregar tipos de ocorrência");
      const body = (await res.json()) as { types_occurrence: ITypeOccurrence[] };
      types.value = body.types_occurrence;
      loaded = true;
      return "ok";
    } catch (error) {
      loaded = false;
      console.error("Erro ao carregar tipos de ocorrência:", error);
      return "error";
    }
  }

  function ensureLoaded(): Promise<"ok" | "error"> {
    if (loaded) return Promise.resolve("ok");
    if (pending) return pending;
    pending = load().finally(() => {
      pending = null;
    });
    return pending;
  }

  const typeOptions = computed(() =>
    types.value.map((type) => ({
      label: type.name,
      value: type.id,
    })),
  );

  return { typeOptions, ensureLoaded };
}
