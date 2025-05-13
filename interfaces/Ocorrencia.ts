export interface Ocorrencia {
  id: number;
  descricao: string;
  categoria: string;
  localizacao: {
    lat: number;
    lng: number;
  };
}
