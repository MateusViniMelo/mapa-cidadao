<template>
  <UModal
    v-model:open="isOpen"
    :dismissible="false"
    title="Entrar no Mapa Cidadão"
    :close="{
      color: 'tertiary',
      variant: 'outline',
      class: 'mc-dialog__close',
      onClick: resetForm,
    }"
    :ui="{
      overlay: 'mc-overlay',
      content: 'mc-dialog',
      header: 'mc-dialog__header',
      title: 'mc-dialog__title',
      body: 'mc-dialog__body',
    }"
  >
    <UButton label="Entrar" color="tertiary" class="min-h-11 cursor-pointer" />

    <template #body>
      <UForm
        :schema="loginUserSchema"
        :state="state"
        class="space-y-5"
        @submit="onSubmit"
      >
        <UFormField label="Email" name="email" size="lg">
          <UInput
            v-model="state.email"
            class="w-full"
            color="tertiary"
            size="lg"
            :ui="{ base: 'mc-field' }"
          />
        </UFormField>

        <UFormField label="Senha" name="password" size="lg">
          <UInput
            v-model="state.password"
            class="w-full"
            color="tertiary"
            size="lg"
            :type="showPassword ? 'text' : 'password'"
            :ui="{ base: 'mc-field', trailing: 'pe-1' }"
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
          color="tertiary"
          :loading="authStore.loading"
          :ui="{ base: 'mc-btn' }"
          block
        >
          Entrar
        </UButton>
      </UForm>

      <p class="mc-note mt-5">
        Sem registro? <RegisterModal />
      </p>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import {
  loginUserSchema,
  type LoginUserSchema,
} from "~/validators/loginUserSchema";

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
