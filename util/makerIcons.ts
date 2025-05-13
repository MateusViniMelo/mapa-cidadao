import L from "leaflet";

export const markerIcons: Record<string, L.Icon> = {
  Iluminação: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [17.5, 28.7],
    iconAnchor: [8.4, 28.7],
    popupAnchor: [1, -34],
    shadowSize: [28.7, 28.7],
  }),
  Buraco: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [17.5, 28.7],
    iconAnchor: [8.4, 28.7],
    popupAnchor: [1, -34],
    shadowSize: [28.7, 28.7],
  }),
  Alagamento: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [17.5, 28.7],
    iconAnchor: [8.4, 28.7],
    popupAnchor: [1, -34],
    shadowSize: [28.7, 28.7],
  }),
  Lixo: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [17.5, 28.7],
    iconAnchor: [8.4, 28.7],
    popupAnchor: [1, -34],
    shadowSize: [28.7, 28.7],
  }),
  Outros: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [17.5, 28.7],
    iconAnchor: [8.4, 28.7],
    popupAnchor: [1, -34],
    shadowSize: [28.7, 28.7],
  }),
};
