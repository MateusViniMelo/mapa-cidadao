import { defineEventHandler, getQuery, setResponseStatus } from "h3";
import {
  fetchNominatimPlace,
  parseLatitude,
  parseLongitude,
  reverseGeocodePoint,
} from "../domain/geo/reverse-geocode";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const latitude = parseLatitude(query.lat);
  const longitude = parseLongitude(query.lng);

  if (latitude === null || longitude === null) {
    setResponseStatus(event, 400);
    return { error: "Coordenadas inválidas" };
  }

  return reverseGeocodePoint(latitude, longitude, fetchNominatimPlace);
});
