import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StationPicker } from "../components/StationPicker";
import { useAuth } from "../contexts/AuthContext";
import { useInvalidateTrips } from "../hooks/tripQueries";
import { tripStore } from "../services/TripStore";
import type { Station, TripRoute } from "../types";

type Step = "origin" | "destination";

export function NewTripPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const invalidateTrips = useInvalidateTrips();
  const [step, setStep] = useState<Step>("origin");
  const [origin, setOrigin] = useState<Station | null>(null);

  async function handleOriginSelect(station: Station) {
    setOrigin(station);
    setStep("destination");
  }

  async function handleDestinationSelect(destination: Station) {
    if (!origin || origin.id === destination.id) return;

    const route: TripRoute = {
      originId: origin.id,
      originName: origin.name,
      destinationId: destination.id,
      destinationName: destination.name,
    };

    await tripStore.add(route, isLoggedIn);
    await invalidateTrips();
    navigate("/");
  }

  if (step === "origin") {
    return (
      <div>
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-sydney-blue dark:text-sky-400 text-sm font-medium shrink-0"
          >
            ← Back
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">Step 1 of 2</span>
        </div>
        <StationPicker
          key="origin"
          title="Select departure station"
          subtitle="Choose where your journey starts"
          onSelect={handleOriginSelect}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep("origin")}
            className="text-sydney-blue dark:text-sky-400 text-sm font-medium shrink-0"
          >
            ← Change origin
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">Step 2 of 2</span>
        </div>
        <div className="rounded-xl bg-sydney-sky/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">From</p>
          <p className="font-semibold text-sydney-navy dark:text-white">{origin?.name}</p>
        </div>
      </div>
      <StationPicker
        key={`destination-${origin?.id}`}
        title="Select destination station"
        subtitle="Choose where you are going"
        excludeId={origin?.id}
        onSelect={handleDestinationSelect}
      />
    </div>
  );
}
