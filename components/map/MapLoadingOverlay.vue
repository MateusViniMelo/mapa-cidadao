<template>
  <div
    class="absolute inset-0 z-[1000] flex flex-col items-center justify-center gap-3 rounded-md bg-white/80 backdrop-blur-sm dark:bg-gray-950/80"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <UIcon
      name="i-heroicons-arrow-path"
      class="size-10 animate-spin text-indigo-600 dark:text-indigo-400"
    />
    <p class="text-sm font-medium text-gray-700 dark:text-gray-200">
      Carregando ocorrências…
    </p>
  </div>
</template>
