<template>
  <header class="mc-bar sticky top-0 z-40 border-b border-default">
    <UContainer class="flex h-16 items-center gap-3">
      <NuxtLink
        to="/"
        class="flex min-w-0 items-baseline gap-2 lg:flex-1"
        aria-label="Mapa Cidadão, início"
      >
        <span class="wordmark truncate text-[1.35rem] leading-none text-highlighted">
          Mapa
          <span class="text-tertiary">Cidadão</span>
        </span>
      </NuxtLink>

      <nav class="hidden lg:flex" aria-label="Principal">
        <UNavigationMenu
          :items="navItems"
          color="neutral"
          variant="link"
          highlight
          highlight-color="tertiary"
        />
      </nav>

      <div class="ms-auto flex items-center justify-end gap-1.5 lg:flex-1">
        <ColorModeButton />

        <LoginModal v-if="!authStore.user" />

        <UDropdownMenu
          v-else
          :items="accountItems"
          :content="{ align: 'end' }"
        >
          <UButton
            color="neutral"
            variant="ghost"
            class="min-h-11 min-w-11 cursor-pointer px-1.5"
            :aria-label="`Conta de ${authStore.user.name}`"
          >
            <UAvatar :alt="authStore.user.name" size="sm" />
          </UButton>
        </UDropdownMenu>

        <UButton
          class="min-h-11 min-w-11 cursor-pointer lg:hidden"
          color="neutral"
          variant="ghost"
          square
          :icon="menuOpen ? 'hugeicons:cancel-01' : 'hugeicons:menu-01'"
          :aria-expanded="menuOpen"
          aria-controls="navbar-menu"
          :aria-label="menuOpen ? 'Fechar menu' : 'Abrir menu'"
          @click="menuOpen = !menuOpen"
        />
      </div>
    </UContainer>

    <div
      id="navbar-menu"
      class="nav-panel lg:hidden"
      :class="menuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
    >
      <div class="overflow-hidden">
        <nav aria-label="Principal, mobile" class="border-t border-default">
          <UContainer class="py-3">
            <UNavigationMenu
              :items="navItems"
              orientation="vertical"
              color="neutral"
              variant="link"
              highlight
              highlight-color="tertiary"
              class="-mx-2.5"
            />
          </UContainer>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from "@nuxt/ui";

const authStore = useAuthStore();
const route = useRoute();
const menuOpen = ref(false);

watch(
  () => route.path,
  () => {
    menuOpen.value = false;
  },
);

const navItems = computed<NavigationMenuItem[]>(() => [
  {
    label: "Início",
    icon: "hugeicons:maps",
    to: "/",
    active: route.path === "/",
  },
  {
    label: "Sobre",
    icon: "hugeicons:information-circle",
    to: "/sobre",
    active: route.path === "/sobre",
  },
]);

const accountItems = computed<DropdownMenuItem[][]>(() => {
  if (!authStore.user) return [];

  return [
    [{ label: authStore.user.name, type: "label" }],
    [
      {
        label: "Minhas Ocorrências",
        icon: "hugeicons:left-to-right-list-bullet",
        to: "/my-occurrences",
      },
      {
        label: "Sair",
        icon: "hugeicons:logout-01",
        color: "error",
        loading: authStore.loading,
        onSelect: () => {
          authStore.logout();
        },
      },
    ],
  ];
});
</script>

<style scoped>
.nav-panel {
  display: grid;
  transition: grid-template-rows 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

@media (prefers-reduced-motion: reduce) {
  .nav-panel {
    transition: none;
  }
}
</style>
