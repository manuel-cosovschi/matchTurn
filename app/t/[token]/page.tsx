"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { use } from "react";
import { supabase } from "@/lib/supabase";
import { confirmSpot, dropSpot, getWeek } from "@/lib/api";
import { formatMatchDate, timeUntil } from "@/lib/format";
import { PlayerList } from "@/components/PlayerList";
import type { PublicWeek } from "@/lib/types";

function storageKey(weekId: string) {
  return `mt_me_${weekId}`;
}

export default function PublicWeekPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [week, setWeek] = useState<PublicWeek | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const prevFree = useRef<number | null>(null);
  const [justFreed, setJustFreed] = useState(false);

  const load = useCallback(async () => {
    try {
      const w = await getWeek(token);
      if (!w) {
        setNotFound(true);
      } else {
        setWeek(w);
        setNotFound(false);
      }
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // reloj para el contador y el bloqueo a 1h
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // identidad guardada por semana
  useEffect(() => {
    if (week) setMeId(localStorage.getItem(storageKey(week.week_id)));
  }, [week]);

  // realtime sobre las confirmaciones de esta semana
  useEffect(() => {
    if (!week) return;
    const channel = supabase
      .channel(`mt_week_${week.week_id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mt_signups",
          filter: `week_id=eq.${week.week_id}`,
        },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [week, load]);

  const convocados = useMemo(
    () =>
      (week?.signups ?? [])
        .filter((s) => s.status === "convocado")
        .sort((a, b) => (a.confirmed_at ?? "").localeCompare(b.confirmed_at ?? "")),
    [week]
  );
  const suplentes = useMemo(
    () =>
      (week?.signups ?? [])
        .filter((s) => s.status === "suplente")
        .sort((a, b) => (a.confirmed_at ?? "").localeCompare(b.confirmed_at ?? "")),
    [week]
  );

  const capacity = week?.capacity ?? 14;
  const freeSlots = Math.max(0, capacity - convocados.length);
  const playerName = (id: string) =>
    week?.players.find((p) => p.id === id)?.name ?? "—";

  const signupByPlayer = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of week?.signups ?? []) m.set(s.player_id, s.status);
    return m;
  }, [week]);

  const sinConfirmar = useMemo(
    () =>
      (week?.players ?? []).filter((p) => {
        const st = signupByPlayer.get(p.id);
        return !st || st === "out";
      }),
    [week, signupByPlayer]
  );

  const me = meId ? week?.players.find((p) => p.id === meId) ?? null : null;
  const myStatus = meId ? signupByPlayer.get(meId) ?? "out" : "out";

  const locked =
    !!week &&
    (week.status !== "open" || nowMs >= new Date(week.locks_at).getTime());

  // aviso visual de lugar liberado
  useEffect(() => {
    if (myStatus === "suplente" && !locked) {
      if (prevFree.current !== null && freeSlots > prevFree.current) {
        setJustFreed(true);
        const t = setTimeout(() => setJustFreed(false), 8000);
        prevFree.current = freeSlots;
        return () => clearTimeout(t);
      }
    } else {
      setJustFreed(false);
    }
    prevFree.current = freeSlots;
  }, [freeSlots, myStatus, locked]);

  function chooseMe(id: string) {
    if (!week) return;
    localStorage.setItem(storageKey(week.week_id), id);
    setMeId(id);
  }
  function changeMe() {
    if (!week) return;
    localStorage.removeItem(storageKey(week.week_id));
    setMeId(null);
  }

  async function onConfirm() {
    if (!week || !meId) return;
    setActing(true);
    setError(null);
    try {
      await confirmSpot(week.token, meId);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo confirmar");
      await load();
    } finally {
      setActing(false);
    }
  }
  async function onDrop() {
    if (!week || !meId) return;
    if (!confirm("¿Seguro que te querés bajar del turno?")) return;
    setActing(true);
    setError(null);
    try {
      await dropSpot(week.token, meId);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo bajar");
      await load();
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md items-center justify-center p-6">
        <p className="animate-pulse text-emerald-300">Cargando…</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center p-6 text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="mt-3 text-xl font-bold text-white">Link no válido</h1>
        <p className="mt-2 text-sm text-gray-400">
          Este link no existe o ya no está activo. Pedile al organizador el link
          de esta semana.
        </p>
      </main>
    );
  }

  const countdown = week ? timeUntil(week.locks_at, nowMs) : null;

  return (
    <main className="mx-auto max-w-md px-4 pb-28 pt-6">
      <header className="mb-5 text-center">
        <h1 className="text-2xl font-black tracking-tight text-white">
          {week?.title} <span aria-hidden>⚽</span>
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

      <section className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
        <p className="capitalize text-sm text-gray-200">
          📅 {formatMatchDate(week!.match_at)}
        </p>
        {week?.location && (
          <p className="mt-0.5 text-sm text-gray-300">📍 {week.location}</p>
        )}

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
          {locked ? (
            <p className="mt-2 text-xs font-semibold text-red-300">
              🔒 Confirmaciones cerradas (falta menos de 1 hora). Equipo final.
            </p>
          ) : (
            <p className="mt-2 text-xs text-gray-400">
              Cierra {countdown ? `en ${countdown}` : "pronto"} (1 h antes del
              partido)
            </p>
          )}
        </div>
      </section>

      {/* Identidad / acción */}
      {!locked &&
        (!meId || !me ? (
          <section className="mb-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/5 p-5">
            <h3 className="mb-3 text-center text-base font-semibold text-white">
              ¿Quién sos?
            </h3>
            {week?.players.length === 0 ? (
              <p className="text-center text-sm text-gray-300">
                El organizador todavía no cargó los jugadores.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {week?.players.map((p) => (
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
          <section className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-300">
                Sos <span className="font-semibold text-white">{me.name}</span>
              </span>
              <button onClick={changeMe} className="text-xs text-gray-400 underline">
                cambiar
              </button>
            </div>

            {myStatus === "convocado" && (
              <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 p-4 text-center">
                <p className="text-lg font-bold text-emerald-300">
                  ✅ ¡Convocado al turno!
                </p>
                <p className="mt-1 text-sm text-emerald-100/80">
                  Estás en los titulares. Si no podés, bajate así entra otro.
                </p>
              </div>
            )}

            {myStatus === "suplente" && (
              <div
                className={`rounded-xl border p-4 text-center ${
                  justFreed || freeSlots > 0
                    ? "border-amber-300/60 bg-amber-400/20"
                    : "border-amber-400/30 bg-amber-500/10"
                }`}
              >
                <p className="text-base font-bold text-amber-200">
                  ⏳ No entraste a los {capacity} convocados
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

            {myStatus === "out" && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-gray-300">
                ¿Podés jugar? Confirmá tu lugar.
              </div>
            )}

            <div className="mt-4 flex gap-2">
              {myStatus === "convocado" || myStatus === "suplente" ? (
                <>
                  {myStatus === "suplente" && freeSlots > 0 && (
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
        ))}

      <PlayerList
        title="✅ Convocados"
        accent="emerald"
        items={convocados.map((s, i) => ({
          key: s.player_id,
          label: `${i + 1}. ${playerName(s.player_id)}`,
          me: s.player_id === meId,
        }))}
        empty="Nadie confirmado todavía."
      />
      <PlayerList
        title="⏳ Suplentes"
        accent="amber"
        items={suplentes.map((s, i) => ({
          key: s.player_id,
          label: `${i + 1}. ${playerName(s.player_id)}`,
          me: s.player_id === meId,
        }))}
        empty="Sin suplentes."
      />
      {!locked && (
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
      )}
    </main>
  );
}
