import type { ILocationPoint } from "./ILocationPoint";
import type { ITypeOccurrence } from "./ITypeOccurrence";

export interface IOccurrence {
  id: number;
  location: ILocationPoint;
  type_id: number;
  type: ITypeOccurrence;
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
  liked_by_auth_user: boolean;
  likes_count: number;
}
