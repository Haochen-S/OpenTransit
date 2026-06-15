import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tripStore } from "../services/TripStore";
import type { TripRoute } from "../types";
import { scheduleQueryKey } from "./scheduleQueries";

export function tripsQueryKey(isLoggedIn: boolean) {
  return ["trips", isLoggedIn] as const;
}

export function useTrips(isLoggedIn: boolean) {
  return useQuery({
    queryKey: tripsQueryKey(isLoggedIn),
    queryFn: () => tripStore.list(isLoggedIn),
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

export function useInvalidateTrips(isLoggedIn: boolean) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: tripsQueryKey(isLoggedIn) });
}
