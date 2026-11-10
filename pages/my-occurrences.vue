<template>
  <div class="mx-auto container p-4">
    <h1 class="text-2xl font-bold mb-4 dark:text-white">Minhas Ocorrências</h1>

    <UTable
      :loading="loading"
      loading-color="tertiary"
      :data="myOccurrences?.data"
      :columns="columns"
      class="flex-1"
    />

    <div
      v-if="myOccurrences?.data"
      class="flex justify-center border-t border-default pt-4"
    >
      <UPagination
        v-model:page="currentPage"
        :disabled="loading"
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
const { myOccurrences, loading } = storeToRefs(store);
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
