"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <h1 className="text-2xl font-black text-white">Iniciar sesión</h1>
      <p className="mb-6 mt-1 text-sm text-gray-400">
        Entrá para administrar tus turnos.
      </p>
      {error && (
        <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald-400"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          required
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-emerald-400 px-4 py-3 font-bold text-black disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-gray-400">
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="text-emerald-300 underline">
          Registrate
        </Link>
      </p>
      <Link href="/" className="mt-3 text-center text-xs text-gray-500 underline">
        ← Volver
      </Link>
    </main>
  );
}
