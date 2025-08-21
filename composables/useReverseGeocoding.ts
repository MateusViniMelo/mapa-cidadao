import type { EnderecoNominatim } from "@/interfaces/EnderecoNominatim";

export const useReverseGeocoding = () => {
  const carregando = ref(false);
  const erroEndereco = ref<string | null>(null);

  const buscarEndereco = async (
    lat: number,
    lng: number
  ): Promise<EnderecoNominatim | undefined> => {
    carregando.value = true;
    erroEndereco.value = null;

    try {
      const res = await fetch(`/api/reverse-geocoding?lat=${lat}&lng=${lng}`);

      if (!res.ok) throw new Error("Erro ao buscar endereço");

      const data: EnderecoNominatim = await res.json();
      return data;
    } catch (e: any) {
      erroEndereco.value = e.message || "Erro desconhecido";
    } finally {
      carregando.value = false;
    }
  };

  return {
    carregando,
    erroEndereco,
    buscarEndereco,
  };
};
