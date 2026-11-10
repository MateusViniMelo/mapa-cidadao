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

<style>
/* Diálogos do mapa, no portal do UModal. O índigo continua --ui-tertiary. */
.mc-overlay {
  background: color-mix(in oklch, oklch(0.22 0.03 275) 55%, transparent);
}

.mc-dialog {
  --ui-bg: var(--mc-card);
  --ui-bg-muted: var(--mc-paper);
  --ui-bg-elevated: var(--mc-card);
  --ui-bg-accented: var(--mc-paper-deep);
  --ui-text: var(--mc-ink);
  --ui-text-highlighted: var(--mc-ink);
  --ui-text-toned: var(--mc-ink-soft);
  --ui-text-muted: var(--mc-ink-soft);
  --ui-text-dimmed: color-mix(in oklch, var(--mc-ink) 58%, var(--mc-card));
  --ui-border: var(--mc-rule);
  --ui-border-accented: var(--mc-accent);
  width: min(calc(100vw - 1.5rem), 32rem);
  max-width: none;
  background: var(--mc-card);
  color: var(--mc-ink);
  border: 0;
  border-radius: 1.25rem;
  box-shadow: var(--mc-shadow);
  font-family: var(--mc-font);
  font-weight: 500;
}
.mc-dialog[data-state="open"] {
  animation: mc-dialog-in 0.36s var(--mc-ease) both;
}
.mc-dialog[data-state="closed"] {
  animation: mc-dialog-out 0.16s ease-in both;
}

.mc-dialog__header {
  min-height: 0;
  padding: 1.15rem 4rem 0.9rem 1.25rem;
  border-bottom: 1px solid var(--mc-rule);
}
@media (min-width: 640px) {
  .mc-dialog__header {
    padding-inline: 1.5rem 4.25rem;
  }
}
.mc-dialog__title {
  font-size: 1.25rem;
  font-weight: 680;
  letter-spacing: -0.03em;
  line-height: 1.15;
  text-wrap: balance;
  color: var(--mc-ink);
}
.mc-dialog__body {
  padding: 1.15rem 1.25rem 1.35rem;
}
@media (min-width: 640px) {
  .mc-dialog__body {
    padding: 1.35rem 1.5rem 1.5rem;
  }
}

.mc-dialog__close.mc-dialog__close {
  top: 0.85rem;
  width: 2.25rem;
  height: 2.25rem;
  display: grid;
  place-items: center;
  padding: 0;
  background: color-mix(in oklch, var(--mc-ink) 6%, transparent);
  color: var(--mc-ink);
  border: 0;
  border-radius: 999px;
  box-shadow: none;
  cursor: pointer;
  transition: background-color 0.18s var(--mc-ease);
}
.mc-dialog__close.mc-dialog__close:hover {
  background: color-mix(in oklch, var(--mc-ink) 12%, transparent);
  color: var(--mc-ink);
}
.mc-dialog__close.mc-dialog__close:focus-visible {
  outline: 2px solid var(--mc-accent);
  outline-offset: 2px;
}

.mc-dialog label {
  margin-bottom: 0.3rem;
  font-size: 0.82rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  text-transform: none;
  color: var(--mc-ink);
}
.mc-dialog label::after {
  color: var(--mc-accent);
}

.mc-field {
  padding-block: 0.7rem;
  padding-inline: 0.85rem;
  background: var(--mc-paper);
  color: var(--mc-ink);
  border: 1px solid var(--mc-rule);
  border-radius: 0.8rem;
  box-shadow: none;
  font-family: var(--mc-font);
  font-size: 1rem;
  font-weight: 500;
  transition:
    background-color 0.2s var(--mc-ease),
    border-color 0.2s var(--mc-ease),
    box-shadow 0.2s var(--mc-ease);
}
.mc-field::placeholder,
.mc-field[data-placeholder] {
  color: var(--mc-ink-soft);
  font-weight: 450;
  opacity: 1;
}
.mc-field:focus,
.mc-field:focus-visible,
.mc-field[data-state="open"] {
  outline: 0;
  background: var(--mc-card);
  border-color: var(--mc-accent);
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--mc-accent) 28%, transparent);
}
.mc-field[readonly] {
  background: color-mix(in oklch, var(--mc-paper-deep) 70%, var(--mc-card));
}
.mc-field:disabled {
  opacity: 0.6;
}
.mc-field[type="date"] {
  font-variant-numeric: tabular-nums;
}

.mc-note {
  font-size: 0.86rem;
  line-height: 1.4;
  color: var(--mc-ink-soft);
}

.mc-btn {
  min-height: 2.9rem;
  margin-top: 0.35rem;
  background: var(--mc-accent);
  color: var(--mc-on-accent);
  border: 0;
  border-radius: 999px;
  box-shadow: none;
  font-family: var(--mc-font);
  font-size: 0.98rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: background-color 0.2s var(--mc-ease);
}
.mc-btn:hover:not(:disabled) {
  background: var(--mc-accent-hover);
}
.mc-btn:focus-visible {
  outline: 2px solid var(--mc-accent);
  outline-offset: 3px;
}
.mc-btn:disabled {
  background: var(--mc-paper-deep);
  color: var(--mc-ink-soft);
  box-shadow: none;
  cursor: not-allowed;
  opacity: 1;
}
.mc-btn--danger,
.mc-btn--danger:hover:not(:disabled) {
  background: var(--mc-urucum-deep);
  color: oklch(0.985 0.01 40);
}
.mc-btn--danger:hover:not(:disabled) {
  background: var(--mc-urucum);
}

.mc-menu {
  --ui-bg: var(--mc-card);
  --ui-text: var(--mc-ink);
  --ui-text-highlighted: var(--mc-ink);
  background: var(--mc-card);
  color: var(--mc-ink);
  border: 0;
  border-radius: 0.85rem;
  box-shadow: var(--mc-shadow);
  font-family: var(--mc-font);
  font-weight: 500;
}
.mc-menu__item {
  padding: 0.6rem 0.75rem;
  color: var(--mc-ink);
  font-size: 0.95rem;
}
.mc-menu__item[data-highlighted] {
  background: color-mix(in oklch, var(--mc-accent) 12%, var(--mc-card));
  color: var(--mc-ink);
}
.mc-menu__item[data-state="checked"] {
  font-weight: 680;
  color: var(--mc-accent);
}
.mc-menu__item[data-highlighted]::before {
  background: transparent;
}

@keyframes mc-dialog-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes mc-dialog-out {
  to {
    opacity: 0;
    transform: translateY(8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mc-dialog[data-state="open"],
  .mc-dialog[data-state="closed"] {
    animation-duration: 0.01ms;
  }
  .mc-btn,
  .mc-field,
  .mc-dialog__close.mc-dialog__close {
    transition: none;
  }
}
</style>
