import type { Stats } from "@/lib/types";

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function medal(i: number): string {
  return i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
}

export function StatsView({
  stats,
  onDeleteMatch,
}: {
  stats: Stats;
  onDeleteMatch?: (id: string) => void;
}) {
  const empty =
    stats.goleadores.length === 0 &&
    stats.jugadores.length === 0 &&
    stats.partidos.length === 0;

  if (empty) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-gray-400">
        Todavía no hay partidos cargados. Cuando cargues el primer resultado,
        acá aparecen las tablas. ⚽
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-2">
        <Tile label="Partidos" value={stats.totales.partidos} />
        <Tile label="Jugadores" value={stats.totales.jugadores} />
        <Tile label="Goles" value={stats.totales.goles} />
      </div>

      {/* Goleadores */}
      <Card title="🥅 Goleadores">
        {stats.goleadores.length === 0 ? (
          <Empty>Sin goles cargados.</Empty>
        ) : (
          <ul className="space-y-1">
            {stats.goleadores.map((g, i) => (
              <Row key={g.name} left={`${medal(i)} ${g.name}`} sub={`${g.pj} PJ`}>
                <b className="text-emerald-300">{g.goles}</b>
              </Row>
            ))}
          </ul>
        )}
      </Card>

      {/* Arqueros */}
      <Card title="🧤 Arqueros">
        {stats.arqueros.length === 0 ? (
          <Empty>Nadie marcado como arquero todavía.</Empty>
        ) : (
          <>
            <div className="mb-1 flex justify-end gap-3 pr-1 text-[10px] uppercase tracking-wide text-gray-500">
              <span className="w-8 text-center">VI</span>
              <span className="w-10 text-center">Prom</span>
            </div>
            <ul className="space-y-1">
              {stats.arqueros.map((a, i) => (
                <Row key={a.name} left={`${medal(i)} ${a.name}`} sub={`${a.pj} PJ · ${a.goles_recibidos} GC`}>
                  <span className="flex items-center gap-3">
                    <b className="w-8 text-center text-emerald-300">{a.vallas_invictas}</b>
                    <span className="w-10 text-center text-gray-300">{a.prom}</span>
                  </span>
                </Row>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-gray-500">
              VI = vallas invictas · Prom = goles recibidos por partido
            </p>
          </>
        )}
      </Card>

      {/* Tabla general */}
      <Card title="📋 Tabla general">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase text-gray-500">
                <th className="py-1 text-left font-medium">Jugador</th>
                <th className="px-1 font-medium">PJ</th>
                <th className="px-1 font-medium">G</th>
                <th className="px-1 font-medium">E</th>
                <th className="px-1 font-medium">P</th>
                <th className="px-1 font-medium">Gol</th>
                <th className="px-1 font-medium text-emerald-300">Pts</th>
              </tr>
            </thead>
            <tbody>
              {stats.jugadores.map((j) => (
                <tr key={j.name} className="border-t border-white/5">
                  <td className="py-1.5 pr-2 text-gray-200">{j.name}</td>
                  <td className="px-1 text-center text-gray-300">{j.pj}</td>
                  <td className="px-1 text-center text-gray-300">{j.g}</td>
                  <td className="px-1 text-center text-gray-300">{j.e}</td>
                  <td className="px-1 text-center text-gray-300">{j.p}</td>
                  <td className="px-1 text-center text-gray-300">{j.goles}</td>
                  <td className="px-1 text-center font-bold text-emerald-300">{j.puntos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Historial */}
      <Card title="📅 Últimos partidos">
        <ul className="space-y-3">
          {stats.partidos.map((m) => (
            <li key={m.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{fmtDate(m.played_on)}</span>
                {onDeleteMatch && (
                  <button
                    onClick={() => onDeleteMatch(m.id)}
                    className="text-red-300/80 hover:text-red-200"
                  >
                    borrar
                  </button>
                )}
              </div>
              <div className="mt-1 flex items-center justify-center gap-3 text-center">
                <span className="flex-1 text-right text-sm font-semibold text-white">
                  {m.team_a_name}
                </span>
                <span className="rounded-lg bg-white/10 px-3 py-1 font-black text-white">
                  {m.score_a} - {m.score_b}
                </span>
                <span className="flex-1 text-left text-sm font-semibold text-white">
                  {m.team_b_name}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-300">
                <TeamList players={m.team_a} />
                <TeamList players={m.team_b} align="right" />
              </div>
              {m.mvp && (
                <p className="mt-2 text-center text-xs text-amber-300">
                  ⭐ Figura: {m.mvp}
                </p>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function TeamList({
  players,
  align,
}: {
  players: { name: string; goals: number; is_gk: boolean }[];
  align?: "right";
}) {
  return (
    <ul className={align === "right" ? "text-right" : ""}>
      {players.map((p, i) => (
        <li key={p.name + i}>
          {p.is_gk && "🧤 "}
          {p.name}
          {p.goals > 0 && <span className="text-emerald-300"> ⚽{p.goals}</span>}
        </li>
      ))}
    </ul>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-gray-500">
        {label}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="mb-3 text-base font-bold text-white">{title}</h3>
      {children}
    </section>
  );
}

function Row({
  left,
  sub,
  children,
}: {
  left: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm">
      <span className="text-gray-200">
        {left}
        {sub && <span className="ml-2 text-xs text-gray-500">{sub}</span>}
      </span>
      {children}
    </li>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-500">{children}</p>;
}
