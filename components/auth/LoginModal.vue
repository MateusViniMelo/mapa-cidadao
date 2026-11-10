<template>
  <UModal
    v-model:open="isOpen"
    :dismissible="false"
    title="Entrar no Mapa Cidadão"
    :close="{
      color: 'tertiary',
      variant: 'outline',
      class: 'rounded-full cursor-pointer',
      onClick: resetForm,
    }"
  >
    <UButton label="Entrar" color="tertiary" class="cursor-pointer" />

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
            class="w-full"
            color="tertiary"
            :type="showPassword ? 'text' : 'password'"
            :ui="{ trailing: 'pe-1' }"
          >
            <template #trailing>
              <UButton
                color="tertiary"
                variant="link"
                size="md"
                :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              />
            </template>
          </UInput>
        </UFormField>

        <UButton
          type="submit"
          class="w-full flex justify-center"
          :loading="authStore.loading"
          :ui="{ base: primaryButtonClass }"
        >
          Entrar
        </UButton>
      </UForm>

      <div class="text-sm font-medium text-gray-500 dark:text-gray-300 mt-5">
        Sem registro? <RegisterModal />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import {
  loginUserSchema,
  type LoginUserSchema,
} from "~/validators/loginUserSchema";

const primaryButtonClass =
  "text-white bg-indigo-700 hover:bg-indigo-800 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800 cursor-pointer";

const state = reactive<Partial<LoginUserSchema>>({
  email: undefined,
  password: undefined,
});

const showPassword = ref(false);
const isOpen = ref(false);
const authStore = useAuthStore();

async function onSubmit(event: FormSubmitEvent<LoginUserSchema>) {
  try {
    await authStore.login(event.data);
    resetForm();
  } catch {
    state.password = undefined;
  }
}

function resetForm() {
  state.email = undefined;
  state.password = undefined;
  showPassword.value = false;
  isOpen.value = false;
}
</script>
