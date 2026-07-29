export interface ListItem {
  key: string;
  label: string;
  me?: boolean;
}

export function PlayerList({
  title,
  accent,
  items,
  empty,
}: {
  title: string;
  accent: "emerald" | "amber" | "slate";
  items: ListItem[];
  empty: string;
}) {
  const border =
    accent === "emerald"
      ? "border-emerald-400/20"
      : accent === "amber"
      ? "border-amber-400/20"
      : "border-white/10";
  return (
    <section className={`mb-4 rounded-2xl border ${border} bg-white/[0.03] p-4`}>
      <h3 className="mb-2 text-sm font-semibold text-gray-200">
        {title} <span className="text-gray-500">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-gray-500">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((it) => (
            <li
              key={it.key}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                it.me ? "bg-white/10 font-semibold text-white" : "text-gray-200"
              }`}
            >
              {it.label}
              {it.me && <span className="ml-1 text-emerald-300">· vos</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
