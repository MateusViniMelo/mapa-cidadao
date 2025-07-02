<template>
  <div>
    <Navbar />
    <div class="bg-white dark:bg-gray-900 min-h-screen lg:p-0">
      <slot />
    </div>
  </div>
</template>
<script>
import Footer from "~/components/Footer.vue";
</script>
