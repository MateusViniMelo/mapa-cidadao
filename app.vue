<template>
  <div>
     <NuxtLoadingIndicator />
    <NuxtLayout>
      <UApp :toaster="{position: 'top-center'}">
        <NuxtPage />
      </UApp>
    </NuxtLayout>
  </div>
</template>
