import { WEEKDAYS } from "./types";

export function formatMatchDate(iso: string | null): string {
  if (!iso) return "Fecha a definir";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Fecha a definir";
  return d.toLocaleString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatSchedule(weekday: number, time: string): string {
  const t = time?.slice(0, 5) ?? "";
  return `${WEEKDAYS[weekday] ?? ""} ${t} hs`;
}

/** Tiempo restante legible hasta una fecha (o null si ya pasó). */
export function timeUntil(iso: string, nowMs: number): string | null {
  const target = new Date(iso).getTime();
  let diff = target - nowMs;
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  diff -= days * 86400000;
  const hours = Math.floor(diff / 3600000);
  diff -= hours * 3600000;
  const mins = Math.floor(diff / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
