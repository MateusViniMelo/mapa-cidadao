<template>
  <UModal
    v-model:open="isOpen"
    title="Encerrar Ocorrência"
    :close="{ onClick: resetAndClose }"
  >
    <template #body>
      <UForm
        :schema="inactiveOccurrenceSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="flex justify-between space-x-4">
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
            />
          </UFormField>

          <UFormField
            v-if="showDateField"
            :label="
              state.type_closure === 'resolved'
                ? 'Data de solução do problema?'
                : 'Data de quando aconteceu?'
            "
            name="resolution_date"
            class="w-full"
            size="lg"
          >
            <UInput
              v-model="state.resolution_date"
              color="tertiary"
              class="w-full"
              type="date"
            />
          </UFormField>
        </div>

        <UFormField
          v-if="showDescriptionField"
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
            :ui="{ trailing: 'pointer-events-none' }"
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
          :ui="{ base: 'text-white cursor-pointer' }"
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

const isOpen = defineModel<boolean>("open", { default: false });

defineProps<{
  loading: boolean;
}>();

const emit = defineEmits<{
  submit: [data: InactivateOccurrenceSchema];
  close: [];
}>();

const closureTypeOptions = CLOSURE_TYPE_OPTIONS;

const state = reactive<Partial<InactivateOccurrenceSchema>>({
  type_closure: TypeOccurrenceClosure.RESOLVED,
  solution_description: undefined,
  resolution_date: undefined,
});

watch(isOpen, (open) => {
  if (!open) {
    state.type_closure = TypeOccurrenceClosure.RESOLVED;
    state.solution_description = undefined;
    state.resolution_date = undefined;
  }
});

const showDateField = computed(
  () =>
    state.type_closure === TypeOccurrenceClosure.OTHER ||
    state.type_closure === TypeOccurrenceClosure.RESOLVED
);

const showDescriptionField = computed(() => showDateField.value);

function resetAndClose() {
  state.type_closure = TypeOccurrenceClosure.RESOLVED;
  state.solution_description = undefined;
  state.resolution_date = undefined;
  emit("close");
}

function onSubmit(event: FormSubmitEvent<InactivateOccurrenceSchema>) {
  emit("submit", event.data);
}
</script>
