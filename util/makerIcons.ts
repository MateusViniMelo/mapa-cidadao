import L from "leaflet";

export const markerIcons: Record<string, { icon: L.Icon; nome: string }> = {
  1: {
    icon: new L.Icon({
      iconUrl: "/images/marking-icons/marker-icon-iluminacao_2.png",

      iconSize: [28, 41],
      iconAnchor: [19.2, 40],
      popupAnchor: [1, -34],
    }),
    nome: "Problema de Iluminação",
  },
 2: {
    icon: new L.Icon({
      iconUrl: "/images/marking-icons/marker-icon-buraco_2.png",

      iconSize: [28, 41],
      iconAnchor: [19.2, 40],
      popupAnchor: [1, -34],
    }),
    nome: "Problema de Pavimentação",
  },
  3: {
    icon: new L.Icon({
      iconUrl: "/images/marking-icons/marker-icon-alagamento_2.png",

      iconSize: [28, 41],
      iconAnchor: [19.2, 40],
      popupAnchor: [1, -34],
    }),
    nome: "Alagamento",
  },
  4: {
    icon: new L.Icon({
      iconUrl: "/images/marking-icons/marker-icon-lixo_2.png",

      iconSize: [28, 41],
      iconAnchor: [19.2, 40],
      popupAnchor: [1, -34],
    }),
    nome: "Lixo",
  },
  Padrao: {
    icon: new L.Icon({
      iconUrl: "/images/marking-icons/marker-icon-padrao_2.png",
      iconSize: [33.6, 48],
      iconAnchor: [23.04, 48],
      popupAnchor: [1, -34],
    }),
    nome: "Problema Desconhecido",
  },
  5: {
    icon: new L.Icon({
      iconUrl: "/images/marking-icons/marker-icon-sem-pavimentacao_2.png",

      iconSize: [28, 41],
      iconAnchor: [19.2, 40],
      popupAnchor: [1, -34],
    }),
    nome: "Sem Pavimentação",
  },
};
