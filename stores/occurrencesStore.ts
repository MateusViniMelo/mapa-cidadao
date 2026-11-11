import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";
import type { IOccurrence } from "~/interfaces/IOccurrence";
import type { IOccurrencePayload } from "~/interfaces/IOccurrencePayload";
import type { InactivateOccurrenceSchema } from "~/validators/inactivateOccurrenceSchema";
import type { MyOccurrencesResponse } from "~/interfaces/responses/MyOccurrencesResponse";

export const useOccurrenceStore = defineStore("occurrences", () => {
  const occurrences = ref<IOccurrence[]>([]);
  const loadingOccurrences = ref(false);
  const saving = shallowRef(false);
  const likingId = shallowRef<number | null>(null);
  const closing = shallowRef(false);
  const loadingMine = shallowRef(false);
  const myOccurrences = ref<MyOccurrencesResponse>();

  const loadOccurrences = async () => {
    loadingOccurrences.value = true;
    try {
      const { occurrences: rows } = await $fetch<{ occurrences: IOccurrence[] }>(
        "/api/occurrences",
      );
      occurrences.value = rows;
    } catch {
      return;
    } finally {
      loadingOccurrences.value = false;
    }
  };

  const addOccurrence = async (payload: IOccurrencePayload) => {
    saving.value = true;
    try {
      const { occurrence } = await $fetch<{ occurrence: IOccurrence }>("/api/occurrences", {
        method: "POST",
        body: payload,
      });
      occurrences.value.push(occurrence);
      return occurrence;
    } finally {
      saving.value = false;
    }
  };

  const inactive = async (inactiveOccurrence: InactivateOccurrenceSchema, id: number) => {
    closing.value = true;
    try {
      await $fetch(`/api/occurrences/inactivate/${id}`, {
        method: "POST",
        body: inactiveOccurrence,
      });
      occurrences.value = occurrences.value.filter((o) => o.id !== id);
    } finally {
      closing.value = false;
    }
  };

  const loadMyOccurrences = async (page = 1) => {
    loadingMine.value = true;
    try {
      myOccurrences.value = await $fetch<MyOccurrencesResponse>(
        `/api/occurrences/my-occurrences?page=${page}`,
      );
    } finally {
      loadingMine.value = false;
    }
  };

  const toggleLikeOccurrence = async (id: number) => {
    if (likingId.value != null) return;
    likingId.value = id;
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
    } finally {
      if (likingId.value === id) likingId.value = null;
    }
  };

  return {
    occurrences,
    loadingOccurrences,
    saving,
    likingId,
    closing,
    loadingMine,
    loadOccurrences,
    addOccurrence,
    inactive,
    loadMyOccurrences,
    myOccurrences,
    toggleLikeOccurrence,
  };
});
