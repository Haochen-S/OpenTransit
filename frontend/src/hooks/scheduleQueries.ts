import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { SCHEDULE_STALE_MS } from "../constants";
import { api } from "../services/ApiClient";
import type { Schedule, TripRoute } from "../types";
import {
  countdownLabel,
  formatPlatform,
  formatTime,
  lineColour,
  lineLabel,
  tripKey,
} from "../utils/transitDisplay";

export interface TripNextService {
  platform: string | null;
  countdown: string;
  arrivalTime: string;
  lineCode: string | null;
  lineColour: string;
  lineLabel: string;
}

export function scheduleQueryKey(trip: TripRoute) {
  return ["schedule", trip.originId, trip.destinationId] as const;
}

function scheduleQueryOptions(trip: TripRoute) {
  return {
    queryKey: scheduleQueryKey(trip),
    queryFn: () => api.getSchedule(trip),
    staleTime: SCHEDULE_STALE_MS,
    refetchInterval: SCHEDULE_STALE_MS,
    refetchIntervalInBackground: false,
  };
}

export function toTripSummary(item: Schedule["items"][number]): TripNextService {
  return {
    platform: formatPlatform(item.platform),
    countdown: countdownLabel(item.minutes_until_departure),
    arrivalTime: formatTime(item.arrival_estimated ?? item.arrival_planned),
    lineCode: item.line_code,
    lineColour: lineColour(item.line_code),
    lineLabel: lineLabel(item.line_code),
  };
}

export function useScheduleQuery(trip: TripRoute | undefined) {
  return useQuery({
    ...scheduleQueryOptions(trip!),
    enabled: Boolean(trip),
  });
}

export function useTripScheduleQueries(trips: TripRoute[], enabled: boolean) {
  return useQueries({
    queries: trips.map((trip) => ({
      ...scheduleQueryOptions(trip),
      enabled,
    })),
  });
}

export function useTripSummariesFromQueries(trips: TripRoute[], enabled: boolean) {
  const results = useTripScheduleQueries(trips, enabled);

  const summaries: Record<string, TripNextService> = {};
  const loadingKeys: Record<string, boolean> = {};

  trips.forEach((trip, index) => {
    const key = tripKey(trip);
    const result = results[index];
    const next = result.data?.items[0];
    if (next) summaries[key] = toTripSummary(next);
    if (result.isPending && !result.data) loadingKeys[key] = true;
  });

  return { summaries, loadingKeys };
}

export function useRefreshSchedule(trip: TripRoute | undefined) {
  const queryClient = useQueryClient();

  return async () => {
    if (!trip) return;
    const data = await api.getSchedule(trip, true);
    queryClient.setQueryData(scheduleQueryKey(trip), data);
    return data;
  };
}
