// server/api/reverse-geocoding.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const lat = query.lat;
  const lon = query.lng;

  if (!lat || !lon) {
    return { error: "Coordenadas inválidas" };
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;

  const response = await $fetch(url, {
    headers: {
      "Accept-Language": "pt-BR",
      "User-Agent": "mapa-cidadao/1.0 (email.com@gmail.com)",
    },
  });

  return response;
});
