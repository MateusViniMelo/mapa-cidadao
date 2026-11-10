export type MarkerIcon = {
  iconUrl: string;
  iconSize: [number, number];
  iconAnchor: [number, number];
  nome: string;
};

export const markerIcons: Record<string, MarkerIcon> = {
  1: {
    iconUrl: "/images/marking-icons/marker-icon-iluminacao_2.png",
    iconSize: [28, 41],
    iconAnchor: [19.2, 40],
    nome: "Problema de Iluminação",
  },
  2: {
    iconUrl: "/images/marking-icons/marker-icon-buraco_2.png",
    iconSize: [28, 41],
    iconAnchor: [19.2, 40],
    nome: "Problema de Pavimentação",
  },
  3: {
    iconUrl: "/images/marking-icons/marker-icon-alagamento_2.png",
    iconSize: [28, 41],
    iconAnchor: [19.2, 40],
    nome: "Alagamento",
  },
  4: {
    iconUrl: "/images/marking-icons/marker-icon-lixo_2.png",
    iconSize: [28, 41],
    iconAnchor: [19.2, 40],
    nome: "Lixo",
  },
  Padrao: {
    iconUrl: "/images/marking-icons/marker-icon-padrao_2.png",
    iconSize: [33.6, 48],
    iconAnchor: [23.04, 48],
    nome: "Problema Desconhecido",
  },
  5: {
    iconUrl: "/images/marking-icons/marker-icon-sem-pavimentacao_2.png",
    iconSize: [28, 41],
    iconAnchor: [19.2, 40],
    nome: "Sem Pavimentação",
  },
};

export function markerFor(typeId: number | string) {
  return markerIcons[String(typeId)] ?? markerIcons.Padrao;
}

export function legendMarkers() {
  return Object.entries(markerIcons)
    .filter(([key]) => key !== "Padrao")
    .map(([, icon]) => icon);
}
