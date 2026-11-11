<template>
  <article class="mc-page mc-page--copy">
    <h1 class="mc-display">Mapa Cidadão — Sua Voz no Mapa da Cidade!</h1>

    <div class="mc-prose">
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
      <ul class="mc-kinds">
        <li v-for="item in kinds" :key="item.nome">
          <img :src="item.iconUrl" alt="" width="22" height="32" />
          <span>{{ item.nome }}</span>
        </li>
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
  </article>
</template>

<script lang="ts" setup>
import { legendMarkers } from "~/util/makerIcons";

definePageMeta({
  title: "Sobre",
});

const kinds = legendMarkers();
</script>
