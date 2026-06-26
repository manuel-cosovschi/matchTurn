"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  addPlayer,
  createTurno,
  deleteTurno,
  generateWeek,
  listTurnos,
  logout,
  me,
  removePlayer,
  turnoDetail,
} from "@/lib/api";
import { formatMatchDate, formatSchedule, timeUntil } from "@/lib/format";
import { PlayerList } from "@/components/PlayerList";
import { WEEKDAYS } from "@/lib/types";
import type { TurnoDetail, TurnoSummary, User } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [turnos, setTurnos] = useState<TurnoSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const loadTurnos = useCallback(async () => {
    setTurnos(await listTurnos());
  }, []);

  useEffect(() => {
    (async () => {
      const u = await me();
      if (!u) {
        router.replace("/login");
        return;
      }
      setUser(u);
      await loadTurnos();
      setReady(true);
    })();
  }, [router, loadTurnos]);

  async function onLogout() {
    await logout();
    router.replace("/");
  }

  if (!ready) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md items-center justify-center p-6">
        <p className="animate-pulse text-emerald-300">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Mi panel</h1>
          <p className="text-xs text-gray-400">{user?.name}</p>
        </div>
        <button onClick={onLogout} className="text-xs text-gray-400 underline">
          salir
        </button>
      </div>

      {selected ? (
        <TurnoView
          turnoId={selected}
          onBack={() => {
            setSelected(null);
            loadTurnos();
          }}
          onDeleted={() => {
            setSelected(null);
            loadTurnos();
          }}
        />
      ) : (
        <TurnoListView
          turnos={turnos}
          onOpen={(id) => setSelected(id)}
          onCreated={loadTurnos}
        />
      )}
    </main>
  );
}

// ---------------- Lista + crear ----------------
function TurnoListView({
  turnos,
  onOpen,
  onCreated,
}: {
  turnos: TurnoSummary[];
  onOpen: (id: string) => void;
  onCreated: () => void;
}) {
  const [showForm, setShowForm] = useState(turnos.length === 0);

  return (
    <>
      {turnos.length > 0 && (
        <div className="mb-4 space-y-3">
          {turnos.map((t) => (
            <button
              key={t.id}
              onClick={() => onOpen(t.id)}
              className="block w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-emerald-400/40"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">{t.title}</h3>
                <span className="text-xs text-emerald-300">abrir →</span>
              </div>
              <p className="mt-0.5 text-sm text-gray-300">
                {formatSchedule(t.weekday, t.time_of_day)} · cupo {t.capacity}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {t.player_count} jugador{t.player_count === 1 ? "" : "es"} ·{" "}
                {t.current_week
                  ? "link de la semana activo"
                  : "sin link generado"}
              </p>
            </button>
          ))}
        </div>
      )}

      {showForm ? (
        <CreateTurnoForm
          onCancel={turnos.length > 0 ? () => setShowForm(false) : undefined}
          onCreated={() => {
            setShowForm(false);
            onCreated();
          }}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 font-semibold text-emerald-200"
        >
          + Nuevo turno fijo
        </button>
      )}
    </>
  );
}

function CreateTurnoForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState("Turno fijo de los amigos");
  const [location, setLocation] = useState("");
  const [weekday, setWeekday] = useState(6);
  const [time, setTime] = useState("20:00");
  const [capacity, setCapacity] = useState(14);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createTurno({ title, location, weekday, time, capacity });
      onCreated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-white/10 bg-white/5 p-5"
    >
      <h2 className="mb-3 text-base font-bold text-white">Nuevo turno fijo</h2>
      {error && (
        <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
      <Field label="Nombre del turno">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Cancha / lugar">
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Cancha La Bombonerita"
          className="input"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Día">
          <select
            value={weekday}
            onChange={(e) => setWeekday(parseInt(e.target.value))}
            className="input"
          >
            {WEEKDAYS.map((d, i) => (
              <option key={i} value={i}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Hora">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="input"
          />
        </Field>
      </div>
      <Field label="Cupo de titulares">
        <input
          type="number"
          min={1}
          value={capacity}
          onChange={(e) => setCapacity(parseInt(e.target.value) || 14)}
          className="input"
        />
      </Field>
      <div className="mt-2 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl bg-emerald-400 px-4 py-3 font-bold text-black disabled:opacity-50"
        >
          {loading ? "Creando…" : "Crear turno"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/15 px-4 py-3 text-sm text-gray-300"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

// ---------------- Detalle de un turno ----------------
function TurnoView({
  turnoId,
  onBack,
  onDeleted,
}: {
  turnoId: string;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const [detail, setDetail] = useState<TurnoDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());

  const load = useCallback(async () => {
    try {
      setDetail(await turnoDetail(turnoId));
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }, [turnoId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // realtime de confirmaciones
  useEffect(() => {
    const channel = supabase
      .channel(`mt_dash_${turnoId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mt_signups" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [turnoId, load]);

  const week = detail?.current_week ?? null;
  const capacity = detail?.turno.capacity ?? 14;

  const link =
    week && typeof window !== "undefined"
      ? `${window.location.origin}/t/${week.token}`
      : "";

  const convocados = useMemo(
    () =>
      (detail?.signups ?? [])
        .filter((s) => s.status === "convocado")
        .sort((a, b) => (a.confirmed_at ?? "").localeCompare(b.confirmed_at ?? "")),
    [detail]
  );
  const suplentes = useMemo(
    () =>
      (detail?.signups ?? [])
        .filter((s) => s.status === "suplente")
        .sort((a, b) => (a.confirmed_at ?? "").localeCompare(b.confirmed_at ?? "")),
    [detail]
  );
  const playerName = (id: string) =>
    detail?.players.find((p) => p.id === id)?.name ?? "—";

  const locked =
    !!week &&
    (week.status !== "open" || nowMs >= new Date(week.locks_at).getTime());

  async function onAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    const names = newName
      .split(/[\n,]/)
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      for (const n of names) await addPlayer(turnoId, n);
      setNewName("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function onRemovePlayer(id: string, name: string) {
    if (!confirm(`¿Quitar a ${name}?`)) return;
    setBusy(true);
    try {
      await removePlayer(id);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function onGenerate() {
    if (
      week &&
      !confirm(
        "Esto genera un link NUEVO para la próxima semana y desactiva el anterior. ¿Seguir?"
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      await generateWeek(turnoId);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function onDelete() {
    if (!confirm("¿Eliminar este turno fijo y todo su historial?")) return;
    await deleteTurno(turnoId);
    onDeleted();
  }

  if (!detail) {
    return (
      <div>
        <button onClick={onBack} className="mb-4 text-sm text-emerald-300">
          ← Volver
        </button>
        {error ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : (
          <p className="animate-pulse text-emerald-300">Cargando…</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-sm text-emerald-300">
        ← Mis turnos
      </button>

      <h2 className="text-xl font-black text-white">{detail.turno.title}</h2>
      <p className="text-sm text-gray-300">
        {formatSchedule(detail.turno.weekday, detail.turno.time_of_day)} · cupo{" "}
        {capacity}
        {detail.turno.location ? ` · ${detail.turno.location}` : ""}
      </p>

      {error && (
        <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {/* Link de la semana */}
      <section className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/5 p-5">
        <h3 className="text-base font-bold text-white">Link de la semana</h3>
        {week ? (
          <>
            <p className="mt-1 text-sm capitalize text-gray-300">
              📅 {formatMatchDate(week.match_at)}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              {locked
                ? "🔒 Confirmaciones cerradas (equipo final)."
                : `Cierra ${
                    timeUntil(week.locks_at, nowMs)
                      ? "en " + timeUntil(week.locks_at, nowMs)
                      : "pronto"
                  } · 1 h antes del partido`}
            </p>

            <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
              <span className="flex-1 truncate text-xs text-gray-300">
                {link}
              </span>
              <button
                onClick={onCopy}
                className="shrink-0 rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-bold text-black"
              >
                {copied ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <Link
                href={`/t/${week.token}`}
                target="_blank"
                className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-center text-xs text-gray-200"
              >
                Abrir vista de jugadores
              </Link>
              <button
                onClick={onGenerate}
                disabled={busy}
                className="flex-1 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 disabled:opacity-50"
              >
                Generar nuevo
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-gray-300">
              Todavía no generaste el link de esta semana.
              {detail.players.length === 0 &&
                " Primero cargá los jugadores abajo."}
            </p>
            <button
              onClick={onGenerate}
              disabled={busy || detail.players.length === 0}
              className="mt-3 w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-black disabled:opacity-50"
            >
              Generar link de la semana
            </button>
          </>
        )}
      </section>

      {/* Confirmaciones en vivo */}
      {week && (
        <section className="mt-5">
          <div className="mb-2 flex items-end justify-between">
            <h3 className="text-base font-bold text-white">En vivo</h3>
            <span className="text-sm font-semibold text-white">
              {convocados.length}/{capacity} convocados
            </span>
          </div>
          <PlayerList
            title="✅ Convocados"
            accent="emerald"
            items={convocados.map((s, i) => ({
              key: s.player_id,
              label: `${i + 1}. ${playerName(s.player_id)}`,
            }))}
            empty="Nadie confirmado todavía."
          />
          <PlayerList
            title="⏳ Suplentes"
            accent="amber"
            items={suplentes.map((s, i) => ({
              key: s.player_id,
              label: `${i + 1}. ${playerName(s.player_id)}`,
            }))}
            empty="Sin suplentes."
          />
        </section>
      )}

      {/* Plantel */}
      <section className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="mb-3 text-base font-bold text-white">
          Plantel <span className="text-gray-500">({detail.players.length})</span>
        </h3>
        <form onSubmit={onAddPlayer}>
          <textarea
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            rows={2}
            placeholder="Agregar jugadores (uno por línea o separados por coma)"
            className="input mb-2 w-full"
          />
          <button
            type="submit"
            disabled={busy}
            className="mb-4 w-full rounded-xl bg-white/10 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            Agregar
          </button>
        </form>
        <ul className="space-y-1">
          {detail.players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-200"
            >
              <span>{p.name}</span>
              <button
                onClick={() => onRemovePlayer(p.id, p.name)}
                className="text-xs text-red-300 hover:text-red-200"
              >
                quitar
              </button>
            </li>
          ))}
          {detail.players.length === 0 && (
            <li className="text-xs text-gray-500">Sin jugadores aún.</li>
          )}
        </ul>
      </section>

      <button
        onClick={onDelete}
        className="mt-6 w-full text-center text-xs text-red-400/70 underline"
      >
        Eliminar este turno
      </button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs text-gray-400">{label}</span>
      {children}
    </label>
  );
}
