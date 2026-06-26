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
}

export interface TurnoSummary {
  id: string;
  title: string;
  location: string | null;
  weekday: number;
  time_of_day: string;
  capacity: number;
  created_at: string;
  player_count: number;
  current_week: CurrentWeek | null;
}

export interface TurnoPlayer {
  id: string;
  name: string;
}

export interface SignupRow {
  player_id: string;
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
  players: TurnoPlayer[];
  current_week: CurrentWeek | null;
  signups: SignupRow[];
  now: string;
}

export interface PublicWeek {
  week_id: string;
  token: string;
  status: "open" | "closed";
  match_at: string;
  locks_at: string;
  now: string;
  title: string;
  location: string | null;
  capacity: number;
  players: TurnoPlayer[];
  signups: SignupRow[];
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
