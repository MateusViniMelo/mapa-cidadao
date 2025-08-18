<template>
  <UModal
    :dismissible="false"
    v-model:open="first"
    title="Entrar no Mapa Cidadão"
    :close="{
      color: 'tertiary',
      variant: 'outline',
      class: 'rounded-full cursor-pointer',
    }"
  >
    <UButton
      label="Entrar"
      :ui="{
        base: 'text-white bg-indigo-700  hover:bg-indigo-800 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800 cursor-pointer',
      }"
    />

    <template #body>
      <UForm
        :schema="loginUserSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Email" name="email">
          <UInput v-model="state.email" class="w-full" color="tertiary" />
        </UFormField>

        <UFormField label="Senha" name="password">
          <UInput
            v-model="state.password"
            type="password"
            class="w-full"
            color="tertiary"
          />
        </UFormField>

        <UButton
          type="submit"
          class="w-full flex justify-center"
          :loading="authStore.loading"
          :ui="{
            base: 'text-white bg-indigo-700  hover:bg-indigo-800 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800 cursor-pointer',
          }"
        >
          Entrar
        </UButton>
      </UForm>
      <div class="text-sm font-medium text-gray-500 dark:text-gray-300 mt-5">
        Sem Registro?

        <RegisterModal />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { useAuthStore } from "@/stores/authStore";
import {
  loginUserSchema,
  type LoginUserSchema,
} from "~/validators/loginUserSchema";

const state = reactive<Partial<LoginUserSchema>>({
  email: undefined,
  password: undefined,
});
const first = ref(false);
const authStore = useAuthStore();

async function onSubmit(event: FormSubmitEvent<LoginUserSchema>) {
  await authStore.login(event.data).then(() => {
    first.value = false;
  });
}
</script>

<style scoped></style>
