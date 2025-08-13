<template>
  <UModal v-model:open="open" title="Criar Conta">
    <span
      @click="openModal()"
      class="text-indigo-700 hover:underline dark:text-indigo-500 cursor-pointer"
    >
      Criar conta
    </span>

    <template #body>
      <form class="space-y-4" @submit.prevent="handleRegister()">
        <div>
          <label
            for="email"
            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >Email</label
          >
          <input
            type="email"
            v-model="email"
            id="email"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            required
          />
        </div>
        <div>
          <label
            for="email"
            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >Data de Nascimento</label
          >
          <input
            type="date"
            v-model="dateBirth"
            id="email"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            required
          />
        </div>
        <div>
          <label
            for="password"
            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >Senha</label
          >
          <input
            type="password"
            id="password"
            v-model="password"
            placeholder="••••••••"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            required
          />
        </div>
        <div class="flex justify-between">
          <div class="flex items-start"></div>
          <a
            class="text-sm text-indigo-700 hover:underline dark:text-indigo-500 cursor-pointer"
            >Esqueceu sua senha?</a
          >
        </div>
        <button
          type="submit"
          class="w-full text-white bg-indigo-700 hover:bg-indigo-800 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800"
        >
          Entrar
        </button>
        <div class="text-sm font-medium text-gray-500 dark:text-gray-300">
          Sem Registro?

          <RegisterModal />
        </div>
      </form>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
const open = ref(false);
function openModal() {
  open.value = true;
}

const authStore = useAuthStore();

const email = ref("");
const password = ref("");
const dateBirth = ref("");

async function handleRegister() {
  await authStore.register({
    name: "Mateus Melo",
    email: email.value,
    date_birth: new Date(dateBirth.value),
    password: password.value,
    password_confirmation: password.value,
  });
  console.log(authStore.user)
}

defineShortcuts({
  o: () => (open.value = !open.value),
});
</script>

<style scoped></style>
