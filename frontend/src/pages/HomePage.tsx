import { Link, useNavigate } from "react-router-dom";
import { TripList } from "../components/TripList";
import { useAuth } from "../contexts/AuthContext";
import { useTripSummariesFromQueries } from "../hooks/scheduleQueries";
import { useRemoveTrip, useTrips } from "../hooks/tripQueries";
import type { TripRoute } from "../types";

export function HomePage() {
  const navigate = useNavigate();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { data: trips = [], isLoading } = useTrips(isLoggedIn, !authLoading);
  const { summaries, loadingKeys } = useTripSummariesFromQueries(trips, !isLoading);
  const removeTripMutation = useRemoveTrip(isLoggedIn);

  function openTrip(trip: TripRoute) {
    navigate("/trip", { state: { trip } });
  }

  function removeTrip(trip: TripRoute) {
    removeTripMutation.mutate(trip);
  }

  return (
    <div className="px-4 pb-2">
      <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">My trips</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Sydney Trains · up to 10 trips
            </p>
          </div>
          <Link
            to="/new"
            className="flex items-center justify-center w-11 h-11 rounded-full bg-sydney-blue text-white shadow-md hover:bg-blue-600 active:scale-95 transition-all shrink-0"
            aria-label="Add trip"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>

        {isLoading ? (
          <p className="text-center py-16 text-slate-500 dark:text-slate-400">Loading trips…</p>
        ) : (
          <TripList
            trips={trips}
            summaries={summaries}
            loadingKeys={loadingKeys}
            onSelect={openTrip}
            onDelete={removeTrip}
          />
        )}
      </div>
    </div>
  );
}
