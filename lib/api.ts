import { supabase } from "./supabase";
import type {
  PublicWeek,
  SignupStatus,
  TurnoDetail,
  TurnoSummary,
  User,
} from "./types";

const SESSION_KEY = "mt_session";

export function getSession(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}
export function setSession(token: string) {
  localStorage.setItem(SESSION_KEY, token);
}
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function unwrap<T>(data: T, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  return data;
}

// ---- Auth ----
export async function register(email: string, password: string, name: string) {
  const { data, error } = await supabase.rpc("mt_register", {
    p_email: email,
    p_password: password,
    p_name: name,
  });
  const token = unwrap(data, error) as string;
  setSession(token);
  return token;
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.rpc("mt_login", {
    p_email: email,
    p_password: password,
  });
  const token = unwrap(data, error) as string;
  setSession(token);
  return token;
}

export async function logout() {
  const s = getSession();
  if (s) await supabase.rpc("mt_logout", { p_session: s });
  clearSession();
}

export async function me(): Promise<User | null> {
  const s = getSession();
  if (!s) return null;
  const { data, error } = await supabase.rpc("mt_me", { p_session: s });
  if (error) return null;
  return data as User | null;
}

// ---- Turnos (panel) ----
export async function listTurnos(): Promise<TurnoSummary[]> {
  const s = getSession();
  const { data, error } = await supabase.rpc("mt_list_turnos", { p_session: s });
  return unwrap(data, error) as TurnoSummary[];
}

export async function createTurno(input: {
  title: string;
  location: string;
  weekday: number;
  time: string;
  capacity: number;
  tz?: string;
}): Promise<string> {
  const s = getSession();
  const { data, error } = await supabase.rpc("mt_create_turno", {
    p_session: s,
    p_title: input.title,
    p_location: input.location,
    p_weekday: input.weekday,
    p_time: input.time,
    p_capacity: input.capacity,
    p_tz: input.tz ?? "America/Argentina/Buenos_Aires",
  });
  return unwrap(data, error) as string;
}

export async function updateTurno(input: {
  id: string;
  title: string;
  location: string;
  weekday: number;
  time: string;
  capacity: number;
}) {
  const s = getSession();
  const { error } = await supabase.rpc("mt_update_turno", {
    p_session: s,
    p_turno_id: input.id,
    p_title: input.title,
    p_location: input.location,
    p_weekday: input.weekday,
    p_time: input.time,
    p_capacity: input.capacity,
  });
  if (error) throw new Error(error.message);
}

export async function deleteTurno(id: string) {
  const s = getSession();
  const { error } = await supabase.rpc("mt_delete_turno", {
    p_session: s,
    p_turno_id: id,
  });
  if (error) throw new Error(error.message);
}

export async function turnoDetail(turnoId: string): Promise<TurnoDetail> {
  const s = getSession();
  const { data, error } = await supabase.rpc("mt_turno_detail", {
    p_session: s,
    p_turno_id: turnoId,
  });
  return unwrap(data, error) as TurnoDetail;
}

export async function addPlayer(turnoId: string, name: string) {
  const s = getSession();
  const { error } = await supabase.rpc("mt_add_player", {
    p_session: s,
    p_turno_id: turnoId,
    p_name: name,
  });
  if (error) throw new Error(error.message);
}

export async function removePlayer(playerId: string) {
  const s = getSession();
  const { error } = await supabase.rpc("mt_remove_player", {
    p_session: s,
    p_player_id: playerId,
  });
  if (error) throw new Error(error.message);
}

export async function generateWeek(turnoId: string): Promise<string> {
  const s = getSession();
  const { data, error } = await supabase.rpc("mt_generate_week", {
    p_session: s,
    p_turno_id: turnoId,
  });
  return unwrap(data, error) as string;
}

// ---- Público (link de jugadores) ----
export async function getWeek(token: string): Promise<PublicWeek | null> {
  const { data, error } = await supabase.rpc("mt_get_week", { p_token: token });
  if (error) throw new Error(error.message);
  return data as PublicWeek | null;
}

export async function confirmSpot(
  token: string,
  playerId: string
): Promise<SignupStatus> {
  const { data, error } = await supabase.rpc("mt_confirm", {
    p_token: token,
    p_player_id: playerId,
  });
  return unwrap(data, error) as SignupStatus;
}

export async function dropSpot(token: string, playerId: string) {
  const { error } = await supabase.rpc("mt_drop", {
    p_token: token,
    p_player_id: playerId,
  });
  if (error) throw new Error(error.message);
}
