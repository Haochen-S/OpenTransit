import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ScheduleResults } from "../components/ScheduleResults";
import { useRefreshSchedule, useScheduleQuery } from "../hooks/scheduleQueries";
import type { TripRoute } from "../types";

function formatFetchedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function TripSchedulePage() {
  const location = useLocation();
  const trip = (location.state as { trip?: TripRoute } | null)?.trip;
  const { data: schedule, isLoading, isFetching } = useScheduleQuery(trip);
  const refreshSchedule = useRefreshSchedule(trip);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 280);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function handleRefresh() {
    if (!trip) return;
    setRefreshing(true);
    setError("");
    try {
      await refreshSchedule();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setRefreshing(false);
    }
  }

  if (!trip) {
    return (
      <div className="px-4 py-16 text-center text-slate-500 dark:text-slate-400">
        <p>Trip not found.</p>
        <Link to="/" className="text-sydney-blue dark:text-sky-400 mt-4 inline-block font-medium">
          Back to trips
        </Link>
      </div>
    );
  }

  const showLoading = isLoading && !schedule;
  const isUpdating = refreshing || (isFetching && Boolean(schedule));

  return (
    <div className="px-4 py-5 pb-8">
      <Link to="/" className="text-sydney-blue dark:text-sky-400 text-sm font-medium">
        ← My trips
      </Link>

      <div className="mt-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm px-4 py-3">
        <div className="flex items-center justify-center gap-2 text-center">
          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-[42%]">
            {trip.originName}
          </p>
          <span className="text-slate-400 shrink-0">→</span>
          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-[42%]">
            {trip.destinationName}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 mt-2">
          <p className="text-xs text-slate-400 dark:text-slate-500 min-w-0">
            Updates every minute
            {schedule?.fetched_at && (
              <span className="sm:ml-1">· Updated {formatFetchedAt(schedule.fetched_at)}</span>
            )}
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isUpdating}
            className="shrink-0 inline-flex items-center justify-center min-h-[36px] px-3.5 rounded-xl bg-sydney-blue text-white font-medium text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUpdating ? "Updating…" : "Update"}
          </button>
        </div>
      </div>

      {error && !schedule && (
        <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-3 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="mt-4">
        <ScheduleResults
          items={schedule?.items ?? []}
          loading={showLoading}
          totalCount={schedule?.items.length}
        />
      </div>

      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 z-30 flex items-center gap-1.5 min-h-[44px] px-4 rounded-full bg-sydney-navy text-white text-sm font-medium shadow-lg hover:bg-sydney-blue active:scale-95 transition-all safe-bottom"
          aria-label="Back to top"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          Top
        </button>
      )}
    </div>
  );
}
