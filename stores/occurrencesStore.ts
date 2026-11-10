import { defineStore } from "pinia";
import { ref } from "vue";
import type { IOccurrence } from "~/interfaces/IOccurrence";
import type { IOccurrencePayload } from "~/interfaces/IOccurrencePayload";
import type { InactivateOccurrenceSchema } from "~/validators/inactivateOccurrenceSchema";
import type { MyOccurrencesResponse } from "~/interfaces/responses/MyOccurrencesResponse";

export const useOccurrenceStore = defineStore("occurrences", () => {
  const occurrences = ref<IOccurrence[]>([]);
  const loading = ref(false);
  const loadingOccurrences = ref(false);
  const error = ref<any>(null);
  const myOccurrences = ref<MyOccurrencesResponse>();

  const loadOccurrences = async () => {
    loadingOccurrences.value = true;
    error.value = null;
    try {
      const { occurrences: rows } = await $fetch<{ occurrences: IOccurrence[] }>(
        "/api/occurrences",
      );
      occurrences.value = rows;
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
      const { occurrence } = await $fetch<{ occurrence: IOccurrence }>("/api/occurrences", {
        method: "POST",
        body: payload,
      });
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
      await $fetch(`/api/occurrences/${id}`, { method: "DELETE" });
      occurrences.value = occurrences.value.filter((o) => o.id !== id);
    } catch (err: any) {
      error.value = err?.data || err;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const inactive = async (inactiveOccurrence: InactivateOccurrenceSchema, id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await $fetch(`/api/occurrences/inactivate/${id}`, {
        method: "POST",
        body: inactiveOccurrence,
      });
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
      myOccurrences.value = await $fetch<MyOccurrencesResponse>(
        `/api/occurrences/my-occurrences?page=${page}`,
      );
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
      const { occurrence } = await $fetch<{ occurrence: IOccurrence | null }>(
        `/api/occurrences/like/${id}`,
      );
      if (!occurrence) return;

      const index = occurrences.value.findIndex((o) => o.id === occurrence.id);
      if (index !== -1) {
        occurrences.value[index] = occurrence;
      } else {
        occurrences.value.push(occurrence);
      }

      return occurrence;
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
