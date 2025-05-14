<template>
  <div>


    <ClientOnly>
      <div class="w-full md:w-2/3 xl:w-1/2 mx-auto px-4 py-4">
        <h1 class="text-3xl mb-5 mt-10 text-blue-600 dark:text-blue-500 font-bold">
          <UIcon name="hugeicons:maps-search" class="size-5" /> Mapa Cidadão
          <ColorModeButtonVue />
        </h1>
        <LeafletMap />
      </div>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import LeafletMap from '~/components/LeafletMap.vue';
import ColorModeButtonVue from '~/components/ColorModeButton.vue.vue';
</script>

<style></style>