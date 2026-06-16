import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tripStore } from "../services/TripStore";
import type { TripRoute } from "../types";
import { scheduleQueryKey } from "./scheduleQueries";

export function tripsQueryKey(isLoggedIn: boolean) {
  return ["trips", isLoggedIn] as const;
}

export function useTrips(isLoggedIn: boolean, enabled = true) {
  return useQuery({
    queryKey: tripsQueryKey(isLoggedIn),
    queryFn: () => tripStore.list(isLoggedIn),
    enabled,
    staleTime: 0,
  });
}

export function useRemoveTrip(isLoggedIn: boolean) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trip: TripRoute) => tripStore.remove(trip, isLoggedIn),
    onSuccess: (_, trip) => {
      queryClient.setQueryData<TripRoute[]>(tripsQueryKey(isLoggedIn), (current) =>
        current?.filter(
          (t) => t.originId !== trip.originId || t.destinationId !== trip.destinationId,
        ),
      );
      queryClient.removeQueries({ queryKey: scheduleQueryKey(trip) });
    },
  });
}

export function useInvalidateTrips() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["trips"] });
}
