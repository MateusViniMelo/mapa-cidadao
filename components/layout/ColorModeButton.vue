<template>
  <ClientOnly v-if="!colorMode?.forced">
    <UButton
      :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
      color="neutral"
      variant="ghost"
      :aria-label="isDark ? 'Ativar tema claro' : 'Ativar tema escuro'"
      :ui="{ base: 'min-h-11 min-w-11 cursor-pointer' }"
      @click="isDark = !isDark"
    />

    <template #fallback>
      <div class="size-12" />
    </template>
  </ClientOnly>
</template>

<script lang="ts" setup>
const colorMode = useColorMode();

const isDark = computed({
  get() {
    return colorMode.value === "dark";
  },
  set(value) {
    colorMode.preference = value ? "dark" : "light";
  },
});
</script>
