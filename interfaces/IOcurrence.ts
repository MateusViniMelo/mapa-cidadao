import type { ILocationPoint } from "./ILocationPoint";

export interface IOcurrence {
  id: number;
  type_id: number;
  user_id: number;
  description: string;
  location: ILocationPoint;
  address_name: string;
  city: string;
  state: string;
  country: string;
  is_active?: boolean;
  created_at: Date;
  updated_at: Date;
}
