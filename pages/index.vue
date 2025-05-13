<template>
  <div>

    <ClientOnly>
      <div class="w-1/2 mx-auto">
        <LeafletMap />
      </div>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import LeafletMap from '~/components/LeafletMap.vue';
</script>

<style></style>