"use client";

import { useState } from "react";
import { recordMatch } from "@/lib/api";
import type { RecordMatchInput } from "@/lib/types";

interface Row {
  name: string;
  goals: number;
  is_gk: boolean;
}

function todayISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function RecordMatchForm({
  turnoId,
  onSaved,
  onCancel,
}: {
  turnoId: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [playedOn, setPlayedOn] = useState(todayISO());
  const [teamAName, setTeamAName] = useState("Equipo A");
  const [teamBName, setTeamBName] = useState("Equipo B");
  const [teamA, setTeamA] = useState<Row[]>([]);
  const [teamB, setTeamB] = useState<Row[]>([]);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [mvp, setMvp] = useState("");
  const [addA, setAddA] = useState("");
  const [addB, setAddB] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addPlayer(team: "A" | "B") {
    const val = (team === "A" ? addA : addB).trim();
    if (!val) return;
    const row: Row = { name: val, goals: 0, is_gk: false };
    if (team === "A") {
      setTeamA((r) => [...r, row]);
      setAddA("");
    } else {
      setTeamB((r) => [...r, row]);
      setAddB("");
    }
  }

  function updateRow(
    team: "A" | "B",
    idx: number,
    patch: Partial<Row>
  ) {
    const setter = team === "A" ? setTeamA : setTeamB;
    setter((rows) =>
      rows.map((r, i) => {
        if (i !== idx) {
          // solo un arquero por equipo
          if (patch.is_gk) return { ...r, is_gk: false };
          return r;
        }
        return { ...r, ...patch };
      })
    );
  }

  function removeRow(team: "A" | "B", idx: number) {
    const setter = team === "A" ? setTeamA : setTeamB;
    setter((rows) => rows.filter((_, i) => i !== idx));
  }

  const allNames = [...teamA, ...teamB].map((r) => r.name);
  const goalsA = teamA.reduce((s, r) => s + (r.goals || 0), 0);
  const goalsB = teamB.reduce((s, r) => s + (r.goals || 0), 0);

  async function submit() {
    if (teamA.length === 0 && teamB.length === 0) {
      setError("Cargá al menos un jugador.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload: RecordMatchInput = {
        played_on: playedOn,
        team_a_name: teamAName,
        team_b_name: teamBName,
        score_a: scoreA,
        score_b: scoreB,
        mvp: mvp || undefined,
        players: [
          ...teamA.map((r) => ({ ...r, team: "A" as const })),
          ...teamB.map((r) => ({ ...r, team: "B" as const })),
        ],
      };
      await recordMatch(turnoId, payload);
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/5 p-4">
      <h4 className="mb-3 text-base font-bold text-white">Cargar resultado</h4>

      {error && (
        <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <label className="mb-1 block text-xs text-gray-400">Fecha del partido</label>
      <input
        type="date"
        value={playedOn}
        onChange={(e) => setPlayedOn(e.target.value)}
        className="input mb-4"
      />

      {/* Resultado */}
      <div className="mb-4 flex items-end justify-center gap-3">
        <div className="text-center">
          <label className="mb-1 block text-xs text-gray-400">{teamAName}</label>
          <input
            type="number"
            min={0}
            value={scoreA}
            onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
            className="input w-16 text-center text-lg font-bold"
          />
        </div>
        <span className="pb-2 text-lg font-black text-gray-500">-</span>
        <div className="text-center">
          <label className="mb-1 block text-xs text-gray-400">{teamBName}</label>
          <input
            type="number"
            min={0}
            value={scoreB}
            onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
            className="input w-16 text-center text-lg font-bold"
          />
        </div>
      </div>

      <TeamEditor
        title="Equipo A"
        name={teamAName}
        setName={setTeamAName}
        rows={teamA}
        add={addA}
        setAdd={setAddA}
        onAdd={() => addPlayer("A")}
        onUpdate={(i, p) => updateRow("A", i, p)}
        onRemove={(i) => removeRow("A", i)}
        goalsSum={goalsA}
        score={scoreA}
      />
      <div className="my-3" />
      <TeamEditor
        title="Equipo B"
        name={teamBName}
        setName={setTeamBName}
        rows={teamB}
        add={addB}
        setAdd={setAddB}
        onAdd={() => addPlayer("B")}
        onUpdate={(i, p) => updateRow("B", i, p)}
        onRemove={(i) => removeRow("B", i)}
        goalsSum={goalsB}
        score={scoreB}
      />

      {/* MVP */}
      {allNames.length > 0 && (
        <div className="mt-4">
          <label className="mb-1 block text-xs text-gray-400">
            ⭐ Figura del partido (opcional)
          </label>
          <select
            value={mvp}
            onChange={(e) => setMvp(e.target.value)}
            className="input"
          >
            <option value="">— ninguno —</option>
            {allNames.map((n, i) => (
              <option key={n + i} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={submit}
          disabled={busy}
          className="flex-1 rounded-xl bg-emerald-400 px-4 py-3 font-bold text-black disabled:opacity-50"
        >
          {busy ? "Guardando…" : "Guardar resultado"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl border border-white/15 px-4 py-3 text-sm text-gray-300"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function TeamEditor({
  title,
  name,
  setName,
  rows,
  add,
  setAdd,
  onAdd,
  onUpdate,
  onRemove,
  goalsSum,
  score,
}: {
  title: string;
  name: string;
  setName: (v: string) => void;
  rows: Row[];
  add: string;
  setAdd: (v: string) => void;
  onAdd: () => void;
  onUpdate: (idx: number, patch: Partial<Row>) => void;
  onRemove: (idx: number) => void;
  goalsSum: number;
  score: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs text-gray-500">{title}:</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none focus:border-emerald-400"
        />
      </div>

      <ul className="space-y-1.5">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="flex-1 truncate text-sm text-gray-200">
              {r.is_gk && "🧤 "}
              {r.name}
            </span>
            <label className="flex items-center gap-1 text-[11px] text-gray-400">
              <input
                type="checkbox"
                checked={r.is_gk}
                onChange={(e) => onUpdate(i, { is_gk: e.target.checked })}
                className="accent-emerald-400"
              />
              arq
            </label>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-500">⚽</span>
              <input
                type="number"
                min={0}
                value={r.goals}
                onChange={(e) =>
                  onUpdate(i, { goals: parseInt(e.target.value) || 0 })
                }
                className="w-12 rounded-lg border border-white/10 bg-white/5 px-1 py-1 text-center text-sm text-white outline-none focus:border-emerald-400"
              />
            </div>
            <button
              onClick={() => onRemove(i)}
              className="text-xs text-red-300/70 hover:text-red-200"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex gap-2">
        <input
          value={add}
          onChange={(e) => setAdd(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder="Agregar jugador…"
          maxLength={40}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-emerald-400"
        />
        <button
          onClick={onAdd}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white"
        >
          +
        </button>
      </div>

      {goalsSum !== score && rows.length > 0 && (
        <p className="mt-1.5 text-[11px] text-amber-300/80">
          Goles cargados: {goalsSum} · resultado: {score}. (Podés dejarlo así si
          no anotás todos los goleadores.)
        </p>
      )}
    </div>
  );
}
