// services/useOcurrencesService.ts
import type { IOcurrence } from "~/interfaces/IOcurrence";
import type { IOcurrencePayload } from "~/interfaces/IOcurrencePayload";
import { useAuthStore } from "@/stores/authStore";
import type { InactivateOcurrenceSchema } from "~/validators/inactivateOcurrenceSchema";

export function useOcurrencesService() {
  const authStore = useAuthStore();
  const config = useRuntimeConfig();
  const baseURL = config.public.apiBase;

  const fetchOcurrences = async (): Promise<IOcurrence[]> => {
    const { ocurrences } = await $fetch<{ ocurrences: IOcurrence[] }>(
      "ocurrences",
      {
        headers: {
          Authorization: authStore.token ? `bearer ${authStore.token}` : "",
        },
        baseURL,
      }
    );
    return ocurrences;
  };

  const createOcurrence = async (
    payload: IOcurrencePayload
  ): Promise<IOcurrence> => {
    const { ocurrence } = await $fetch<{ ocurrence: IOcurrence }>(
      "ocurrences",
      {
        method: "POST",
        body: payload,
        headers: {
          Authorization: authStore.token ? `bearer ${authStore.token}` : "",
        },
        baseURL,
      }
    );
    return ocurrence;
  };

  const deleteOcurrence = async (id: number): Promise<void> => {
    await $fetch(`ocurrences/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: authStore.token ? `bearer ${authStore.token}` : "",
      },
      baseURL,
    });
  };

  const inactivateOcurrence = async (
    inactiveOcurrence: InactivateOcurrenceSchema,
    id: number
  ) => {
    await $fetch(`ocurrences/inactivate/${id}`, {
      method: "POST",
      body: inactiveOcurrence,
      headers: {
        Authorization: authStore.token ? `bearer ${authStore.token}` : "",
      },
      baseURL,
    });
  };

  return {
    fetchOcurrences,
    createOcurrence,
    deleteOcurrence,

    inactivateOcurrence,
  };
}
