// services/useOccurrencesService.ts
import type { IOccurrence } from "~/interfaces/IOccurrence";
import type { IOccurrencePayload } from "~/interfaces/IOccurrencePayload";
import { useAuthStore } from "@/stores/authStore";
import type { InactivateOccurrenceSchema } from "~/validators/inactivateOccurrenceSchema";
import type { MyOccurrencesResponse } from "~/interfaces/responses/MyOccurrencesResponse";

export function useOccurrencesService() {
  const authStore = useAuthStore();
  const config = useRuntimeConfig();
  const baseURL = config.public.apiBase;

  const fetchOccurrences = async (): Promise<IOccurrence[]> => {
    try {
      const uri = authStore.token ? "occurrences" : "occurrences";
      const { occurrences } = await $fetch<{ occurrences: IOccurrence[] }>(uri, {
        headers: {
          Authorization: authStore.token ? `bearer ${authStore.token}` : "",
        },
        baseURL,
      });
      return occurrences;
    } catch (error) {
      console.error("Erro ao buscar ocorrências:", error);
      throw new Error("Não foi possível buscar as ocorrências.");
    }
  };

  const createOccurrence = async (
    payload: IOccurrencePayload
  ): Promise<IOccurrence> => {
    try {
      const { occurrence } = await $fetch<{ occurrence: IOccurrence }>(
        "occurrences",
        {
          method: "POST",
          body: payload,
          headers: {
            Authorization: authStore.token ? `bearer ${authStore.token}` : "",
          },
          baseURL,
        }
      );
      return occurrence;
    } catch (error) {
      console.error("Erro ao criar ocorrência:", error);
      throw new Error("Não foi possível criar a ocorrência.");
    }
  };

  const deleteOccurrence = async (id: number): Promise<void> => {
    try {
      await $fetch(`occurrences/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: authStore.token ? `bearer ${authStore.token}` : "",
        },
        baseURL,
      });
    } catch (error) {
      console.error(`Erro ao deletar ocorrência ${id}:`, error);
      throw new Error("Não foi possível deletar a ocorrência.");
    }
  };

  const inactivateOccurrence = async (
    inactiveOccurrence: InactivateOccurrenceSchema,
    id: number
  ): Promise<void> => {
    try {
      await $fetch(`occurrences/inactivate/${id}`, {
        method: "POST",
        body: inactiveOccurrence,
        headers: {
          Authorization: authStore.token ? `bearer ${authStore.token}` : "",
        },
        baseURL,
      });
    } catch (error) {
      console.error(`Erro ao inativar ocorrência ${id}:`, error);
      throw new Error("Não foi possível inativar a ocorrência.");
    }
  };

  const getOccurrencesByUserAuth = async (
    page: number
  ): Promise<MyOccurrencesResponse> => {
    try {
      return await $fetch<MyOccurrencesResponse>(
        `occurrences/my-occurrences?page=${page}`,
        {
          headers: {
            Authorization: authStore.token ? `bearer ${authStore.token}` : "",
          },
          baseURL,
        }
      );
    } catch (error) {
      console.error("Erro ao buscar ocorrências do usuário:", error);
      throw new Error("Não foi possível buscar suas ocorrências.");
    }
  };

  const likeOrDislike = async (id: number): Promise<IOccurrence | null> => {
    try {
      const { occurrence } = await $fetch<{ occurrence: IOccurrence }>(
        `occurrences/like/${id}`,
        {
          headers: {
            Authorization: authStore.token ? `bearer ${authStore.token}` : "",
          },
          baseURL,
        }
      );

      return occurrence;
    } catch (error) {
      console.error(`Erro ao dar like/dislike na ocorrência ${id}:`, error);
      throw new Error("Não foi possível atualizar o like da ocorrência.");
    }
  };

  return {
    fetchOccurrences,
    createOccurrence,
    deleteOccurrence,
    inactivateOccurrence,
    getOccurrencesByUserAuth,
    likeOrDislike,
  };
}
