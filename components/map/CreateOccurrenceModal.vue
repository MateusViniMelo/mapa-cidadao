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
      <form class="space-y-5" @submit.prevent="emit('submit')">
        <UFormField label="Endereço" size="lg" readonly>
          <UInput
            :loading="loadingAddress"
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
          :loading="loading"
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
import type { EnderecoNominatim } from "~/interfaces/EnderecoNominatim";

const isOpen = defineModel<boolean>("open", { default: false });
const selectedType = defineModel<number | undefined>("selectedType");
const description = defineModel<string>("description", { default: "" });

defineProps<{
  address: EnderecoNominatim | null;
  loadingAddress: boolean;
  addressError: boolean;
  typeOptions: Array<{ label: string; value: number }>;
  loading: boolean;
  maxLength: number;
}>();

const emit = defineEmits<{
  submit: [];
  close: [];
}>();
</script>
