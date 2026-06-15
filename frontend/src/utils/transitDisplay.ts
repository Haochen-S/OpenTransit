import type { TripRoute } from "../types";

export function tripKey(trip: TripRoute): string {
  if (trip.id !== undefined) return `trip-${trip.id}`;
  return `${trip.originId}:${trip.destinationId}`;
}

const LINE_COLOURS: Record<string, string> = {
  T1: "#F99D1C",
  T2: "#0098CD",
  T3: "#F37021",
  T4: "#005AA3",
  T5: "#C4258F",
  T6: "#718472",
  T7: "#6F818E",
  T8: "#00954C",
  T9: "#D71740",
};

export function lineColour(code: string | null): string {
  if (!code) return "#146CFD";
  const key = code.split(" ")[0].toUpperCase();
  return LINE_COLOURS[key] ?? "#146CFD";
}

export function lineLabel(code: string | null): string {
  if (!code) return "—";
  return code.split(" ")[0];
}

export function formatPlatform(value: string | null): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (/^platform\s/i.test(trimmed)) return trimmed;
  if (/^\d{1,2}[A-Z]?$/i.test(trimmed) || trimmed.length <= 6) {
    return `Platform ${trimmed}`;
  }
  return trimmed;
}

export function countdownLabel(mins: number | null): string {
  if (mins === null) return "—";
  if (mins <= 0) return "Now";
  if (mins < 60) return mins === 1 ? "1 min" : `${mins} mins`;
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  const hrs = hours === 1 ? "1 hr" : `${hours} hrs`;
  if (remainder === 0) return hrs;
  const minsPart = remainder === 1 ? "1 min" : `${remainder} mins`;
  return `${hrs} · ${minsPart}`;
}

export function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function countdownParts(mins: number | null): { primary: string; secondary?: string } {
  if (mins === null) return { primary: "—" };
  if (mins <= 0) return { primary: "Now" };
  if (mins < 60) {
    return { primary: mins === 1 ? "1 min" : `${mins} mins` };
  }
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  const primary = hours === 1 ? "1 hr" : `${hours} hrs`;
  if (remainder === 0) return { primary };
  const secondary = remainder === 1 ? "1 min" : `${remainder} mins`;
  return { primary, secondary };
}
