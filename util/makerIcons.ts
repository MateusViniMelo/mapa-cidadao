import L from "leaflet";

export const markerIcons: Record<string, L.Icon> = {
  Iluminação: new L.Icon({
    iconUrl: "/images/marking-icons/marker-icon-iluminacao.png",
    shadowUrl: "/images/marking-icons/marker-shadow.png",
    iconSize: [40, 40],
    iconAnchor: [19.2, 40],
    popupAnchor: [1, -34],
    shadowSize: [50, 25],
  }),
  Buraco: new L.Icon({
    iconUrl: "/images/marking-icons/marker-icon-buraco.png",
    shadowUrl: "/images/marking-icons/marker-shadow.png",
    iconSize: [40, 40],
    iconAnchor: [19.2, 40],
    popupAnchor: [1, -34],
    shadowSize: [50, 25],
  }),
  Alagamento: new L.Icon({
    iconUrl: "/images/marking-icons/marker-icon-alagamento.png",
    shadowUrl: "/images/marking-icons/marker-shadow.png",
    iconSize: [40, 40],
    iconAnchor: [19.2, 40],
    popupAnchor: [1, -34],
    shadowSize: [50, 25],
  }),
  Lixo: new L.Icon({
    iconUrl: "/images/marking-icons/marker-icon-lixo.png",
    shadowUrl: "/images/marking-icons/marker-shadow.png",
    iconSize: [40, 40],
    iconAnchor: [19.2, 40],
    popupAnchor: [1, -34],
    shadowSize: [50, 25],
  }),
  Padrao: new L.Icon({
    iconUrl: "/images/marking-icons/marker-icon-green.png",
    shadowUrl: "/images/marking-icons/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [35, 25],
  })
};
