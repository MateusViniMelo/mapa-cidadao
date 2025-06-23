<template>
  <ClientOnly>
    <div class="w-full">
      <LeafletMap />
    </div>
  </ClientOnly>
</template>

<script lang="ts" setup>
import LeafletMap from "~/components/LeafletMap.vue";
import { useFlowbite } from '~/composables/useFlowbite';
import { initFlowbite } from 'flowbite';
onMounted(() => {
    useFlowbite(() => {
        initFlowbite();
    })
})

</script>

<style></style>
