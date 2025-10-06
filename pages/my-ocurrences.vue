<template>
  <div class="mx-auto container p-4">
    <h1>Minhas ocurrences</h1>
    <UTable
      :loading="loading"
      loading-color="tertiary"
      :data="myOcurrences?.data"
      :columns="columns"
      class="flex-1"
    />
    <div
      class="flex justify-center border-t border-default pt-4"
      v-if="myOcurrences?.data"
    >
      <UPagination
        :disabled="loading"
        v-model:page="currentPage"
        :total="myOcurrences?.total"
        :items-per-page="myOcurrences?.per_page"
        color="tertiary"
        active-color="tertiary"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";
import type { IOcurrence } from "~/interfaces/IOcurrence";
import type { ITypeOcurrence } from "~/interfaces/ITypeOcurrence";
import { getPaginationRowModel } from "@tanstack/vue-table";
import authMiddleware from "~/middleware/authMiddleware";

definePageMeta({
  middleware: [authMiddleware],
});

const UBadge = resolveComponent("UBadge");
const store = useOcurrenceStore();
const { myOcurrences, loading } = storeToRefs(store);
const { loadMyOcurrences } = store;
const typeClosureMap: Record<string, string> = {
  resolved: "Resolvida",
  other: "Outros",
};

const columns: TableColumn<IOcurrence>[] = [
  {
    accessorKey: "id",
    header: "#",
    cell: ({ row }) => `#${row.getValue("id")}`,
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const value = row.getValue("type") as ITypeOcurrence | null;

      const label = value?.name;

      return label;
    },
  },

  {
    accessorKey: "address_name",
    header: "Endereço",
    cell: ({ row }) => {
      const address = row.getValue("address_name") as string | null;

      const value = address?.split(",");
      return value ? `${value[0]}, ${value[0]}, ${value[1]}, ${value[2]}` : "";
    },
  },
  {
    accessorKey: "city",
    header: "Cidade",
    cell: ({ row }) => {
      const value = row.getValue("city") as string | null;

      return value;
    },
  },
  {
    accessorKey: "state",
    header: "Estado",
    cell: ({ row }) => {
      const value = row.getValue("state") as string | null;

      return value;
    },
  },
  {
    accessorKey: "type_closure",
    header: "Status",
    cell: ({ row }) => {
      const value = row.getValue("type_closure") as string | null;

      const color = value
        ? {
            resolved: "success" as const,
            other: "warning" as const,
          }[value] ?? "secondary"
        : "secondary";

      const label = value ? typeClosureMap[value] ?? value : "Em andamento";

      return h(
        UBadge,
        { class: "capitalize", variant: "subtle", color },
        () => label
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Criada em",
    cell: ({ row }) => {
      return new Date(row.getValue("created_at")).toLocaleString("pt-BR");
    },
  },
];

const currentPage = ref(1);

watch(currentPage, (page) => {
  loadMyOcurrences(page);
});
onMounted(async () => {
  await loadMyOcurrences();
});
</script>
