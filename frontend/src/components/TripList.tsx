import type { TripNextService } from "../hooks/scheduleQueries";
import type { TripRoute } from "../types";
import { tripKey } from "../utils/transitDisplay";

const FALLBACK_COLORS = ["#146CFD", "#F5A623", "#7B61FF", "#34C759", "#E85D4C"];

interface TripListProps {
  trips: TripRoute[];
  summaries?: Record<string, TripNextService>;
  loadingKeys?: Record<string, boolean>;
  onSelect: (trip: TripRoute) => void;
  onDelete?: (trip: TripRoute) => void;
}

function serviceMeta(summary: TripNextService | undefined, loading: boolean): string {
  if (loading) return "Loading…";
  if (!summary) return "No upcoming services";
  const parts: string[] = [];
  if (summary.platform) parts.push(summary.platform);
  if (summary.countdown) parts.push(summary.countdown);
  return parts.join(" · ");
}

export function TripList({
  trips,
  summaries = {},
  loadingKeys = {},
  onSelect,
  onDelete,
}: TripListProps) {
  if (trips.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <p className="text-slate-600 dark:text-slate-400">No trips yet.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {trips.map((trip, index) => {
        const key = tripKey(trip);
        const summary = summaries[key];
        const loading = loadingKeys[key] ?? false;
        const barColour = summary?.lineColour ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
        const hasLine = summary?.lineLabel && summary.lineLabel !== "—";

        return (
          <li key={key} className="flex items-center bg-white dark:bg-slate-900">
            <div
              className="w-1 self-stretch min-h-[4.5rem] shrink-0"
              style={{ backgroundColor: barColour }}
            />

            <button
              type="button"
              onClick={() => onSelect(trip)}
              className="flex-1 flex items-center gap-3 min-h-[4.5rem] px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white truncate leading-snug">
                  {trip.originName}
                </p>
                <p className="font-semibold text-slate-900 dark:text-white truncate leading-snug mt-0.5">
                  {trip.destinationName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {serviceMeta(summary, loading)}
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-end justify-center gap-1 min-w-[4.5rem]">
                <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white leading-none">
                  {summary?.arrivalTime ?? (loading ? "…" : "—")}
                </p>
                {hasLine && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-md text-white leading-tight"
                    style={{ backgroundColor: summary.lineColour }}
                  >
                    {summary.lineLabel}
                  </span>
                )}
              </div>

              <svg
                className="w-5 h-5 shrink-0 text-slate-300 dark:text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(trip)}
                className="shrink-0 mr-2 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
                aria-label="Remove trip"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
