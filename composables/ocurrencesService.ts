// services/useOcurrencesService.ts
import type { IOcurrence } from "~/interfaces/IOcurrence";
import type { IOcurrencePayload } from "~/interfaces/IOcurrencePayload";
import { useAuthStore } from "@/stores/authStore";
import type { InactivateOcurrenceSchema } from "~/validators/inactivateOcurrenceSchema";
import type { MyOcurrencesResponse } from "~/interfaces/responses/MyOcurrencesResponse";

export function useOcurrencesService() {
  const authStore = useAuthStore();
  const config = useRuntimeConfig();
  const baseURL = config.public.apiBase;

  const fetchOcurrences = async (): Promise<IOcurrence[]> => {
    try {
      const uri = authStore.token ? "ocurrences" : "ocurrences";
      const { ocurrences } = await $fetch<{ ocurrences: IOcurrence[] }>(uri, {
        headers: {
          Authorization: authStore.token ? `bearer ${authStore.token}` : "",
        },
        baseURL,
      });
      return ocurrences;
    } catch (error) {
      console.error("Erro ao buscar ocorrências:", error);
      throw new Error("Não foi possível buscar as ocorrências.");
    }
  };

  const createOcurrence = async (
    payload: IOcurrencePayload
  ): Promise<IOcurrence> => {
    try {
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
    } catch (error) {
      console.error("Erro ao criar ocorrência:", error);
      throw new Error("Não foi possível criar a ocorrência.");
    }
  };

  const deleteOcurrence = async (id: number): Promise<void> => {
    try {
      await $fetch(`ocurrences/${id}`, {
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

  const inactivateOcurrence = async (
    inactiveOcurrence: InactivateOcurrenceSchema,
    id: number
  ): Promise<void> => {
    try {
      await $fetch(`ocurrences/inactivate/${id}`, {
        method: "POST",
        body: inactiveOcurrence,
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

  const getOcurrencesByUserAuth = async (
    page: number
  ): Promise<MyOcurrencesResponse> => {
    try {
      return await $fetch<MyOcurrencesResponse>(
        `ocurrences/my-ocurrences?page=${page}`,
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

  const likeOrDislike = async (id: number): Promise<IOcurrence | null> => {
    try {
      const { ocurrence } = await $fetch<{ ocurrence: IOcurrence }>(
        `ocurrences/like/${id}`,
        {
          headers: {
            Authorization: authStore.token ? `bearer ${authStore.token}` : "",
          },
          baseURL,
        }
      );

      return ocurrence;
    } catch (error) {
      console.error(`Erro ao dar like/dislike na ocorrência ${id}:`, error);
      throw new Error("Não foi possível atualizar o like da ocorrência.");
    }
  };

  return {
    fetchOcurrences,
    createOcurrence,
    deleteOcurrence,
    inactivateOcurrence,
    getOcurrencesByUserAuth,
    likeOrDislike,
  };
}
