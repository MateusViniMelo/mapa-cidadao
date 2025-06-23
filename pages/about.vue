<template>
    <div>
      teste
    </div>
  </template>
  
  <script lang="ts" setup>

  
  
  import { useFlowbite } from "~/composables/useFlowbite";
  import { initFlowbite } from "flowbite";
  
  onMounted(() => {
    useFlowbite(() => {
      initFlowbite();
    });
  });
  </script>
  
  <style></style>
  