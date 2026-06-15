import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Station } from "../types";
import { api } from "../services/ApiClient";

interface StationPickerProps {
  title: string;
  subtitle?: string;
  excludeId?: string;
  onSelect: (station: Station) => void;
}

function groupByLetter(stations: Station[]): Map<string, Station[]> {
  const groups = new Map<string, Station[]>();
  for (const station of stations) {
    const letter = station.name.charAt(0).toUpperCase();
    const key = /[A-Z]/.test(letter) ? letter : "#";
    const list = groups.get(key) ?? [];
    list.push(station);
    groups.set(key, list);
  }
  return groups;
}

export function StationPicker({ title, subtitle, excludeId, onSelect }: StationPickerProps) {
  const [query, setQuery] = useState("");

  const { data: allStations = [], isLoading, error } = useQuery({
    queryKey: ["stations-all"],
    queryFn: () => api.listAllStations(),
    staleTime: Infinity,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = allStations;
    if (excludeId) {
      list = list.filter((s) => s.id !== excludeId);
    }
    if (!q) return list;
    return list.filter((s) => s.name.toLowerCase().includes(q));
  }, [allStations, query, excludeId]);

  const groups = useMemo(() => groupByLetter(filtered), [filtered]);

  return (
    <div className="flex flex-col min-h-[calc(100dvh-8rem)]">
      <div className="sticky top-[3.25rem] z-10 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 py-4 space-y-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stations…"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-4 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sydney-blue/30 focus:border-sydney-blue shadow-sm"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
            />
          </svg>
        </div>
        {!isLoading && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {filtered.length} station{filtered.length !== 1 ? "s" : ""}
            {query ? ` matching “${query}”` : ", sorted A–Z"}
          </p>
        )}
      </div>

      <div className="flex-1 px-4 pb-6">
        {isLoading && (
          <p className="text-center py-16 text-slate-500 dark:text-slate-400">Loading stations…</p>
        )}
        {error && (
          <p className="text-center py-16 text-red-600 dark:text-red-400 text-sm">
            Failed to load stations.
          </p>
        )}
        {!isLoading && !error && filtered.length === 0 && (
          <p className="text-center py-16 text-slate-500 dark:text-slate-400">No stations found.</p>
        )}

        {Array.from(groups.entries()).map(([letter, stations]) => (
          <section key={letter} className="mt-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 mb-2">
              {letter}
            </h2>
            <ul className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {stations.map((station) => (
                <li key={station.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(station)}
                    className="w-full text-left px-4 py-3.5 min-h-[48px] text-slate-800 dark:text-slate-100 hover:bg-sydney-sky/50 dark:hover:bg-slate-800 active:bg-sydney-sky dark:active:bg-slate-800 transition-colors text-base"
                  >
                    {station.name}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
