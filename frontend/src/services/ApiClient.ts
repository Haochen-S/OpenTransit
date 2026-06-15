import { TOKEN_KEY } from "../constants";
import type { Schedule, Station, TripRoute, User } from "../types";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

interface SavedTripRow {
  id: number;
  origin_id: string;
  origin_name: string;
  destination_id: string;
  destination_name: string;
}

function toTripRoute(row: SavedTripRow): TripRoute {
  return {
    id: row.id,
    originId: row.origin_id,
    originName: row.origin_name,
    destinationId: row.destination_id,
    destinationName: row.destination_name,
  };
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    };

    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const detail = body.detail;
      throw new Error(typeof detail === "string" ? detail : "Request failed");
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  login(email: string, password: string): Promise<{ access_token: string }> {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  register(email: string, password: string): Promise<User> {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  me(): Promise<User> {
    return this.request("/auth/me");
  }

  listAllStations(): Promise<Station[]> {
    return this.request("/transit/stations/all");
  }

  getSchedule(route: TripRoute, refresh = false): Promise<Schedule> {
    const params = new URLSearchParams({
      origin_id: route.originId,
      origin_name: route.originName,
      destination_id: route.destinationId,
      destination_name: route.destinationName,
    });
    if (refresh) params.set("refresh", "true");
    return this.request(`/transit/schedule?${params}`);
  }

  listTrips(): Promise<TripRoute[]> {
    return this.request<SavedTripRow[]>("/trips").then((rows) => rows.map(toTripRoute));
  }

  saveTrip(route: TripRoute): Promise<TripRoute> {
    return this.request<SavedTripRow>("/trips", {
      method: "POST",
      body: JSON.stringify({
        origin_id: route.originId,
        origin_name: route.originName,
        destination_id: route.destinationId,
        destination_name: route.destinationName,
      }),
    }).then(toTripRoute);
  }

  deleteTrip(id: number): Promise<void> {
    return this.request(`/trips/${id}`, { method: "DELETE" });
  }
}

export const api = new ApiClient();
