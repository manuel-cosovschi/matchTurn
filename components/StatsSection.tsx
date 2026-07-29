"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { deleteMatch, getStatsAdmin } from "@/lib/api";
import { StatsView } from "@/components/StatsView";
import { RecordMatchForm } from "@/components/RecordMatchForm";
import type { Stats } from "@/lib/types";

export function StatsSection({
  turnoId,
  statsToken,
}: {
  turnoId: string;
  statsToken: string;
}) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      setStats(await getStatsAdmin(turnoId));
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }, [turnoId]);

  useEffect(() => {
    load();
  }, [load]);

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/stats/${statsToken}`
      : "";

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function onDelete(id: string) {
    if (!confirm("¿Borrar este partido de las estadísticas?")) return;
    try {
      await deleteMatch(id);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  const waText = `📊 Estadísticas del turno — goleadores, arqueros y tabla:\n${link}`;

  return (
    <section className="mt-6">
      <h3 className="mb-3 text-base font-bold text-white">📊 Estadísticas</h3>

      {error && (
        <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {/* Compartir link público */}
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="mb-2 text-xs text-gray-400">
          Link de estadísticas para el grupo (no cambia):
        </p>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <span className="flex-1 truncate text-xs text-gray-300">{link}</span>
          <button
            onClick={onCopy}
            className="shrink-0 rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-bold text-black"
          >
            {copied ? "¡Copiado!" : "Copiar"}
          </button>
        </div>
        <div className="mt-2 flex gap-2">
          <Link
            href={`/stats/${statsToken}`}
            target="_blank"
            className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-center text-xs text-gray-200"
          >
            Ver tablas
          </Link>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg bg-[#25D366] px-3 py-2 text-center text-xs font-bold text-black"
          >
            Compartir
          </a>
        </div>
      </div>

      {/* Cargar resultado */}
      {showForm ? (
        <div className="mb-4">
          <RecordMatchForm
            turnoId={turnoId}
            onSaved={() => {
              setShowForm(false);
              load();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mb-4 w-full rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 font-semibold text-emerald-200"
        >
          + Cargar resultado de un partido
        </button>
      )}

      {stats && <StatsView stats={stats} onDeleteMatch={onDelete} />}
    </section>
  );
}
