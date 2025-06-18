<template>
  <div class="bg-gray-100 dark:bg-zinc-900">
    <Navbar />
    <ClientOnly>
      <div class="w-full">
        <p class="text-gray-900 dark:text-gray-200 mb-1">
          Clique no mapa para selecionar uma marcação
        </p>
        <LeafletMap />
      </div>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import LeafletMap from "~/components/LeafletMap.vue";
import ColorModeButtonVue from "~/components/ColorModeButton.vue.vue";

import { useFlowbite } from "~/composables/useFlowbite";
import { initFlowbite } from "flowbite";

onMounted(() => {
  useFlowbite(() => {
    initFlowbite();
  });
});
</script>

<style></style>
