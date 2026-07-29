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
    stats_token: string;
  };
  current_week: CurrentWeek | null;
  signups: AdminSignup[];
  now: string;
}

// ---- Estadísticas ----
export interface Goleador {
  name: string;
  goles: number;
  pj: number;
}
export interface Arquero {
  name: string;
  pj: number;
  goles_recibidos: number;
  vallas_invictas: number;
  prom: number;
}
export interface JugadorTabla {
  name: string;
  pj: number;
  g: number;
  e: number;
  p: number;
  goles: number;
  puntos: number;
}
export interface MatchPlayerView {
  name: string;
  goals: number;
  is_gk: boolean;
}
export interface PartidoView {
  id: string;
  played_on: string;
  team_a_name: string;
  team_b_name: string;
  score_a: number;
  score_b: number;
  mvp: string | null;
  team_a: MatchPlayerView[];
  team_b: MatchPlayerView[];
}
export interface Stats {
  goleadores: Goleador[];
  arqueros: Arquero[];
  jugadores: JugadorTabla[];
  partidos: PartidoView[];
  totales: { partidos: number; jugadores: number; goles: number };
}
export interface PublicStats {
  title: string;
  location: string | null;
  stats: Stats;
}

/** Payload para cargar un partido. */
export interface RecordMatchInput {
  played_on: string;
  team_a_name: string;
  team_b_name: string;
  score_a: number;
  score_b: number;
  mvp?: string;
  players: { name: string; team: "A" | "B"; goals: number; is_gk: boolean }[];
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
