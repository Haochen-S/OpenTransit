import type { ScheduleItem } from "../types";
import {
  countdownParts,
  formatPlatform,
  formatTime,
  lineColour,
  lineLabel,
} from "../utils/transitDisplay";

function delayMinutesLabel(mins: number | null): string {
  if (mins === null) return "—";
  return mins === 1 ? "1 min" : `${mins} mins`;
}

function LateStatusBadge({ delayMinutes, statusText }: { delayMinutes: number | null; statusText: string }) {
  return (
    <span
      className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 text-xs font-medium leading-tight px-0.5 rounded-md bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 text-center"
      title={statusText}
    >
      <span className="tabular-nums">{delayMinutesLabel(delayMinutes)}</span>
      <span>late</span>
    </span>
  );
}

interface ScheduleResultsProps {
  items: ScheduleItem[];
  loading?: boolean;
  totalCount?: number;
}

export function ScheduleResults({ items, loading = false, totalCount }: ScheduleResultsProps) {
  if (loading) {
    return (
      <p className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
        Loading services…
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
        No upcoming services in the next 6 hours.
      </p>
    );
  }

  return (
    <div className="space-y-2 pb-2">
      {totalCount !== undefined && totalCount > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
          {totalCount} departures in the next 6 hours
        </p>
      )}
      <ul className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {items.map((item, index) => {
          const colour = lineColour(item.line_code);
          const depTime = item.departure_estimated ?? item.departure_planned;
          const arrTime = item.arrival_estimated ?? item.arrival_planned;
          const originPlatform = formatPlatform(item.platform);
          const destPlatform = formatPlatform(item.destination_platform);
          const countdown = countdownParts(item.minutes_until_departure);
          const rowKey = `${depTime ?? "dep"}-${item.line_code ?? "line"}-${index}`;

          return (
            <li key={rowKey} className="flex gap-2 p-3 items-stretch">
              <div
                className="shrink-0 w-[4.5rem] rounded-lg flex flex-col items-center justify-center text-white text-sm font-bold leading-tight text-center px-2 self-stretch"
                style={{ backgroundColor: colour }}
              >
                <span>{countdown.primary}</span>
                {countdown.secondary && <span className="mt-0.5">{countdown.secondary}</span>}
              </div>

              <div className="flex flex-1 min-w-0 gap-2">
                <div
                  className="flex-1 min-w-0 grid grid-cols-[minmax(0,1fr)_4.5rem_minmax(2.75rem,3.75rem)] grid-rows-2 gap-x-2 gap-y-2 items-start"
                >
                  <div className="min-w-0 row-start-1 col-start-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight truncate">
                      {item.origin_name}
                    </p>
                    {originPlatform && (
                      <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                        {originPlatform}
                      </p>
                    )}
                  </div>
                  <p className="row-start-1 col-start-2 text-[15px] font-bold tabular-nums text-slate-900 dark:text-white text-right leading-tight whitespace-nowrap self-start">
                    {formatTime(depTime)}
                  </p>
                  <div className="row-start-1 row-span-2 col-start-3 self-stretch flex min-h-[3.25rem]">
                    {item.is_on_time ? (
                      <span className="flex-1 min-w-0 flex items-center justify-center text-xs font-semibold px-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 leading-tight text-center">
                        On time
                      </span>
                    ) : (
                      <LateStatusBadge delayMinutes={item.delay_minutes} statusText={item.status_text} />
                    )}
                  </div>

                  <div className="min-w-0 row-start-2 col-start-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight truncate">
                      {item.destination_name}
                    </p>
                    {destPlatform && (
                      <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                        {destPlatform}
                      </p>
                    )}
                  </div>
                  <p className="row-start-2 col-start-2 text-[15px] font-bold tabular-nums text-slate-500 dark:text-slate-400 text-right leading-tight whitespace-nowrap self-start">
                    {formatTime(arrTime)}
                  </p>
                </div>

                <div className="shrink-0 w-10 flex items-center justify-center self-stretch">
                  <span
                    className="text-xs font-bold px-1.5 py-1 rounded-md min-w-[2.25rem] text-center text-white leading-tight"
                    style={{ backgroundColor: colour }}
                  >
                    {lineLabel(item.line_code)}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
