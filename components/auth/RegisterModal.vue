<template>
  <UModal
    v-model:open="isOpen"
    title="Criar Conta"
    :dismissible="false"
    :close="{
      color: 'tertiary',
      variant: 'outline',
      class: 'rounded-full cursor-pointer',
      onClick: resetForm,
    }"
  >
    <span
      class="text-indigo-700 hover:underline dark:text-indigo-500 cursor-pointer"
      @click="isOpen = true"
    >
      Criar conta
    </span>

    <template #body>
      <UForm
        :schema="registerUserSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Nome" name="name" class="w-full">
          <UInput v-model="state.name" class="w-full" color="tertiary" />
        </UFormField>

        <div class="flex justify-between space-x-4">
          <UFormField label="Email" name="email" class="w-full">
            <UInput v-model="state.email" class="w-full" color="tertiary" />
          </UFormField>
          <UFormField label="Data de nascimento" name="date_birth" class="w-full">
            <UInput
              v-model="state.date_birth"
              color="tertiary"
              class="w-full"
              type="date"
            />
          </UFormField>
        </div>

        <div class="space-y-2">
          <UFormField label="Senha" name="password">
            <UInput
              v-model="state.password"
              placeholder="Digite sua senha"
              :color="passwordColor"
              :type="showPassword ? 'text' : 'password'"
              :aria-invalid="passwordScore < 5"
              aria-describedby="password-strength"
              :ui="{ trailing: 'pe-1' }"
              class="w-full"
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                  :aria-pressed="showPassword"
                  @click="showPassword = !showPassword"
                />
              </template>
            </UInput>
          </UFormField>

          <UProgress
            :color="passwordColor"
            :indicator="passwordLabel"
            :model-value="passwordScore"
            :max="5"
            size="sm"
          />

          <p id="password-strength" class="text-sm font-medium">
            {{ passwordLabel }}. A senha deve conter:
          </p>

          <ul class="space-y-1" aria-label="Requisitos da senha">
            <li
              v-for="(req, index) in passwordStrength"
              :key="index"
              class="flex items-center gap-0.5"
              :class="req.met ? 'text-success' : 'text-muted'"
            >
              <UIcon
                :name="req.met ? 'i-lucide-circle-check' : 'i-lucide-circle-x'"
                class="size-4 shrink-0"
              />
              <span class="text-xs font-light">
                {{ req.text }}
                <span class="sr-only">
                  {{ req.met ? " - Requisito atendido" : " - Requisito não atendido" }}
                </span>
              </span>
            </li>
          </ul>
        </div>

        <UFormField label="Confirmar Senha" name="password_confirmation" class="w-full">
          <UInput
            v-model="state.password_confirmation"
            class="w-full"
            color="tertiary"
            placeholder="Confirme a sua senha"
            :type="showPasswordConfirmation ? 'text' : 'password'"
            :ui="{ trailing: 'pe-1' }"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                :icon="showPasswordConfirmation ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="showPasswordConfirmation ? 'Ocultar senha' : 'Mostrar senha'"
                :aria-pressed="showPasswordConfirmation"
                @click="showPasswordConfirmation = !showPasswordConfirmation"
              />
            </template>
          </UInput>
        </UFormField>

        <UButton
          type="submit"
          :loading="authStore.loading"
          class="w-full flex justify-center"
          :ui="{ base: primaryButtonClass }"
        >
          Cadastrar
        </UButton>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import {
  registerUserSchema,
  type RegisterUserSchema,
} from "~/validators/registerUserSchema";

const primaryButtonClass =
  "text-white bg-indigo-700 hover:bg-indigo-800 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800 cursor-pointer";

const showPassword = ref(false);
const showPasswordConfirmation = ref(false);
const isOpen = ref(false);

const state = reactive<Partial<RegisterUserSchema>>({
  email: undefined,
  password: undefined,
  name: undefined,
  date_birth: undefined,
  password_confirmation: undefined,
});

const authStore = useAuthStore();

function checkStrength(password: string) {
  const requirements = [
    { regex: /.{8,}/, text: "Pelo menos 8 caracteres" },
    { regex: /\d/, text: "Pelo menos 1 número" },
    { regex: /[a-z]/, text: "Pelo menos 1 letra minúscula" },
    { regex: /[A-Z]/, text: "Pelo menos 1 letra maiúscula" },
    {
      regex: /[@$!%*#?&^()\-_=+]/,
      text: "Pelo menos 1 caractere especial (@$!%*#?&^()-_=+)",
    },
  ];

  return requirements.map((req) => ({
    met: req.regex.test(password),
    text: req.text,
  }));
}

const passwordStrength = computed(() => checkStrength(state.password ?? ""));
const passwordScore = computed(
  () => passwordStrength.value.filter((req) => req.met).length
);

const passwordColor = computed(() => {
  if (passwordScore.value === 0) return "tertiary";
  if (passwordScore.value <= 2) return "error";
  if (passwordScore.value <= 4) return "warning";
  return "success";
});

const passwordLabel = computed(() => {
  if (passwordScore.value === 0) return "Digite uma senha";
  if (passwordScore.value <= 2) return "Senha fraca";
  if (passwordScore.value === 3) return "Senha média";
  if (passwordScore.value === 4) return "Senha boa";
  return "Senha forte";
});

async function onSubmit(event: FormSubmitEvent<RegisterUserSchema>) {
  await authStore.register(event.data);
}

function resetForm() {
  state.name = undefined;
  state.email = undefined;
  state.password = undefined;
  state.password_confirmation = undefined;
  state.date_birth = undefined;
  showPassword.value = false;
  showPasswordConfirmation.value = false;
}
</script>
