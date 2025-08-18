// services/useOcurrencesService.ts
import type { IOcurrence } from "~/interfaces/IOcurrence";
import type { IOcurrencePayload } from "~/interfaces/IOcurrencePayload";
import { useAuthStore } from "@/stores/authStore";

export function useOcurrencesService() {
  const authStore = useAuthStore();

  const fetchOcurrences = async (): Promise<IOcurrence[]> => {
    const { ocurrences } = await $fetch<{ ocurrences: IOcurrence[] }>(
      "/api/ocurrences",
      {
        headers: {
          Authorization: authStore.token ?? "",
        },
      }
    );
    return ocurrences;
  };

  const createOcurrence = async (
    payload: IOcurrencePayload
  ): Promise<IOcurrence> => {
    const { ocurrence } = await $fetch<{ ocurrence: IOcurrence }>(
      "/api/ocurrences",
      {
        method: "POST",
        body: payload,
        headers: {
          Authorization: authStore.token ?? "",
        },
      }
    );
    return ocurrence;
  };

  const deleteOcurrence = async (id: number): Promise<void> => {
    await $fetch(`/api/ocurrences/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: authStore.token ?? "",
      },
    });
  };

  return {
    fetchOcurrences,
    createOcurrence,
    deleteOcurrence,
  };
}
