<template>
  <UModal
    v-model:open="isOpen"
    title="Criar Ocorrência"
    :close="{
      color: 'tertiary',
      variant: 'outline',
      class: 'mc-dialog__close',
      onClick: () => emit('close'),
    }"
    :ui="{
      overlay: 'mc-overlay',
      content: 'mc-dialog',
      header: 'mc-dialog__header',
      title: 'mc-dialog__title',
      body: 'mc-dialog__body',
    }"
  >
    <template #body>
      <form class="space-y-5" @submit.prevent="onSubmit">
        <UFormField label="Endereço" size="lg" readonly>
          <UInput
            :loading="carregando"
            size="lg"
            :value="address?.display_name ?? null"
            readonly
            class="w-full"
            color="tertiary"
            :ui="{ base: 'mc-field' }"
          />
          <p v-if="addressError" class="mc-note mt-2">
            Não foi possível obter o endereço, mas ainda é possível salvar a
            ocorrência.
          </p>
        </UFormField>

        <UFormField label="Categoria" required size="lg">
          <USelect
            v-model="selectedType"
            :items="typeOptions"
            class="w-full"
            placeholder="Selecione uma categoria"
            color="tertiary"
            :ui="{
              base: 'mc-field',
              content: 'mc-menu',
              item: 'mc-menu__item',
            }"
          />
        </UFormField>

        <UFormField label="Descrição do problema" size="lg">
          <UTextarea
            v-model="description"
            placeholder="Descreva a Ocorrência"
            color="tertiary"
            class="w-full"
            :maxlength="maxLength"
            aria-describedby="character-count"
            :ui="{ base: 'mc-field', trailing: 'pointer-events-none' }"
          >
            <template #trailing>
              <div
                id="character-count"
                class="absolute bottom-1 right-2 text-xs text-muted tabular-nums"
                aria-live="polite"
                role="status"
              >
                {{ description.length }}/{{ maxLength }}
              </div>
            </template>
          </UTextarea>
        </UFormField>

        <UButton
          type="submit"
          :loading="loading || carregando"
          :disabled="selectedType == null"
          color="tertiary"
          :ui="{ base: 'mc-btn' }"
          block
        >
          Salvar
        </UButton>
      </form>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useCreateOccurrence } from "~/composables/useCreateOccurrence";
import { typesErrorWhileOpen } from "~/composables/useOccurrenceTypes";
import type { IOccurrencePayload } from "~/interfaces/IOccurrencePayload";

const MAX_LENGTH = 250;

const isOpen = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  point: { lat: number; lng: number } | null;
  informToken: number;
  loading: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: IOccurrencePayload];
  "missing-point": [];
  "types-error": [];
  close: [];
}>();

const {
  description,
  selectedType,
  address,
  carregando,
  erroEndereco,
  typeOptions,
  begin,
  resetDraft,
  payload,
} = useCreateOccurrence();

const maxLength = MAX_LENGTH;
const addressError = computed(() => erroEndereco.value != null);

watch(
  () => [isOpen.value, props.informToken] as const,
  async ([open], _previous, onCleanup) => {
    let current = true;
    onCleanup(() => {
      current = false;
    });
    if (!open) {
      resetDraft();
      return;
    }
    const result = await begin(props.point);
    if (typesErrorWhileOpen(current, result)) emit("types-error");
  },
);

function onSubmit() {
  if (!props.point) {
    emit("missing-point");
    return;
  }
  const next = payload(props.point);
  if (!next) return;
  emit("submit", next);
}
</script>
