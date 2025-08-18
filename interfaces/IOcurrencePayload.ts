import type { ILocationPoint } from "./ILocationPoint";

export interface IOcurrencePayload {
  type_id: number;
  description: string;
  location: ILocationPoint
  address_name: string;
  city: string;
  state: string;
  country: string;
}
