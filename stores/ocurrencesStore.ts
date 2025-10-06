// stores/ocurrenceStore.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import type { IOcurrence } from "~/interfaces/IOcurrence";
import type { IOcurrencePayload } from "~/interfaces/IOcurrencePayload";
import { useOcurrencesService } from "@/composables/ocurrencesService";
import {
  inactiveOccurrenceSchema,
  type InactivateOcurrenceSchema,
} from "~/validators/inactivateOcurrenceSchema";
import type { MyOcurrencesResponse } from "~/interfaces/responses/MyOcurrencesResponse";
import type { NuxtDebugModuleMutationRecord } from "nuxt/schema";

export const useOcurrenceStore = defineStore("ocurrences", () => {
  const ocurrences = ref<IOcurrence[]>([]);
  const loading = ref(false);
  const error = ref<any>(null);
  const myOcurrences = ref<MyOcurrencesResponse>();

  const {
    fetchOcurrences,
    createOcurrence,
    deleteOcurrence,
    getOcurrencesByUserAuth,
    inactivateOcurrence,
  } = useOcurrencesService();

  const loadOcurrences = async () => {
    loading.value = true;
    error.value = null;
    try {
      ocurrences.value = await fetchOcurrences();
    } catch (err: any) {
      error.value = err?.data || err;
    } finally {
      loading.value = false;
    }
  };

  const addOcurrence = async (payload: IOcurrencePayload) => {
    loading.value = true;
    error.value = null;
    try {
      const ocurrence = await createOcurrence(payload);
      ocurrences.value.push(ocurrence);
      return ocurrence;
    } catch (err: any) {
      error.value = err?.data || err;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const removeOcurrence = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await deleteOcurrence(id);
      ocurrences.value = ocurrences.value.filter((o) => o.id !== id);
    } catch (err: any) {
      error.value = err?.data || err;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const inactive = async (
    inactiveOcurrence: InactivateOcurrenceSchema,
    id: number
  ) => {
    console.log(inactiveOcurrence);
    loading.value = true;
    error.value = null;
    try {
      await inactivateOcurrence(inactiveOcurrence, id);
      ocurrences.value = ocurrences.value.filter((o) => o.id !== id);
    } catch (err: any) {
      error.value = err?.data || err;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const loadMyOcurrences = async (page = 1) => {
    loading.value = true;
    error.value = null;
    try {
      myOcurrences.value = await getOcurrencesByUserAuth(page);
    } catch (err: any) {
      error.value = err?.data || err;
      throw err
    } finally {
      loading.value = false;
    }
  };

  return {
    ocurrences,
    loading,
    error,
    loadOcurrences,
    addOcurrence,
    removeOcurrence,
    inactive,
    loadMyOcurrences,
    myOcurrences,
  };
});
