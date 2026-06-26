"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  changePassword,
  createTurno,
  deleteTurno,
  generateWeek,
  listTurnos,
  logout,
  me,
  removeSignup,
  setWeekCancelled,
  turnoDetail,
} from "@/lib/api";
import { formatMatchDate, formatSchedule, timeUntil } from "@/lib/format";
import { WEEKDAYS } from "@/lib/types";
import type { AdminSignup, TurnoDetail, TurnoSummary, User } from "@/lib/types";

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
        <>
          <TurnoListView
            turnos={turnos}
            onOpen={(id) => setSelected(id)}
            onCreated={loadTurnos}
          />
          <ChangePasswordCard />
        </>
      )}
    </main>
  );
}

function ChangePasswordCard() {
  const [open, setOpen] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      await changePassword(oldPass, newPass);
      setOldPass("");
      setNewPass("");
      setMsg("Contraseña actualizada ✅");
      setOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-white">🔒 Seguridad</span>
        <span className="text-xs text-gray-400">
          {open ? "ocultar" : "cambiar contraseña"}
        </span>
      </button>
      {msg && <p className="mt-2 text-sm text-emerald-300">{msg}</p>}
      {open && (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
          <input
            type="password"
            value={oldPass}
            onChange={(e) => setOldPass(e.target.value)}
            placeholder="Contraseña actual"
            required
            className="input"
          />
          <input
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            placeholder="Nueva contraseña (mín. 6)"
            required
            minLength={6}
            className="input"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-emerald-400 px-4 py-3 font-bold text-black disabled:opacity-50"
          >
            {busy ? "Guardando…" : "Cambiar contraseña"}
          </button>
        </form>
      )}
    </section>
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
  const locked =
    !!week &&
    (week.status !== "open" || nowMs >= new Date(week.locks_at).getTime());

  async function onRemoveSignup(id: string, name: string) {
    if (!confirm(`¿Quitar a ${name} de la lista?`)) return;
    setBusy(true);
    try {
      await removeSignup(id);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function onToggleCancel() {
    if (!week?.id) return;
    const next = !week.cancelled;
    if (
      next &&
      !confirm("¿Marcar que esta fecha NO se juega? Los jugadores verán el aviso.")
    )
      return;
    setBusy(true);
    setError(null);
    try {
      await setWeekCancelled(week.id, next);
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
            {week.cancelled && (
              <div className="mt-2 rounded-xl border border-red-400/40 bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-200">
                ❌ Esta fecha está marcada como “no se juega”.
              </div>
            )}
            <p className="mt-2 text-sm capitalize text-gray-300">
              📅 {formatMatchDate(week.match_at)}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              {week.cancelled
                ? "Suspendida"
                : locked
                ? "🔒 Confirmaciones cerradas (equipo final)."
                : `Cierra ${
                    timeUntil(week.locks_at, nowMs)
                      ? "en " + timeUntil(week.locks_at, nowMs)
                      : "pronto"
                  } · 24 h antes del partido`}
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

            {!week.cancelled && (
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `⚽ ${detail.turno.title} — turno de esta semana\n📅 ${formatMatchDate(
                    week.match_at
                  )}${
                    detail.turno.location ? `\n📍 ${detail.turno.location}` : ""
                  }\n\nConfirmá tu lugar (los primeros ${capacity} juegan):\n${link}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block w-full rounded-xl bg-[#25D366] px-4 py-3 text-center font-bold text-black"
              >
                Compartir por WhatsApp
              </a>
            )}
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
            <button
              onClick={onToggleCancel}
              disabled={busy}
              className={`mt-2 w-full rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
                week.cancelled
                  ? "border border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                  : "border border-red-400/40 bg-red-500/10 text-red-200"
              }`}
            >
              {week.cancelled
                ? "Reactivar fecha (sí se juega)"
                : "Marcar que esta fecha no se juega"}
            </button>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-gray-300">
              Todavía no generaste el link de esta semana. Generalo y mandalo al
              grupo: cada uno escribe su nombre para confirmar.
            </p>
            <button
              onClick={onGenerate}
              disabled={busy}
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
            <h3 className="text-base font-bold text-white">Confirmados en vivo</h3>
            <span className="text-sm font-semibold text-white">
              {convocados.length}/{capacity}
            </span>
          </div>

          <SignupList
            title="✅ Convocados"
            accent="border-emerald-400/20"
            rows={convocados}
            onRemove={onRemoveSignup}
            empty="Nadie confirmado todavía. Mandá el link al grupo."
          />
          <SignupList
            title="⏳ Suplentes"
            accent="border-amber-400/20"
            rows={suplentes}
            onRemove={onRemoveSignup}
            empty="Sin suplentes."
          />
        </section>
      )}

      <button
        onClick={onDelete}
        className="mt-6 w-full text-center text-xs text-red-400/70 underline"
      >
        Eliminar este turno
      </button>
    </div>
  );
}

function SignupList({
  title,
  accent,
  rows,
  onRemove,
  empty,
}: {
  title: string;
  accent: string;
  rows: AdminSignup[];
  onRemove: (id: string, name: string) => void;
  empty: string;
}) {
  return (
    <section className={`mb-4 rounded-2xl border ${accent} bg-white/[0.03] p-4`}>
      <h3 className="mb-2 text-sm font-semibold text-gray-200">
        {title} <span className="text-gray-500">({rows.length})</span>
      </h3>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-500">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {rows.map((s, i) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg px-3 py-1.5 text-sm text-gray-200"
            >
              <span>
                {i + 1}. {s.name}
              </span>
              <button
                onClick={() => onRemove(s.id, s.name)}
                className="text-xs text-red-300/80 hover:text-red-200"
              >
                quitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
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
