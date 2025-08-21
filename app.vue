<template>
  <div>
    <NuxtLoadingIndicator color="tertiary" />
    <NuxtLayout>
      <UApp :toaster="{ position: 'top-center' }">
        <NuxtPage />
      </UApp>
    </NuxtLayout>
  </div>
</template>
