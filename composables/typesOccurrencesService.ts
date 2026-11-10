// services/useOccurrencesService.ts

import type { ITypeOccurrence } from "~/interfaces/ITypeOccurrence";

export function useTypesOccurrencesService() {
  const config = useRuntimeConfig();
  const baseURL = config.public.apiBase;
  const fetchTypesOccurrence = async (): Promise<ITypeOccurrence[]> => {
    const { types_occurrence } = await $fetch<{
      types_occurrence: ITypeOccurrence[];
    }>("/types-occurrence", { baseURL });
    return types_occurrence;
  };

  return {
    fetchTypesOccurrence,
  };
}
