"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  confirmSpot,
  dropSpot,
  fetchActiveMatch,
  fetchPlayers,
  fetchSignups,
} from "@/lib/queries";
import type { Match, Player, Signup } from "@/lib/types";

const STORAGE_KEY = "mt_player_id";

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HomePage() {
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const prevFreeSlots = useRef<number | null>(null);
  const [justFreed, setJustFreed] = useState(false);

  // Carga inicial
  const loadAll = useCallback(async () => {
    try {
      const m = await fetchActiveMatch();
      setMatch(m);
      const ps = await fetchPlayers();
      setPlayers(ps);
      if (m) {
        const su = await fetchSignups(m.id);
        setSignups(su);
      } else {
        setSignups([]);
      }
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMeId(localStorage.getItem(STORAGE_KEY));
    loadAll();
  }, [loadAll]);

  // Realtime: cualquier cambio en confirmaciones o en el turno -> recargar
  useEffect(() => {
    const channel = supabase
      .channel("mt_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mt_signups" },
        () => loadAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mt_matches" },
        () => loadAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mt_players" },
        () => loadAll()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAll]);

  const signupByPlayer = useMemo(() => {
    const map = new Map<string, Signup>();
    for (const s of signups) map.set(s.player_id, s);
    return map;
  }, [signups]);

  const convocados = useMemo(
    () =>
      signups
        .filter((s) => s.status === "convocado")
        .sort((a, b) => (a.confirmed_at ?? "").localeCompare(b.confirmed_at ?? "")),
    [signups]
  );
  const suplentes = useMemo(
    () =>
      signups
        .filter((s) => s.status === "suplente")
        .sort((a, b) => (a.confirmed_at ?? "").localeCompare(b.confirmed_at ?? "")),
    [signups]
  );

  const capacity = match?.capacity ?? 14;
  const freeSlots = Math.max(0, capacity - convocados.length);

  const sinConfirmar = useMemo(() => {
    return players.filter((p) => {
      const s = signupByPlayer.get(p.id);
      return !s || s.status === "out";
    });
  }, [players, signupByPlayer]);

  const playerName = useCallback(
    (id: string) => players.find((p) => p.id === id)?.name ?? "—",
    [players]
  );

  const me = meId ? players.find((p) => p.id === meId) ?? null : null;
  const mySignup = meId ? signupByPlayer.get(meId) ?? null : null;
  const myStatus = mySignup?.status ?? "out";

  // Aviso visual cuando se libera un lugar y soy suplente
  useEffect(() => {
    if (myStatus === "suplente") {
      if (prevFreeSlots.current !== null && freeSlots > prevFreeSlots.current) {
        setJustFreed(true);
        const t = setTimeout(() => setJustFreed(false), 8000);
        prevFreeSlots.current = freeSlots;
        return () => clearTimeout(t);
      }
    } else {
      setJustFreed(false);
    }
    prevFreeSlots.current = freeSlots;
  }, [freeSlots, myStatus]);

  function chooseMe(id: string) {
    localStorage.setItem(STORAGE_KEY, id);
    setMeId(id);
  }
  function changeMe() {
    localStorage.removeItem(STORAGE_KEY);
    setMeId(null);
  }

  async function onConfirm() {
    if (!match || !meId) return;
    setActing(true);
    setError(null);
    try {
      await confirmSpot(match.id, meId);
      await loadAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo confirmar");
    } finally {
      setActing(false);
    }
  }

  async function onDrop() {
    if (!match || !meId) return;
    if (!confirm("¿Seguro que te querés bajar del turno?")) return;
    setActing(true);
    setError(null);
    try {
      await dropSpot(match.id, meId);
      await loadAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo bajar");
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md items-center justify-center p-6">
        <p className="animate-pulse text-emerald-300">Cargando turno…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 pb-28 pt-6">
      {/* Header */}
      <header className="mb-5 text-center">
        <h1 className="text-3xl font-black tracking-tight text-white">
          MatchTurn <span aria-hidden>⚽</span>
        </h1>
        <p className="text-sm text-emerald-300/80">
          Los primeros {capacity} quedan convocados
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {!match ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-gray-300">
          Todavía no hay un turno abierto.{" "}
          <Link href="/admin" className="text-emerald-300 underline">
            Creá uno en el panel
          </Link>
          .
        </div>
      ) : (
        <>
          {/* Tarjeta del turno */}
          <section className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
            <h2 className="text-lg font-bold text-white">{match.title}</h2>
            <div className="mt-1 space-y-0.5 text-sm text-gray-300">
              {formatDate(match.scheduled_at) ? (
                <p className="capitalize">📅 {formatDate(match.scheduled_at)}</p>
              ) : (
                <p className="text-gray-400">📅 Fecha a definir</p>
              )}
              {match.location && <p>📍 {match.location}</p>}
            </div>

            {/* Contador */}
            <div className="mt-4">
              <div className="flex items-end justify-between">
                <span className="text-sm text-gray-300">Convocados</span>
                <span className="text-sm font-semibold text-white">
                  {convocados.length}/{capacity}
                </span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{
                    width: `${Math.min(100, (convocados.length / capacity) * 100)}%`,
                  }}
                />
              </div>
              {freeSlots > 0 && (
                <p className="mt-2 text-xs text-amber-300">
                  Hay {freeSlots} lugar{freeSlots > 1 ? "es" : ""} libre
                  {freeSlots > 1 ? "s" : ""} — confirmá para entrar.
                </p>
              )}
            </div>
          </section>

          {/* Identidad / acción */}
          {!meId || !me ? (
            <section className="mb-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/5 p-5">
              <h3 className="mb-3 text-center text-base font-semibold text-white">
                ¿Quién sos?
              </h3>
              {players.length === 0 ? (
                <p className="text-center text-sm text-gray-300">
                  Todavía no hay jugadores cargados.{" "}
                  <Link href="/admin" className="text-emerald-300 underline">
                    Cargalos en el panel
                  </Link>
                  .
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {players.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => chooseMe(p.id)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-white transition hover:border-emerald-400/50 hover:bg-emerald-500/10"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <MyStatusCard
              name={me.name}
              status={myStatus}
              freeSlots={freeSlots}
              justFreed={justFreed}
              acting={acting}
              onConfirm={onConfirm}
              onDrop={onDrop}
              onChange={changeMe}
            />
          )}

          {/* Listas */}
          <PlayerList
            title="✅ Convocados"
            accent="emerald"
            items={convocados.map((s, i) => ({
              key: s.id,
              label: `${i + 1}. ${playerName(s.player_id)}`,
              me: s.player_id === meId,
            }))}
            empty="Nadie confirmado todavía."
          />

          <PlayerList
            title="⏳ Suplentes"
            accent="amber"
            items={suplentes.map((s, i) => ({
              key: s.id,
              label: `${i + 1}. ${playerName(s.player_id)}`,
              me: s.player_id === meId,
            }))}
            empty="Sin suplentes."
          />

          <PlayerList
            title="⚪ Sin confirmar"
            accent="slate"
            items={sinConfirmar.map((p) => ({
              key: p.id,
              label: p.name,
              me: p.id === meId,
            }))}
            empty="Todos respondieron."
          />
        </>
      )}

      <footer className="mt-8 text-center">
        <Link href="/admin" className="text-xs text-gray-500 underline">
          Panel de administración
        </Link>
      </footer>
    </main>
  );
}

function MyStatusCard({
  name,
  status,
  freeSlots,
  justFreed,
  acting,
  onConfirm,
  onDrop,
  onChange,
}: {
  name: string;
  status: string;
  freeSlots: number;
  justFreed: boolean;
  acting: boolean;
  onConfirm: () => void;
  onDrop: () => void;
  onChange: () => void;
}) {
  return (
    <section className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-gray-300">
          Sos <span className="font-semibold text-white">{name}</span>
        </span>
        <button onClick={onChange} className="text-xs text-gray-400 underline">
          cambiar
        </button>
      </div>

      {status === "convocado" && (
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 p-4 text-center">
          <p className="text-lg font-bold text-emerald-300">
            ✅ ¡Convocado al turno!
          </p>
          <p className="mt-1 text-sm text-emerald-100/80">
            Estás dentro de los titulares. Si no podés, bajate así entra otro.
          </p>
        </div>
      )}

      {status === "suplente" && (
        <div
          className={`rounded-xl border p-4 text-center ${
            justFreed || freeSlots > 0
              ? "border-amber-300/60 bg-amber-400/20"
              : "border-amber-400/30 bg-amber-500/10"
          }`}
        >
          <p className="text-base font-bold text-amber-200">
            ⏳ No entraste a los convocados
          </p>
          <p className="mt-1 text-sm text-amber-100/80">
            Te avisamos si se baja uno para que confirmes lo antes posible.
          </p>
          {freeSlots > 0 && (
            <p className="mt-2 animate-pulse text-sm font-semibold text-amber-100">
              ¡Se liberó un lugar! Tocá “Tomar lugar” ahora 👇
            </p>
          )}
        </div>
      )}

      {status === "out" && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-gray-300">
          No confirmaste todavía. ¿Podés jugar?
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {status === "convocado" || status === "suplente" ? (
          <>
            {status === "suplente" && freeSlots > 0 && (
              <button
                disabled={acting}
                onClick={onConfirm}
                className="flex-1 rounded-xl bg-amber-400 px-4 py-3 font-bold text-black transition active:scale-95 disabled:opacity-50"
              >
                {acting ? "…" : "Tomar lugar"}
              </button>
            )}
            <button
              disabled={acting}
              onClick={onDrop}
              className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-semibold text-white transition active:scale-95 disabled:opacity-50"
            >
              {acting ? "…" : "Bajarme"}
            </button>
          </>
        ) : (
          <button
            disabled={acting}
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-emerald-400 px-4 py-3 font-bold text-black transition active:scale-95 disabled:opacity-50"
          >
            {acting ? "Confirmando…" : "Confirmar que puedo jugar"}
          </button>
        )}
      </div>
    </section>
  );
}

function PlayerList({
  title,
  accent,
  items,
  empty,
}: {
  title: string;
  accent: "emerald" | "amber" | "slate";
  items: { key: string; label: string; me: boolean }[];
  empty: string;
}) {
  const border =
    accent === "emerald"
      ? "border-emerald-400/20"
      : accent === "amber"
      ? "border-amber-400/20"
      : "border-white/10";
  return (
    <section className={`mb-4 rounded-2xl border ${border} bg-white/[0.03] p-4`}>
      <h3 className="mb-2 text-sm font-semibold text-gray-200">
        {title}{" "}
        <span className="text-gray-500">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-gray-500">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((it) => (
            <li
              key={it.key}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                it.me
                  ? "bg-white/10 font-semibold text-white"
                  : "text-gray-200"
              }`}
            >
              {it.label}
              {it.me && <span className="ml-1 text-emerald-300">· vos</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
