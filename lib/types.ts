export type SignupStatus = "convocado" | "suplente" | "out";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface CurrentWeek {
  id?: string;
  token: string;
  match_at: string;
  locks_at: string;
  status: "open" | "closed";
  cancelled: boolean;
}

export interface TurnoSummary {
  id: string;
  title: string;
  location: string | null;
  weekday: number;
  time_of_day: string;
  capacity: number;
  created_at: string;
  current_week: CurrentWeek | null;
}

/** Confirmación visible en el panel (incluye id para poder quitarla). */
export interface AdminSignup {
  id: string;
  name: string;
  status: SignupStatus;
  confirmed_at: string | null;
}

/** Confirmación visible en el link público (sin id). */
export interface PublicSignup {
  name: string;
  status: SignupStatus;
  confirmed_at: string | null;
}

export interface TurnoDetail {
  turno: {
    id: string;
    title: string;
    location: string | null;
    weekday: number;
    time_of_day: string;
    capacity: number;
    timezone: string;
  };
  current_week: CurrentWeek | null;
  signups: AdminSignup[];
  now: string;
}

export interface PublicWeek {
  week_id: string;
  token: string;
  status: "open" | "closed";
  cancelled: boolean;
  match_at: string;
  locks_at: string;
  now: string;
  title: string;
  location: string | null;
  capacity: number;
  signups: PublicSignup[];
}

export const WEEKDAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
