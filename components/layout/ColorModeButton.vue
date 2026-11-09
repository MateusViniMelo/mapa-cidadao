<template>
  <ClientOnly v-if="!colorMode?.forced">
    <UButton
      :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
      color="neutral"
      variant="ghost"
      :ui="{ base: 'cursor-pointer py-2 px-3' }"
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
