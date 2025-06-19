import type { EnderecoNominatim } from "@/interfaces/EnderecoNominatim";

export const useReverseGeocoding = () => {
  const endereco = ref<EnderecoNominatim | null>(null);
  const carregando = ref(false);
  const erro = ref<string | null>(null);

  const buscarEndereco = async (lat: number, lng: number) => {
    carregando.value = true;
    erro.value = null;

    try {
      const res = await fetch(`/api/reverse-geocoding?lat=${lat}&lng=${lng}`);

      if (!res.ok) throw new Error("Erro ao buscar endereço");

      const data: EnderecoNominatim = await res.json();
      endereco.value = data;
    } catch (e: any) {
      erro.value = e.message || "Erro desconhecido";
    } finally {
      carregando.value = false;
    }
  };

  return {
    endereco,
    carregando,
    erro,
    buscarEndereco,
  };
};
