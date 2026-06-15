import type { TripRoute } from "../types";
import { api } from "./ApiClient";

const GUEST_KEY = "opentransit_guest_trips";
const MAX_TRIPS = 10;

export class TripStore {
  async list(isLoggedIn: boolean): Promise<TripRoute[]> {
    if (isLoggedIn) {
      return api.listTrips();
    }
    return this.readGuestTrips();
  }

  async add(route: TripRoute, isLoggedIn: boolean): Promise<TripRoute> {
    if (isLoggedIn) {
      return api.saveTrip(route);
    }

    const trips = this.readGuestTrips().filter(
      (t) => t.originId !== route.originId || t.destinationId !== route.destinationId,
    );
    trips.unshift(route);
    this.writeGuestTrips(trips.slice(0, MAX_TRIPS));
    return route;
  }

  async remove(trip: TripRoute, isLoggedIn: boolean): Promise<void> {
    if (isLoggedIn && trip.id) {
      await api.deleteTrip(trip.id);
      return;
    }

    const trips = this.readGuestTrips().filter(
      (t) => t.originId !== trip.originId || t.destinationId !== trip.destinationId,
    );
    this.writeGuestTrips(trips);
  }

  private readGuestTrips(): TripRoute[] {
    try {
      const raw = sessionStorage.getItem(GUEST_KEY);
      return raw ? (JSON.parse(raw) as TripRoute[]) : [];
    } catch {
      return [];
    }
  }

  private writeGuestTrips(trips: TripRoute[]): void {
    sessionStorage.setItem(GUEST_KEY, JSON.stringify(trips));
  }
}

export const tripStore = new TripStore();
