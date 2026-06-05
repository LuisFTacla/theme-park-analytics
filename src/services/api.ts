// src/services/api.ts

import type {
  Park, HourlyAverage, CalendarData,
  HeatmapDataPoint, LiveRide, DailyEvolutionPoint, ApiResponse
} from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  const json: ApiResponse<T> = await res.json();
  return json.data;
}

export const api = {
  getParks: () =>
    get<Park[]>('/parks'),

  getTimezone: (parkId: number) =>
    get<{ timezone: string }>(`/parks/${parkId}/timezone`),

  getHourlyAverages: (parkId: number) =>
    get<HourlyAverage[]>(`/parks/${parkId}/hourly`),

  getCalendar: (parkId: number) =>
    get<CalendarData>(`/parks/${parkId}/calendar`),

  getHeatmap: (parkId: number, date: string, interval: number) =>
    get<HeatmapDataPoint[]>(`/parks/${parkId}/heatmap?date=${date}&interval=${interval}`),

  getEvolution: (parkId: number, date: string) =>
    get<DailyEvolutionPoint[]>(`/parks/${parkId}/evolution?date=${date}`),

  getLive: (parkId: number) =>
    get<LiveRide[]>(`/parks/${parkId}/live`),
};
