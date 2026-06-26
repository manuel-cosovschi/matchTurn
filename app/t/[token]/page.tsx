"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { confirmSpot, dropSpot, getWeek } from "@/lib/api";
import { formatMatchDate, timeUntil } from "@/lib/format";
import { PlayerList } from "@/components/PlayerList";
import type { PublicWeek } from "@/lib/types";

function nameKey(n: string) {
  return n.trim().toLowerCase();
}
function storageKey(weekId: string) {
  return `mt_name_${weekId}`;
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
  const [myName, setMyName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [acting, setActing] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const prevFree = useRef<number | null>(null);
  const [justFreed, setJustFreed] = useState(false);

  const load = useCallback(async () => {
    try {
      const w = await getWeek(token);
      if (!w) setNotFound(true);
      else {
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

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (week) setMyName(localStorage.getItem(storageKey(week.week_id)));
  }, [week]);

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

  const mySignup = useMemo(() => {
    if (!myName || !week) return null;
    const k = nameKey(myName);
    return week.signups.find((s) => nameKey(s.name) === k) ?? null;
  }, [myName, week]);
  const myStatus = mySignup?.status ?? "out";

  const cancelled = !!week && week.cancelled;
  const locked =
    !!week &&
    (cancelled ||
      week.status !== "open" ||
      nowMs >= new Date(week.locks_at).getTime());

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

  function forget() {
    if (!week) return;
    localStorage.removeItem(storageKey(week.week_id));
    setMyName(null);
    setNameInput("");
  }

  async function onConfirmNew(e: React.FormEvent) {
    e.preventDefault();
    if (!week) return;
    const n = nameInput.trim();
    if (!n) return;
    setActing(true);
    setError(null);
    try {
      const res = await confirmSpot(week.token, n);
      localStorage.setItem(storageKey(week.week_id), res.name);
      setMyName(res.name);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo confirmar");
      await load();
    } finally {
      setActing(false);
    }
  }

  async function onReconfirm() {
    if (!week || !myName) return;
    setActing(true);
    setError(null);
    try {
      const res = await confirmSpot(week.token, myName);
      localStorage.setItem(storageKey(week.week_id), res.name);
      setMyName(res.name);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo confirmar");
      await load();
    } finally {
      setActing(false);
    }
  }

  async function onDrop() {
    if (!week || !myName) return;
    if (!confirm("¿Seguro que te querés bajar del turno?")) return;
    setActing(true);
    setError(null);
    try {
      await dropSpot(week.token, myName);
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
          {cancelled ? (
            <p className="mt-2 text-xs font-semibold text-red-300">
              ❌ Esta fecha no se juega.
            </p>
          ) : locked ? (
            <p className="mt-2 text-xs font-semibold text-red-300">
              🔒 Confirmaciones cerradas (falta menos de 24 h). Equipo final.
            </p>
          ) : (
            <p className="mt-2 text-xs text-gray-400">
              Cierra {countdown ? `en ${countdown}` : "pronto"} (24 h antes del
              partido)
            </p>
          )}
        </div>
      </section>

      {cancelled && (
        <section className="mb-5 rounded-2xl border border-red-400/40 bg-red-500/10 p-6 text-center">
          <p className="text-3xl">❌</p>
          <p className="mt-2 text-lg font-bold text-red-200">
            Esta fecha no se juega
          </p>
          <p className="mt-1 text-sm text-red-100/80">
            El organizador suspendió el partido de esta semana.
          </p>
        </section>
      )}

      {/* Acción del jugador */}
      {!locked &&
        (!myName || myStatus === "out" ? (
          <section className="mb-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/5 p-5">
            {myName && myStatus === "out" ? (
              <>
                <p className="mb-3 text-center text-sm text-gray-200">
                  Te habías bajado. ¿Querés volver a anotarte como{" "}
                  <span className="font-semibold text-white">{myName}</span>?
                </p>
                <button
                  onClick={onReconfirm}
                  disabled={acting}
                  className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-black disabled:opacity-50"
                >
                  {acting ? "Confirmando…" : "Confirmar de nuevo"}
                </button>
                <button
                  onClick={forget}
                  className="mt-3 w-full text-center text-xs text-gray-400 underline"
                >
                  no soy {myName}
                </button>
              </>
            ) : (
              <>
                <h3 className="mb-3 text-center text-base font-semibold text-white">
                  Escribí tu nombre para confirmar
                </h3>
                <form onSubmit={onConfirmNew} className="flex flex-col gap-2">
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Tu nombre y apellido"
                    maxLength={40}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  />
                  <button
                    type="submit"
                    disabled={acting || !nameInput.trim()}
                    className="rounded-xl bg-emerald-400 px-4 py-3 font-bold text-black transition active:scale-95 disabled:opacity-50"
                  >
                    {acting ? "Confirmando…" : "Confirmar que puedo jugar"}
                  </button>
                </form>
                <p className="mt-2 text-center text-xs text-gray-500">
                  Si tu nombre ya aparece en la lista, agregá tu apellido o
                  inicial.
                </p>
              </>
            )}
          </section>
        ) : (
          <section className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-300">
                Sos <span className="font-semibold text-white">{myName}</span>
              </span>
              <button onClick={forget} className="text-xs text-gray-400 underline">
                no soy
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

            <div className="mt-4 flex gap-2">
              {myStatus === "suplente" && freeSlots > 0 && (
                <button
                  disabled={acting}
                  onClick={onReconfirm}
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
            </div>
          </section>
        ))}

      {!cancelled && (
        <>
          <PlayerList
            title="✅ Convocados"
            accent="emerald"
            items={convocados.map((s, i) => ({
              key: s.name + i,
              label: `${i + 1}. ${s.name}`,
              me: myName ? nameKey(s.name) === nameKey(myName) : false,
            }))}
            empty="Nadie confirmado todavía. ¡Sé el primero!"
          />
          <PlayerList
            title="⏳ Suplentes"
            accent="amber"
            items={suplentes.map((s, i) => ({
              key: s.name + i,
              label: `${i + 1}. ${s.name}`,
              me: myName ? nameKey(s.name) === nameKey(myName) : false,
            }))}
            empty="Sin suplentes."
          />
        </>
      )}

      <footer className="mt-10 border-t border-white/10 pt-5 text-center">
        <Link
          href="/"
          target="_blank"
          className="inline-block rounded-xl border border-emerald-400/30 bg-emerald-500/5 px-4 py-2.5 text-sm text-emerald-200 transition hover:bg-emerald-500/10"
        >
          Hecho con <span className="font-bold">MatchTurn</span> ⚽ — armá tu
          turno fijo gratis →
        </Link>
      </footer>
    </main>
  );
}
