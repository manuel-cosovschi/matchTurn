"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { fetchActiveMatch, fetchPlayers, fetchSignups } from "@/lib/queries";
import type { Match, Player, Signup } from "@/lib/types";

const CODE_KEY = "mt_admin_code";

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

export default function AdminPage() {
  const [code, setCode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [signups, setSignups] = useState<Signup[]>([]);

  // form turno
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [capacity, setCapacity] = useState(14);

  // form jugadores
  const [newNames, setNewNames] = useState("");

  const load = useCallback(async () => {
    const m = await fetchActiveMatch();
    setMatch(m);
    setPlayers(await fetchPlayers());
    if (m) {
      setTitle(m.title);
      setLocation(m.location ?? "");
      setScheduledAt(toLocalInputValue(m.scheduled_at));
      setCapacity(m.capacity);
      setSignups(await fetchSignups(m.id));
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(CODE_KEY);
    if (saved) {
      setCode(saved);
      supabase
        .rpc("mt_check_code", { p_code: saved })
        .then(({ data }) => {
          if (data) {
            setAuthed(true);
            load();
          }
        });
    }
  }, [load]);

  function flash(m: string) {
    setMsg(m);
    setTimeout(() => setMsg(null), 2500);
  }

  async function login() {
    setChecking(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc("mt_check_code", {
        p_code: code,
      });
      if (error) throw error;
      if (data) {
        localStorage.setItem(CODE_KEY, code);
        setAuthed(true);
        await load();
      } else {
        setError("Clave incorrecta");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setChecking(false);
    }
  }

  async function saveMatch() {
    setError(null);
    try {
      const { error } = await supabase.rpc("mt_admin_upsert_match", {
        p_code: code,
        p_match_id: match?.id ?? null,
        p_title: title,
        p_location: location || null,
        p_scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        p_capacity: capacity,
      });
      if (error) throw error;
      await load();
      flash("Turno guardado ✅");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error guardando");
    }
  }

  async function addPlayers() {
    setError(null);
    const names = newNames
      .split(/[\n,]/)
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    try {
      for (const name of names) {
        const { error } = await supabase.rpc("mt_admin_add_player", {
          p_code: code,
          p_name: name,
        });
        if (error) throw error;
      }
      setNewNames("");
      await load();
      flash(`${names.length} jugador(es) agregado(s) ✅`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error agregando");
    }
  }

  async function removePlayer(id: string, name: string) {
    if (!confirm(`¿Quitar a ${name} del plantel?`)) return;
    setError(null);
    try {
      const { error } = await supabase.rpc("mt_admin_remove_player", {
        p_code: code,
        p_player_id: id,
      });
      if (error) throw error;
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error quitando");
    }
  }

  async function resetMatch() {
    if (!match) return;
    if (
      !confirm(
        "Esto borra TODAS las confirmaciones del turno (para arrancar una semana nueva). ¿Seguir?"
      )
    )
      return;
    setError(null);
    try {
      const { error } = await supabase.rpc("mt_admin_reset", {
        p_code: code,
        p_match_id: match.id,
      });
      if (error) throw error;
      await load();
      flash("Confirmaciones reiniciadas ✅");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error reiniciando");
    }
  }

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
        <h1 className="mb-1 text-2xl font-black text-white">Panel admin</h1>
        <p className="mb-5 text-sm text-gray-400">
          Ingresá la clave de administrador.
        </p>
        {error && (
          <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
          placeholder="Clave"
          className="mb-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald-400"
        />
        <button
          onClick={login}
          disabled={checking}
          className="rounded-xl bg-emerald-400 px-4 py-3 font-bold text-black disabled:opacity-50"
        >
          {checking ? "Verificando…" : "Entrar"}
        </button>
        <Link href="/" className="mt-4 text-center text-sm text-gray-500 underline">
          ← Volver
        </Link>
      </main>
    );
  }

  const signedCount = signups.filter((s) => s.status !== "out").length;

  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Panel admin</h1>
        <Link href="/" className="text-sm text-emerald-300 underline">
          ver turno →
        </Link>
      </div>

      {msg && (
        <p className="mb-4 rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-200">
          {msg}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {/* Datos del turno */}
      <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-3 text-base font-bold text-white">Datos del turno</h2>
        <label className="mb-1 block text-xs text-gray-400">Título</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-3 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-400"
        />
        <label className="mb-1 block text-xs text-gray-400">Lugar</label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Cancha / dirección"
          className="mb-3 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-400"
        />
        <label className="mb-1 block text-xs text-gray-400">Fecha y hora</label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="mb-3 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-400"
        />
        <label className="mb-1 block text-xs text-gray-400">
          Cupo de titulares
        </label>
        <input
          type="number"
          min={1}
          value={capacity}
          onChange={(e) => setCapacity(parseInt(e.target.value) || 14)}
          className="mb-4 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-400"
        />
        <button
          onClick={saveMatch}
          className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-black"
        >
          Guardar turno
        </button>
      </section>

      {/* Reset semanal */}
      {match && (
        <section className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-500/5 p-5">
          <h2 className="mb-1 text-base font-bold text-white">Nueva semana</h2>
          <p className="mb-3 text-sm text-gray-300">
            {signedCount} confirmación(es) cargadas. Reiniciá para que todos
            vuelvan a confirmar.
          </p>
          <button
            onClick={resetMatch}
            className="w-full rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 font-semibold text-amber-200"
          >
            Reiniciar confirmaciones
          </button>
        </section>
      )}

      {/* Plantel */}
      <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-3 text-base font-bold text-white">
          Plantel{" "}
          <span className="text-gray-500">({players.length})</span>
        </h2>
        <label className="mb-1 block text-xs text-gray-400">
          Agregar jugadores (uno por línea o separados por coma)
        </label>
        <textarea
          value={newNames}
          onChange={(e) => setNewNames(e.target.value)}
          rows={3}
          placeholder={"Juan\nPedro\nMartín…"}
          className="mb-3 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-400"
        />
        <button
          onClick={addPlayers}
          className="mb-4 w-full rounded-xl bg-white/10 px-4 py-2.5 font-semibold text-white"
        >
          Agregar
        </button>

        <ul className="space-y-1">
          {players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-200"
            >
              <span>{p.name}</span>
              <button
                onClick={() => removePlayer(p.id, p.name)}
                className="text-xs text-red-300 hover:text-red-200"
              >
                quitar
              </button>
            </li>
          ))}
          {players.length === 0 && (
            <li className="text-xs text-gray-500">Sin jugadores aún.</li>
          )}
        </ul>
      </section>

      <button
        onClick={() => {
          localStorage.removeItem(CODE_KEY);
          setAuthed(false);
        }}
        className="w-full text-center text-xs text-gray-500 underline"
      >
        Cerrar sesión de admin
      </button>
    </main>
  );
}
