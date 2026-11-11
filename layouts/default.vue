<template>
  <div class="mc-shell">
    <Navbar />
    <main class="mc-main">
      <slot />
    </main>
    <Footer v-if="!isMap" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const isMap = computed(() => route.path === "/");
</script>
