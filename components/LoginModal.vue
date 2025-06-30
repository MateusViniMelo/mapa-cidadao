<template>
  <UModal
    :dismissible="false"
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
      <form class="space-y-4">
        <div>
          <label
            for="email"
            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >Email</label
          >
          <input
            type="email"
            name="email"
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
            name="password"
            id="password"
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
          <a  class="text-indigo-700 hover:underline dark:text-indigo-500 cursor-pointer"
            >Criar conta</a
          >
        </div>
      </form>
    </template>
  </UModal>
</template>

<script setup lang="ts"></script>

<style scoped></style>
