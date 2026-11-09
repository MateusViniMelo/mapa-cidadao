<template>
  <div class="mx-auto md:w-2/3 xl:w-1/2 2xl:w-1/3 pt-12">
    <div
      class="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700"
    >
      <h1
        class="mb-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
      >
        Mapa Cidadão — Sua Voz no Mapa da Cidade!
      </h1>

      <div class="font-normal text-gray-700 dark:text-gray-400 space-y-2">
        <p>
          Você já se deparou com uma rua sem iluminação, buracos no asfalto,
          lixo acumulado ou até mesmo alagamentos e se perguntou: "Será que
          alguém vai resolver isso?"
        </p>
        <p>
          O Mapa Cidadão foi criado para dar voz à sua experiência e tornar a
          cidade um lugar melhor para todos. Com ele, qualquer pessoa pode
          cadastrar ocorrências reais do seu bairro, como:
        </p>
        <ul class="max-w-md space-y-1 list-disc list-inside">
          <li>Problema de Iluminação</li>
          <li>Problema de Pavimentação</li>
          <li>Alagamento</li>
          <li>Acúmulo de Lixo</li>
          <li>Rua sem Pavimentação</li>
        </ul>
        <p>
          E o melhor: outras pessoas podem visualizar e confirmar essas
          ocorrências, aumentando a visibilidade e fortalecendo o apelo por
          soluções das autoridades.
        </p>
        <p>
          Participe, compartilhe, e ajude a transformar sua cidade. Comece agora
          a usar o Mapa Cidadão.
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  title: "Sobre",
});

useInitFlowbite();
</script>
