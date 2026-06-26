import { supabase } from "./supabase";
import type { Match, Player, Signup } from "./types";

/** Devuelve el turno activo (el más reciente que esté "open"). */
export async function fetchActiveMatch(): Promise<Match | null> {
  const { data, error } = await supabase
    .from("mt_matches")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data && data.length > 0 ? (data[0] as Match) : null;
}

export async function fetchPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from("mt_players")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Player[];
}

export async function fetchSignups(matchId: string): Promise<Signup[]> {
  const { data, error } = await supabase
    .from("mt_signups")
    .select("*")
    .eq("match_id", matchId);
  if (error) throw error;
  return (data ?? []) as Signup[];
}

export async function confirmSpot(matchId: string, playerId: string) {
  const { data, error } = await supabase.rpc("mt_confirm", {
    p_match_id: matchId,
    p_player_id: playerId,
  });
  if (error) throw error;
  return data as Signup;
}

export async function dropSpot(matchId: string, playerId: string) {
  const { error } = await supabase.rpc("mt_drop", {
    p_match_id: matchId,
    p_player_id: playerId,
  });
  if (error) throw error;
}
