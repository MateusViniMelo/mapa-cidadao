// stores/occurrenceStore.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import type { IOccurrence } from "~/interfaces/IOccurrence";
import type { IOccurrencePayload } from "~/interfaces/IOccurrencePayload";
import { useOccurrencesService } from "@/composables/occurrencesService";
import {
  inactiveOccurrenceSchema,
  type InactivateOccurrenceSchema,
} from "~/validators/inactivateOccurrenceSchema";
import type { MyOccurrencesResponse } from "~/interfaces/responses/MyOccurrencesResponse";
import type { NuxtDebugModuleMutationRecord } from "nuxt/schema";

export const useOccurrenceStore = defineStore("occurrences", () => {
  const occurrences = ref<IOccurrence[]>([]);
  const loading = ref(false);
  /** Somente para listagem no mapa (evita misturar com loading de criar/like/inativar). */
  const loadingOccurrences = ref(false);
  const error = ref<any>(null);
  const myOccurrences = ref<MyOccurrencesResponse>();

  const {
    fetchOccurrences,
    createOccurrence,
    deleteOccurrence,
    getOccurrencesByUserAuth,
    inactivateOccurrence,
    likeOrDislike,
  } = useOccurrencesService();

  const loadOccurrences = async () => {
    loadingOccurrences.value = true;
    error.value = null;
    try {
      occurrences.value = await fetchOccurrences();
    } catch (err: any) {
      error.value = err?.data || err;
    } finally {
      loadingOccurrences.value = false;
    }
  };

  const addOccurrence = async (payload: IOccurrencePayload) => {
    loading.value = true;
    error.value = null;
    try {
      const occurrence = await createOccurrence(payload);
      occurrences.value.push(occurrence);
      return occurrence;
    } catch (err: any) {
      error.value = err?.data || err;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const removeOccurrence = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await deleteOccurrence(id);
      occurrences.value = occurrences.value.filter((o) => o.id !== id);
    } catch (err: any) {
      error.value = err?.data || err;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const inactive = async (
    inactiveOccurrence: InactivateOccurrenceSchema,
    id: number
  ) => {
    loading.value = true;
    error.value = null;
    try {
      await inactivateOccurrence(inactiveOccurrence, id);
      occurrences.value = occurrences.value.filter((o) => o.id !== id);
    } catch (err: any) {
      error.value = err?.data || err;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const loadMyOccurrences = async (page = 1) => {
    loading.value = true;
    error.value = null;
    try {
      myOccurrences.value = await getOccurrencesByUserAuth(page);
    } catch (err: any) {
      error.value = err?.data || err;
      throw err;
    } finally {
      loading.value = false;
    }
  };
  const toggleLikeOccurrence = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      const updatedOccurrence = await likeOrDislike(id);
      if (!updatedOccurrence) return;

      // substitui a ocorrência na lista
      const index = occurrences.value.findIndex(
        (o) => o.id === updatedOccurrence.id
      );
      if (index !== -1) {
        occurrences.value[index] = updatedOccurrence;
      } else {
        // se não existir na lista, adiciona
        occurrences.value.push(updatedOccurrence);
      }

      return updatedOccurrence;
    } catch (err: any) {
      error.value = err?.data || err;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    occurrences,
    loading,
    loadingOccurrences,
    error,
    loadOccurrences,
    addOccurrence,
    removeOccurrence,
    inactive,
    loadMyOccurrences,
    myOccurrences,
    toggleLikeOccurrence,
  };
});
