<template>
  <div class="mc-surface">
    <div class="mc-plate relative w-full overflow-hidden">
      <MapLibreMap
        v-model:point="selectedPoint"
        :occurrences="occurrences"
        :user-id="authStore.user?.id ?? null"
        :liking-id="likingId"
        @inform="openCreateModal"
        @like="onLike"
        @close="onCloseRequest"
        @locate-error="onLocateError"
      />
      <MapLoadingOverlay v-if="loadingOccurrences" />
    </div>
  </div>

  <CreateOccurrenceModal
    v-model:open="createOpen"
    :point="selectedPoint"
    :inform-token="informToken"
    :loading="saving"
    @submit="saveOccurrence"
    @missing-point="onMissingPoint"
    @types-error="onTypesError"
  />

  <CloseOccurrenceModal
    v-model:open="closeOpen"
    :occurrence-id="occurrenceToClose"
    :loading="closing"
    @submit="onSubmitInactivateOccurrence"
    @close="onCloseFinished"
  />
</template>

<script setup lang="ts">
import { onMounted, ref, shallowRef } from "vue";
import type { IOccurrencePayload } from "~/interfaces/IOccurrencePayload";
import { locateFailureNotice, mapNotices } from "~/utils/mapNotices";
import type { InactivateOccurrenceSchema } from "~/validators/inactivateOccurrenceSchema";

const authStore = useAuthStore();
const occurrenceStore = useOccurrenceStore();
const { occurrences, loadingOccurrences, saving, closing, likingId } =
  storeToRefs(occurrenceStore);
const toast = useToast();

const selectedPoint = ref<{ lat: number; lng: number } | null>(null);
const informToken = shallowRef(0);
const createOpen = ref(false);
const closeOpen = ref(false);
const occurrenceToClose = shallowRef<number | null>(null);

function onCloseRequest(id: number) {
  occurrenceToClose.value = id;
  closeOpen.value = true;
}

function onCloseFinished() {
  occurrenceToClose.value = null;
}

async function onLike(id: number) {
  try {
    await occurrenceStore.toggleLikeOccurrence(id);
  } catch {
    toast.add(mapNotices.likeError);
  }
}

async function onSubmitInactivateOccurrence(
  submission: InactivateOccurrenceSchema & { id: number },
) {
  const { id, ...data } = submission;

  try {
    await occurrenceStore.inactive(data, id);
    closeOpen.value = false;
    onCloseFinished();
    toast.add(mapNotices.inactivated);
  } catch {
    toast.add(mapNotices.inactivateError);
  }
}

async function saveOccurrence(payload: IOccurrencePayload) {
  try {
    await occurrenceStore.addOccurrence(payload);
    toast.add(mapNotices.created);
  } catch {
    toast.add(mapNotices.createError);
  } finally {
    createOpen.value = false;
  }
}

function openCreateModal() {
  if (!authStore.user) {
    toast.add(mapNotices.loginRequired);
    return;
  }

  createOpen.value = true;
  informToken.value += 1;
}

function onMissingPoint() {
  toast.add(mapNotices.pointRequired);
}

function onTypesError() {
  toast.add(mapNotices.typesError);
}

function onLocateError(reason: "unavailable" | "denied") {
  toast.add(locateFailureNotice(reason));
}

onMounted(async () => {
  await occurrenceStore.loadOccurrences();
});
</script>

<style>
.mc-surface {
  padding: 0;
  background: var(--mc-paper);
}

.mc-plate {
  height: max(30rem, calc(100svh - 4rem - 1px));
  min-height: 30rem;
  background: var(--mc-paper);
  border: 0;
  border-radius: 0;
  box-shadow: none;
  isolation: isolate;
}
</style>
