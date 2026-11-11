<script setup lang="ts">
import { tempoAtras } from "~/util/date";
import { formatShortAddress } from "~/utils/mapPopup";

const {
  occurrenceId,
  typeName,
  likesCount,
  iconUrl,
  addressName,
  createdAt,
  liked,
  liking,
  isOwner,
} = defineProps<{
  occurrenceId: number;
  typeName: string;
  likesCount: number;
  iconUrl?: string;
  addressName?: string;
  createdAt?: string;
  liked?: boolean;
  liking?: boolean;
  isOwner?: boolean;
}>();

const emit = defineEmits<{
  like: [id: number];
  close: [id: number];
}>();
</script>

<template>
  <div class="mc-ficha">
    <p class="mc-ficha__type">
      <img
        v-if="iconUrl"
        :src="iconUrl"
        alt=""
        class="mc-ficha__pin"
      />
      <span>{{ typeName }}</span>
    </p>
    <p class="mc-ficha__address" data-address>{{ formatShortAddress(addressName ?? "") }}</p>
    <p class="mc-ficha__when" data-when>{{ createdAt ? tempoAtras(createdAt) : "" }}</p>
    <div class="mc-ficha__actions">
      <button
        type="button"
        class="mc-like"
        :aria-pressed="liked"
        :aria-busy="liking"
        :disabled="liking"
        @click="emit('like', occurrenceId)"
      >
        <svg
          class="mc-like__icon"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path
            d="M12 20.5s-8-4.9-8-11A4.4 4.4 0 0 1 12 6.8a4.4 4.4 0 0 1 8 2.7c0 6.1-8 11-8 11Z"
          />
        </svg>
        <span data-likes>{{ likesCount }}</span>
      </button>
      <button
        v-if="isOwner"
        type="button"
        class="mc-end"
        @click="emit('close', occurrenceId)"
      >
        Encerrar
      </button>
    </div>
  </div>
</template>

<style scoped>
.mc-ficha {
  font-family: var(--mc-font);
  font-weight: 400;
  color: var(--mc-ink);
  text-align: left;
}
.mc-ficha__type,
.mc-ficha__address,
.mc-ficha__when {
  margin: 0;
  padding-inline: 1rem;
}
.mc-ficha__type {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.9rem;
  padding-right: 3.4rem;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  text-wrap: balance;
}
.mc-ficha__pin {
  width: 1.15rem;
  height: auto;
  flex: none;
}
.mc-ficha__address {
  margin-top: 0.3rem;
  font-size: 0.86rem;
  font-weight: 400;
  line-height: 1.35;
  color: var(--mc-ink-soft);
  overflow-wrap: anywhere;
}
.mc-ficha__address:empty {
  display: none;
}
.mc-ficha__when {
  margin-top: 0.35rem;
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--mc-ink-soft);
}
.mc-ficha__when:empty {
  display: none;
}

.mc-ficha__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding: 0.55rem 0.85rem 0.75rem;
  border-top: 1px solid var(--mc-rule);
}

.mc-like {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.85rem 0.25rem 0.7rem;
  background: color-mix(in oklch, var(--mc-ink) 6%, transparent);
  color: var(--mc-ink);
  border: 0;
  border-radius: var(--mc-radius);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: background-color 0.2s var(--mc-ease);
}
.mc-like:hover {
  background: color-mix(in oklch, var(--mc-ink) 11%, transparent);
}
.mc-like:focus-visible,
.mc-end:focus-visible {
  outline: 2px solid var(--mc-accent);
  outline-offset: 2px;
}
.mc-like[aria-pressed="true"] {
  background: var(--mc-accent);
  color: var(--mc-on-accent);
}
.mc-like__icon {
  width: 1.05rem;
  height: 1.05rem;
  flex: none;
  fill: transparent;
  transition: fill 0.2s var(--mc-ease);
}
.mc-like[aria-pressed="true"] .mc-like__icon {
  fill: currentColor;
}

.mc-end {
  min-height: 2.75rem;
  padding: 0.25rem 0.55rem;
  background: none;
  border: 0;
  color: var(--mc-ink-soft);
  font: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.2s var(--mc-ease);
}
.mc-end:hover {
  color: var(--mc-urucum-deep);
}

@media (prefers-reduced-motion: reduce) {
  .mc-like,
  .mc-like__icon,
  .mc-end {
    transition: none;
  }
}
</style>
