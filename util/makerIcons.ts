import L from "leaflet";

export const markerIcons: Record<string, L.Icon> = {
  Iluminação: new L.Icon({
    iconUrl: "/images/marking-icons/marker-icon-yellow.png",
    shadowUrl: "/images/marking-icons/marker-shadow.png",
    iconSize: [17.5, 28.7],
    iconAnchor: [8.4, 28.7],
    popupAnchor: [1, -34],
    shadowSize: [28.7, 28.7],
  }),
  Buraco: new L.Icon({
    iconUrl: "/images/marking-icons/marker-icon-orange.png",
    shadowUrl: "/images/marking-icons/marker-shadow.png",
    iconSize: [17.5, 28.7],
    iconAnchor: [8.4, 28.7],
    popupAnchor: [1, -34],
    shadowSize: [28.7, 28.7],
  }),
  Alagamento: new L.Icon({
    iconUrl: "/images/marking-icons/marker-icon-blue.png",
    shadowUrl: "/images/marking-icons/marker-shadow.png",
    iconSize: [17.5, 28.7],
    iconAnchor: [8.4, 28.7],
    popupAnchor: [1, -34],
    shadowSize: [28.7, 28.7],
  }),
  Lixo: new L.Icon({
    iconUrl: "/images/marking-icons/marker-icon-black.png",
    shadowUrl: "/images/marking-icons/marker-shadow.png",
    iconSize: [17.5, 28.7],
    iconAnchor: [8.4, 28.7],
    popupAnchor: [1, -34],
    shadowSize: [28.7, 28.7],
  }),
  Padrao: new L.Icon({
    iconUrl: "/images/marking-icons/marker-icon-green.png",
    shadowUrl: "/images/marking-icons/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  Outros: new L.Icon({
    iconUrl: "/images/marking-icons/marker-icon-grey.png",
    shadowUrl: "/images/marking-icons/marker-shadow.png",
    iconSize: [17.5, 28.7],
    iconAnchor: [8.4, 28.7],
    popupAnchor: [1, -34],
    shadowSize: [28.7, 28.7],
  }),
};
