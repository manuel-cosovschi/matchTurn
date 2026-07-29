"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getStats } from "@/lib/api";
import { StatsView } from "@/components/StatsView";
import type { PublicStats } from "@/lib/types";

export default function PublicStatsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [data, setData] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const d = await getStats(token);
        if (!d) setNotFound(true);
        else setData(d);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md items-center justify-center p-6">
        <p className="animate-pulse text-emerald-300">Cargando estadísticas…</p>
      </main>
    );
  }

  if (notFound || !data) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center p-6 text-center">
        <p className="text-4xl">📊</p>
        <h1 className="mt-3 text-xl font-bold text-white">Sin estadísticas</h1>
        <p className="mt-2 text-sm text-gray-400">
          Este link no es válido. Pedile al organizador el link de estadísticas.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 pb-20 pt-6">
      <header className="mb-5 text-center">
        <h1 className="text-2xl font-black tracking-tight text-white">
          {data.title} <span aria-hidden>📊</span>
        </h1>
        <p className="text-sm text-emerald-300/80">Estadísticas del turno</p>
      </header>

      <StatsView stats={data.stats} />

      <footer className="mt-10 border-t border-white/10 pt-5 text-center">
        <Link
          href="/"
          target="_blank"
          className="inline-block rounded-xl border border-emerald-400/30 bg-emerald-500/5 px-4 py-2.5 text-sm text-emerald-200 transition hover:bg-emerald-500/10"
        >
          Hecho con <span className="font-bold">MatchTurn</span> ⚽ — armá tu
          turno fijo gratis →
        </Link>
        <p className="mt-3 text-xs text-gray-600">
          © 2026 MatchTurn ·{" "}
          <Link href="/terminos" className="underline">
            Términos
          </Link>
        </p>
      </footer>
    </main>
  );
}
