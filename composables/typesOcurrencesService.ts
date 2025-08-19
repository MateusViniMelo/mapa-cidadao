// services/useOcurrencesService.ts

import type { ITypeOcurrence } from "~/interfaces/ITypeOcurrence";

export function useTypesOcurrencesService() {
  const config = useRuntimeConfig();
  const baseURL = config.public.apiBase;
  const fetchTypesOcurrence = async (): Promise<ITypeOcurrence[]> => {
    const { types_ocurrence } = await $fetch<{
      types_ocurrence: ITypeOcurrence[];
    }>("/types-ocurrence", { baseURL });
    return types_ocurrence;
  };

  return {
    fetchTypesOcurrence,
  };
}
