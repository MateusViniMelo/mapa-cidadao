import type { IOcurrence } from "../IOcurrence";
import type { IPaginationLink } from "../IPaginationLink";

export interface MyOcurrencesResponse {
  current_page: number;
  data: IOcurrence[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: IPaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}
