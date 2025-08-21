<template>
  <nav class="bg-white border-gray-200 dark:bg-gray-800">
    <div
      class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4"
    >
      <NuxtLink to="/" class="flex items-center space-x-3 rtl:space-x-reverse">
        <UIcon name="hugeicons:maps-search" class="text-3xl text-indigo-500" />
        <span
          class="self-center text-2xl font-semibold whitespace-nowrap dark:text-white"
          >Mapa Cidadão</span
        >
      </NuxtLink>
      <div class="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
        <LoginModal
          v-if="authStore.user === undefined || authStore.user === null"
        />
        <UDropdownMenu
          :items="items"
          :popper="{ placement: 'bottom-end' }"
          v-if="authStore.user != undefined && authStore.user != null"
        >
          <UAvatar
            class="cursor-pointer"
            size="lg"
            :alt="authStore.user?.name"
            src="https://www.shutterstock.com/image-vector/default-avatar-profile-icon-social-600nw-1906669723.jpg"
          />
          <template #logout>
            <UButton
              color="error"
              variant="ghost"
              icon="i-heroicons-arrow-left-on-rectangle"
              :loading="authStore.loading"
              class="w-full cursor-pointer"
              @click="authStore.logout()"
            >
              Sair
            </UButton>
          </template>
        </UDropdownMenu>

        <button
          data-collapse-toggle="navbar-sticky"
          type="button"
          class="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
          aria-controls="navbar-sticky"
          aria-expanded="false"
        >
          <span class="sr-only">Open main menu</span>
          <svg
            class="w-5 h-5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 17 14"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M1 1h15M1 7h15M1 13h15"
            />
          </svg>
        </button>
      </div>
      <div
        class="items-center justify-between hidden w-full md:flex md:w-auto md:order-1"
        id="navbar-sticky"
      >
        <ul
          class="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-800 dark:border-gray-700"
        >
          <li>
            <NuxtLink
              to="/"
              :class="[
                'block py-2 px-3 rounded-sm md:p-0',
                route.path === '/'
                  ? 'text-white bg-indigo-700 md:bg-transparent md:text-indigo-700 md:dark:text-indigo-500'
                  : 'text-gray-900 hover:bg-white md:hover:bg-transparent md:hover:text-indigo-700 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700',
              ]"
            >
              Início
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              to="/sobre"
              :class="[
                'block py-2 px-3 rounded-sm md:p-0',
                route.path === '/sobre'
                  ? 'text-white bg-indigo-700 md:bg-transparent md:text-indigo-700 md:dark:text-indigo-500'
                  : 'text-gray-900 hover:bg-white md:hover:bg-transparent md:hover:text-indigo-700 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700',
              ]"
            >
              Sobre
            </NuxtLink>
          </li>

          <li class="text-center">
            <ColorModeButtonVue />
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import ColorModeButtonVue from "~/components/ColorModeButton.vue";
import LoginModal from "@/components/LoginModal.vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();
const route = useRoute();

function getPrimeiroEUltimoNome(nomeCompleto: string): string {
  const partes: string[] = nomeCompleto.trim().split(/\s+/);

  return `${partes[0] || ""} ${
    partes.length > 1 ? partes[partes.length - 1] : ""
  }`;
}

function getSiglaPrimeiroEUltimo(nomeCompleto: string): string {
  const partes: string[] = nomeCompleto.trim().split(/\s+/);

  if (partes.length === 0) return "";

  const primeiraLetra = partes[0]?.charAt(0).toUpperCase() || "";
  const ultimaLetra =
    partes.length > 1 ? partes[partes.length - 1]?.charAt(0).toUpperCase() : "";

  return `${primeiraLetra}.${ultimaLetra}`;
}

const items = computed(() => {
  if (!authStore.user) return [];

  return [
    [
      {
        label: authStore.user.name,
        type: "label",
      },
    ],
    [
     /* {
        label: "Meu perfil",
        icon: "i-heroicons-user",
        to: "/profile",
      },
      {
        label: "Configurações",
        icon: "i-heroicons-cog-6-tooth",
        to: "/settings",
      }, */
      {
        label: "Sair",
        icon: "i-heroicons-arrow-left-on-rectangle",
        slot: "logout",
      },
    ],
  ];
});
</script>
