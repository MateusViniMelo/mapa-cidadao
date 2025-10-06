import type { ILocationPoint } from "./ILocationPoint";
import type { ITypeOcurrence } from "./ITypeOcurrence";

export interface IOcurrence {
  id: number;
  location: ILocationPoint;
  type_id: number;
  type: ITypeOcurrence
  user_id: number;
  description: string;
  address_name: string;
  city: string;
  country: string;
  state: string;
  is_active: boolean;
  created_at: string; 
  updated_at: string; 
  type_closure: string | null;
  solution_description: string | null;
  resolution_date: string | null;

}
