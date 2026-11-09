<template>
  <footer class="bg-white rounded-lg shadow-sm dark:bg-gray-900 m-4">
    <div class="w-full max-w-screen-xl mx-auto p-4 md:py-8">
      <div class="sm:flex sm:items-center sm:justify-between">
        <NuxtLink to="/" class="flex items-center mb-4 sm:mb-0 space-x-3">
          <UIcon name="hugeicons:maps-search" class="text-2xl text-indigo-500" />
          <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white">
            Mapa Cidadão
          </span>
        </NuxtLink>
        <ul
          class="flex flex-wrap items-center mb-6 text-sm font-medium text-gray-500 sm:mb-0 dark:text-gray-400"
        >
          <li>
            <NuxtLink to="/sobre" class="hover:underline me-4 md:me-6">
              Sobre
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/" class="hover:underline me-4 md:me-6">
              Mapa
            </NuxtLink>
          </li>
        </ul>
      </div>
      <hr class="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
      <span class="block text-sm text-gray-500 sm:text-center dark:text-gray-400">
        © {{ currentYear }} Mapa Cidadão. Todos os direitos reservados.
      </span>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear();
</script>
