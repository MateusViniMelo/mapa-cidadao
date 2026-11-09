<template>
  <div class="mx-auto container p-4">
    <h1 class="text-2xl font-bold mb-4 dark:text-white">Minhas Ocorrências</h1>

    <UTable
      :loading="loading"
      loading-color="tertiary"
      :data="myOcurrences?.data"
      :columns="columns"
      class="flex-1"
    />

    <div
      v-if="myOcurrences?.data"
      class="flex justify-center border-t border-default pt-4"
    >
      <UPagination
        v-model:page="currentPage"
        :disabled="loading"
        :total="myOcurrences?.total"
        :items-per-page="myOcurrences?.per_page"
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

const store = useOcurrenceStore();
const { myOcurrences, loading } = storeToRefs(store);
const { loadMyOcurrences } = store;
const { columns } = useMyOccurrencesColumns();

const currentPage = ref(1);

watch(currentPage, (page) => {
  loadMyOcurrences(page);
});

onMounted(async () => {
  await loadMyOcurrences();
});
</script>
