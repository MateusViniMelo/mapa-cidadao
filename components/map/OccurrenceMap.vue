<template>
  <div class="mc-surface">
    <div class="mc-plate relative w-full overflow-hidden">
      <MapLibreMap
        ref="mapRef"
        v-model:point="localizacaoSelecionada"
        :occurrences="occurrences"
        :user-id="authStore.user?.id ?? null"
        :locating="locating"
        @inform="openCreateModal"
        @like="onLike"
        @close="onCloseRequest"
        @locate="onLocate"
      />
      <MapLoadingOverlay v-if="loadingOccurrences" />
    </div>
  </div>

  <CreateOccurrenceModal
    v-model:open="modalAberto"
    v-model:selected-type="selectedType"
    v-model:description="descricao"
    :address="enderecoAchado"
    :loading-address="carregando"
    :address-error="erroEndereco != null"
    :type-options="typeOptions"
    :loading="occurrenceStore.loading || carregando"
    :max-length="MAX_DESCRIPTION_LENGTH"
    @submit="salvarOcorrencia"
    @close="resetCreateForm"
  />

  <CloseOccurrenceModal
    v-model:open="modalFinalizarOcorrencia"
    :loading="occurrenceStore.loading"
    @submit="onSubmitInactivateOccurrence"
    @close="resetCloseForm"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useReverseGeocoding } from "~/composables/useReverseGeocoding";
import type { EnderecoNominatim } from "~/interfaces/EnderecoNominatim";
import type { ILocationPoint } from "~/interfaces/ILocationPoint";
import type { IOccurrencePayload } from "~/interfaces/IOccurrencePayload";
import type { ITypeOccurrence } from "~/interfaces/ITypeOccurrence";
import { mapNotices } from "~/utils/mapNotices";
import { toRequestCoordinates } from "~/utils/occurrencePoint";
import type { InactivateOccurrenceSchema } from "~/validators/inactivateOccurrenceSchema";

const MAX_DESCRIPTION_LENGTH = 250;

const authStore = useAuthStore();
const occurrenceStore = useOccurrenceStore();
const { occurrences, loadingOccurrences } = storeToRefs(occurrenceStore);
const toast = useToast();
const { buscarEndereco, carregando, erroEndereco } = useReverseGeocoding();

const mapRef = ref<{
  showCurrentLocation: (latitude: number, longitude: number) => void;
} | null>(null);
const localizacaoSelecionada = ref<{ lat: number; lng: number } | null>(null);
const locating = ref(false);
const descricao = ref("");
const enderecoAchado = ref<EnderecoNominatim | null>(null);
const modalAberto = ref(false);
const modalFinalizarOcorrencia = ref(false);
const ocorrenciaRemover = ref<number | null>(null);
const types = ref<ITypeOccurrence[]>([]);
const selectedType = ref<number | undefined>(undefined);

const typeOptions = computed(() =>
  types.value.map((type) => ({
    label: type.name,
    value: type.id,
  })),
);

function resetCreateForm() {
  enderecoAchado.value = null;
  descricao.value = "";
}

function resetCloseForm() {
  ocorrenciaRemover.value = null;
}

function onCloseRequest(id: number) {
  ocorrenciaRemover.value = id;
  modalFinalizarOcorrencia.value = true;
}

async function onLike(id: number) {
  try {
    await occurrenceStore.toggleLikeOccurrence(id);
  } catch {
    toast.add(mapNotices.likeError);
  }
}

async function onSubmitInactivateOccurrence(data: InactivateOccurrenceSchema) {
  if (ocorrenciaRemover.value == null) return;

  try {
    await occurrenceStore.inactive(data, ocorrenciaRemover.value);
    modalFinalizarOcorrencia.value = false;
    resetCloseForm();
    toast.add(mapNotices.inactivated);
  } catch {
    toast.add(mapNotices.inactivateError);
  }
}

async function salvarOcorrencia() {
  if (!localizacaoSelecionada.value) {
    toast.add(mapNotices.pointRequired);
    return;
  }

  const location: ILocationPoint = {
    type: "Point",
    coordinates: toRequestCoordinates(
      localizacaoSelecionada.value.lat,
      localizacaoSelecionada.value.lng,
    ),
  };

  const occurrencePayload: IOccurrencePayload = {
    location,
    type_id: selectedType.value ?? 1,
    description: descricao.value,
    address_name: enderecoAchado.value?.display_name,
    city: enderecoAchado.value?.address.city,
    state: enderecoAchado.value?.address.state,
    country: enderecoAchado.value?.address.country,
  };

  try {
    await occurrenceStore.addOccurrence(occurrencePayload);
    toast.add(mapNotices.created);
  } catch {
    toast.add(mapNotices.createError);
  } finally {
    resetCreateForm();
    modalAberto.value = false;
  }
}

async function openCreateModal() {
  if (!authStore.user) {
    toast.add(mapNotices.loginRequired);
    return;
  }

  modalAberto.value = true;

  if (localizacaoSelecionada.value) {
    enderecoAchado.value =
      (await buscarEndereco(
        localizacaoSelecionada.value.lat,
        localizacaoSelecionada.value.lng,
      )) ?? null;
  }
}

function onLocate() {
  locating.value = true;

  const finalizar = () => {
    locating.value = false;
  };

  if (!("geolocation" in navigator)) {
    toast.add(mapNotices.geoUnavailable);
    finalizar();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      mapRef.value?.showCurrentLocation(coords.latitude, coords.longitude);
      finalizar();
    },
    (err) => {
      toast.add(mapNotices.geoDenied);
      console.error("Erro ao obter localização:", err);
      finalizar();
    },
  );
}

onMounted(async () => {
  await occurrenceStore.loadOccurrences();

  try {
    const { types_occurrence } = await $fetch<{
      types_occurrence: ITypeOccurrence[];
    }>("/api/types-occurrence");
    types.value = types_occurrence;
  } catch (error) {
    console.error("Erro ao carregar tipos de ocorrência:", error);
  }
});
</script>

<style>
/*
  Superfície do mapa. O índigo de ação vem de --ui-tertiary.
  Cartões invertem no escuro; o botão permanece o acento.
*/
:root {
  --mc-paper: oklch(0.975 0.006 275);
  --mc-paper-deep: oklch(0.955 0.008 275);
  --mc-ink: oklch(0.27 0.03 275);
  --mc-ink-soft: oklch(0.48 0.025 275);
  --mc-urucum: oklch(0.55 0.19 28);
  --mc-urucum-deep: oklch(0.48 0.17 27);
  --mc-tucupi: oklch(0.86 0.15 92);
  --mc-rule: color-mix(in oklch, var(--mc-ink) 14%, transparent);
  --mc-frame: transparent;
  --mc-card: oklch(0.995 0.003 275);
  --mc-shadow: 0 10px 28px oklch(0.28 0.04 275 / 0.16);
  --mc-accent: var(--ui-tertiary);
  --mc-accent-hover: var(--ui-color-tertiary-700);
  --mc-on-accent: oklch(0.985 0.006 275);
  --mc-font: var(--font-sans), ui-sans-serif, "Segoe UI", sans-serif;
  --mc-ease: cubic-bezier(0.16, 1, 0.3, 1);
  --mc-radius: 1rem;
}

.dark {
  --mc-paper: oklch(0.2 0.02 275);
  --mc-paper-deep: oklch(0.17 0.02 275);
  --mc-ink: oklch(0.96 0.01 275);
  --mc-ink-soft: oklch(0.78 0.02 275);
  --mc-rule: color-mix(in oklch, var(--mc-ink) 16%, transparent);
  --mc-card: oklch(0.26 0.025 275);
  --mc-shadow: 0 12px 32px oklch(0.08 0.02 275 / 0.5);
  --mc-accent-hover: var(--ui-color-tertiary-400);
}

.mc-surface {
  padding: 0;
  background: var(--mc-paper);
}

.mc-plate {
  height: max(30rem, calc(100svh - 4rem));
  min-height: 30rem;
  background: var(--mc-paper);
  border: 0;
  border-radius: 0;
  box-shadow: none;
  isolation: isolate;
}
</style>
