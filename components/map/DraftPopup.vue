<script setup lang="ts">
const emit = defineEmits<{
  inform: [];
}>();
</script>

<template>
  <button type="button" class="mc-inform" @click="emit('inform')">
    <svg
      class="mc-inform__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.25"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <path d="M12 4v16M4 12h16" />
    </svg>
    Informar Problema
  </button>
</template>

<style scoped>
.mc-inform {
  display: flex;
  width: 100%;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  margin: 0;
  padding: 0.6rem 1rem;
  background: var(--mc-accent);
  color: var(--mc-on-accent);
  border: 0;
  border-radius: var(--mc-radius);
  font-family: var(--mc-font);
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: -0.01em;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s var(--mc-ease);
}
.mc-inform:hover {
  background: var(--mc-accent-hover);
}
.mc-inform:focus-visible {
  outline: 2px solid var(--mc-accent);
  outline-offset: 2px;
}
.mc-inform__icon {
  width: 1rem;
  height: 1rem;
  flex: none;
}

@media (prefers-reduced-motion: reduce) {
  .mc-inform {
    transition: none;
  }
}
</style>
