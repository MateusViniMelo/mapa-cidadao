import L from "leaflet";

export const markerIcons: Record<string, { icon: L.Icon; nome: string }> = {
  Iluminação: {
    icon: new L.Icon({
      iconUrl: "/images/marking-icons/marker-icon-iluminacao.png",
      shadowUrl: "/images/marking-icons/marker-shadow.png",
      iconSize: [40, 40],
      iconAnchor: [19.2, 40],
      popupAnchor: [1, -34],
      shadowSize: [50, 25],
    }),
    nome: "Problema de Iluminação",
  },
  Buraco: {
    icon: new L.Icon({
      iconUrl: "/images/marking-icons/marker-icon-buraco.png",
      shadowUrl: "/images/marking-icons/marker-shadow.png",
      iconSize: [40, 40],
      iconAnchor: [19.2, 40],
      popupAnchor: [1, -34],
      shadowSize: [50, 25],
    }),
    nome: "Problema de Pavimentação",
  },
  Alagamento: {
    icon: new L.Icon({
      iconUrl: "/images/marking-icons/marker-icon-alagamento.png",
      shadowUrl: "/images/marking-icons/marker-shadow.png",
      iconSize: [40, 40],
      iconAnchor: [19.2, 40],
      popupAnchor: [1, -34],
      shadowSize: [50, 25],
    }),
    nome: "Alagamento",
  },
  Lixo: {
    icon: new L.Icon({
      iconUrl: "/images/marking-icons/marker-icon-lixo.png",
      shadowUrl: "/images/marking-icons/marker-shadow.png",
      iconSize: [40, 40],
      iconAnchor: [19.2, 40],
      popupAnchor: [1, -34],
      shadowSize: [50, 25],
    }),
    nome: "Lixo",
  },
  Padrao: {
    icon: new L.Icon({
      iconUrl: "/images/marking-icons/marker-icon-padrao_2.png",
      shadowUrl: "/images/marking-icons/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [35, 25],
    }),
    nome: "Problema Desconhecido",
  },
  SemPavimentacao: {
    icon: new L.Icon({
      iconUrl: "/images/marking-icons/marker-icon-sem-pavimentacao.png",
      shadowUrl: "/images/marking-icons/marker-shadow.png",
      iconSize: [40, 40],
      iconAnchor: [19.2, 40],
      popupAnchor: [1, -34],
      shadowSize: [50, 25],
    }),
    nome: "Sem Pavimentação",
  },
};

