import type { IOccurrence } from "../IOccurrence";

export interface MyOccurrencesResponse {
  data: IOccurrence[];
  page: number;
  per_page: number;
  total: number;
}
