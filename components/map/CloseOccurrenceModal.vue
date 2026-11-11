<template>
  <UModal
    v-model:open="isOpen"
    title="Encerrar Ocorrência"
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
      <UForm
        :schema="inactiveOccurrenceSchema"
        :state="state"
        class="space-y-5"
        @submit="onSubmit"
      >
        <div class="flex flex-col gap-5 sm:flex-row sm:gap-4">
          <UFormField
            label="Qual o motivo do encerramento?"
            required
            size="lg"
            name="type_closure"
            class="w-full"
          >
            <USelect
              v-model="state.type_closure"
              placeholder="Escolha o tipo"
              :items="closureTypeOptions"
              class="w-full"
              :ui="{
                base: 'mc-field',
                content: 'mc-menu',
                item: 'mc-menu__item',
              }"
            />
          </UFormField>

          <UFormField
            v-if="showDateField"
            :label="resolutionDateLabel"
            name="resolution_date"
            class="w-full"
            size="lg"
          >
            <UInput
              v-model="state.resolution_date"
              color="tertiary"
              class="w-full"
              type="date"
              :ui="{ base: 'mc-field' }"
            />
          </UFormField>
        </div>

        <UFormField
          v-if="showDateField"
          label="Descreva o motivo?"
          size="lg"
          name="solution_description"
          required
        >
          <UTextarea
            v-model="state.solution_description"
            color="tertiary"
            class="w-full"
            :maxlength="500"
            aria-describedby="closure-character-count"
            :ui="{ base: 'mc-field', trailing: 'pointer-events-none' }"
          >
            <template #trailing>
              <div
                id="closure-character-count"
                class="absolute bottom-1 right-2 text-xs text-muted tabular-nums"
                aria-live="polite"
                role="status"
              >
                {{ state.solution_description?.length ?? 0 }}/500
              </div>
            </template>
          </UTextarea>
        </UFormField>

        <UButton
          type="submit"
          color="error"
          :ui="{ base: 'mc-btn mc-btn--danger' }"
          :loading="loading"
          block
        >
          Encerrar
        </UButton>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { CLOSURE_TYPE_OPTIONS } from "~/constants/occurrenceClosure";
import { TypeOccurrenceClosure } from "~/enums/TypeOccurrenceClosure";
import {
  inactiveOccurrenceSchema,
  type InactivateOccurrenceSchema,
} from "~/validators/inactivateOccurrenceSchema";
import { closeOccurrenceSubmission } from "~/utils/occurrencePayload";

const isOpen = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  occurrenceId: number | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  submit: [submission: InactivateOccurrenceSchema & { id: number }];
  close: [];
}>();

const closureTypeOptions = CLOSURE_TYPE_OPTIONS;

const state = reactive<Partial<InactivateOccurrenceSchema>>({
  type_closure: TypeOccurrenceClosure.RESOLVED,
  solution_description: undefined,
  resolution_date: undefined,
});

function reset() {
  state.type_closure = TypeOccurrenceClosure.RESOLVED;
  state.solution_description = undefined;
  state.resolution_date = undefined;
}

watch(isOpen, (open) => {
  if (!open) reset();
});

const showDateField = computed(
  () =>
    state.type_closure === TypeOccurrenceClosure.OTHER ||
    state.type_closure === TypeOccurrenceClosure.RESOLVED,
);

const resolutionDateLabel = computed(() =>
  state.type_closure === TypeOccurrenceClosure.RESOLVED
    ? "Data de solução do problema?"
    : "Data de quando aconteceu?",
);

function onSubmit(event: FormSubmitEvent<InactivateOccurrenceSchema>) {
  if (props.occurrenceId == null) return;
  emit("submit", closeOccurrenceSubmission(props.occurrenceId, event.data));
}
</script>
