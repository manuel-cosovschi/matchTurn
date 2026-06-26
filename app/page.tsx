"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession } from "@/lib/api";

export default function LandingPage() {
  const [hasSession, setHasSession] = useState(false);
  useEffect(() => {
    setHasSession(!!getSession());
  }, []);

  return (
    <main className="mx-auto max-w-md px-5 pb-16 pt-12">
      <header className="text-center">
        <h1 className="text-4xl font-black tracking-tight text-white">
          MatchTurn <span aria-hidden>⚽</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-base text-emerald-200/90">
          Organizá tu turno fijo de fútbol. Los primeros en confirmar quedan
          convocados; el resto, suplentes.
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-3">
        {hasSession ? (
          <Link
            href="/dashboard"
            className="rounded-xl bg-emerald-400 px-4 py-3 text-center font-bold text-black"
          >
            Ir a mi panel
          </Link>
        ) : (
          <>
            <Link
              href="/register"
              className="rounded-xl bg-emerald-400 px-4 py-3 text-center font-bold text-black"
            >
              Crear cuenta gratis
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center font-semibold text-white"
            >
              Ya tengo cuenta
            </Link>
          </>
        )}
      </div>

      <section className="mt-12 space-y-4">
        <Step
          n={1}
          title="Creá tu turno fijo"
          text="Elegí el día de la semana, el horario, la cancha y cuántos juegan (ej. 14)."
        />
        <Step
          n={2}
          title="Generá el link de la semana"
          text="Con un botón creás un link nuevo y privado. Lo pasás al grupo de WhatsApp."
        />
        <Step
          n={3}
          title="Cada uno escribe su nombre"
          text="No cargás ninguna lista: la gente entra al link, pone su nombre y confirma."
        />
        <Step
          n={4}
          title="Los primeros entran"
          text="Los primeros que confirman quedan convocados; el resto, suplentes. Si alguien se baja, el primer suplente que confirma toma el lugar. Se cierra 1 h antes."
        />
      </section>

      <p className="mt-12 text-center text-xs text-gray-500">
        Hecho para grupos de amigos. Gratis.
      </p>
    </main>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400 font-bold text-black">
        {n}
      </div>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="mt-0.5 text-sm text-gray-400">{text}</p>
      </div>
    </div>
  );
}
