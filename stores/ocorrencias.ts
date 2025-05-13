import { defineStore } from "pinia";
import type { Ocorrencia } from "~/interfaces/Ocorrencia";
export const useOcorrenciasStore = defineStore("ocorrencias", {
  state: () => ({
    lista: [] as Ocorrencia[],
  }),
  actions: {
    adicionar(ocorrencia: Omit<Ocorrencia, "id">) {
      const id = Date.now();
      this.lista.push({ id, ...ocorrencia });
      this.persistir();
    },
    persistir() {
      localStorage.setItem("ocorrencias", JSON.stringify(this.lista));
    },
    carregar() {
      const data = localStorage.getItem("ocorrencias");
      if (data) {
        this.lista = JSON.parse(data);
      }
    },
    remove(id: number) {
      this.lista = this.lista.filter((o) => o.id !== id);
      this.persistir();
    },
  },
});
