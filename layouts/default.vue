<template>
  <div class="flex flex-col min-h-screen">
    <Navbar />
    <main class="flex-1 bg-white dark:bg-gray-900 lg:p-0">
      <slot />
    </main>
    <Footer />
  </div>
</template>
