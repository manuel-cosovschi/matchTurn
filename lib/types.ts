export type SignupStatus = "convocado" | "suplente" | "out";

export interface Player {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Match {
  id: string;
  title: string;
  location: string | null;
  scheduled_at: string | null;
  capacity: number;
  status: string;
  created_at: string;
}

export interface Signup {
  id: string;
  match_id: string;
  player_id: string;
  status: SignupStatus;
  confirmed_at: string | null;
  updated_at: string;
}
