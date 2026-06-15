export interface Station {
  id: string;
  name: string;
}

export interface TripRoute {
  id?: number;
  originId: string;
  originName: string;
  destinationId: string;
  destinationName: string;
}

export interface TripAlert {
  id: string | null;
  title: string | null;
  priority: string | null;
}

export interface ScheduleItem {
  line_code: string | null;
  line_name: string | null;
  origin_name: string | null;
  platform: string | null;
  destination_name: string | null;
  destination_platform: string | null;
  departure_planned: string | null;
  departure_estimated: string | null;
  arrival_planned: string | null;
  arrival_estimated: string | null;
  minutes_until_departure: number | null;
  is_realtime: boolean;
  is_on_time: boolean;
  delay_minutes: number | null;
  status_text: string;
  occupancy: string | null;
  occupancy_level: number | null;
  has_alert: boolean;
  alerts: TripAlert[];
}

export interface Schedule {
  origin_id: string;
  origin_name: string;
  destination_id: string;
  destination_name: string;
  items: ScheduleItem[];
  service_alert_count: number;
  fetched_at: string;
  from_cache?: boolean;
}

export interface User {
  id: number;
  email: string;
  created_at: string;
}
