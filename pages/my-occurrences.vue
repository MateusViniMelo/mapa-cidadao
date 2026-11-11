<template>
  <div class="mc-page">
    <header>
      <h1 class="mc-display">Minhas Ocorrências</h1>
      <p class="mc-lead">
        O que você registrou no mapa, com o status de cada uma.
      </p>
    </header>

    <UTable
      :loading="loadingMine"
      loading-color="tertiary"
      :data="myOccurrences?.data"
      :columns="columns"
      class="mc-table"
    >
      <template #empty>
        <p v-if="!loadingMine" class="mc-empty">
          As ocorrências que você criar no mapa aparecem aqui.
        </p>
      </template>
    </UTable>

    <div v-if="myOccurrences?.total" class="mc-pager">
      <UPagination
        v-model:page="currentPage"
        :disabled="loadingMine"
        :total="myOccurrences?.total"
        :items-per-page="myOccurrences?.per_page"
        color="tertiary"
        active-color="tertiary"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import authMiddleware from "~/middleware/authMiddleware";

definePageMeta({
  middleware: [authMiddleware],
  title: "Minhas Ocorrências",
});

const store = useOccurrenceStore();
const { myOccurrences, loadingMine } = storeToRefs(store);
const { loadMyOccurrences } = store;
const { columns } = useMyOccurrencesColumns();

const currentPage = ref(1);

watch(currentPage, (page) => {
  loadMyOccurrences(page);
});

watch(myOccurrences, (mine) => {
  if (mine && mine.page !== currentPage.value) {
    currentPage.value = mine.page;
  }
});

onMounted(async () => {
  await loadMyOccurrences();
});
</script>
