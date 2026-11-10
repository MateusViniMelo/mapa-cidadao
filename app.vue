<template>
  <UApp :toaster="{ position: 'top-center' }">
    <NuxtLoadingIndicator color="tertiary" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
