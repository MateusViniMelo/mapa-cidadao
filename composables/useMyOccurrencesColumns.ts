import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";
import type { IOccurrence } from "~/interfaces/IOccurrence";
import type { ITypeOccurrence } from "~/interfaces/ITypeOccurrence";
import {
  getClosureColor,
  getClosureLabel,
} from "~/constants/occurrenceClosure";
import { formatTableAddress } from "~/utils/mapPopup";

export function useMyOccurrencesColumns() {
  const UBadge = resolveComponent("UBadge");

  const columns: TableColumn<IOccurrence>[] = [
    {
      accessorKey: "id",
      header: "#",
      cell: ({ row }) => `#${row.getValue("id")}`,
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => {
        const value = row.getValue("type") as ITypeOccurrence | null;
        return value?.name;
      },
    },
    {
      accessorKey: "address_name",
      header: "Endereço",
      cell: ({ row }) =>
        formatTableAddress(row.getValue("address_name") as string | null),
    },
    {
      accessorKey: "city",
      header: "Cidade",
      cell: ({ row }) => row.getValue("city") as string | null,
    },
    {
      accessorKey: "state",
      header: "Estado",
      cell: ({ row }) => row.getValue("state") as string | null,
    },
    {
      accessorKey: "type_closure",
      header: "Status",
      cell: ({ row }) => {
        const value = row.getValue("type_closure") as string | null;
        const color = getClosureColor(value);
        const label = getClosureLabel(value);

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
      cell: ({ row }) =>
        new Date(row.getValue("created_at")).toLocaleString("pt-BR"),
    },
  ];

  return { columns };
}
