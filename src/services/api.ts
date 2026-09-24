import type {
  Park, HourlyAverage, CalendarData,
  HeatmapDataPoint, LiveRide, DailyEvolutionPoint, ApiResponse,
  ForecastData, BacktestPoint, RideStats, RideHeatmapHistoryPoint, RideHistoricalProfilePoint,
  ShowSession,
} from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

// ─── Detecção de "servidor acordando" (free tier hiberna após inatividade) ────
// Se uma requisição demorar mais que WAKE_THRESHOLD_MS para responder, avisamos
// a UI para exibir um aviso — sem isso o usuário acha que a aplicação travou.
const WAKE_THRESHOLD_MS = 2500;

type WakingListener = (waking: boolean) => void;
const wakingListeners = new Set<WakingListener>();
let pendingRequests = 0;
let wakeTimer: ReturnType<typeof setTimeout> | null = null;
let isWaking = false;

function setWaking(value: boolean) {
  if (isWaking === value) return;
  isWaking = value;
  wakingListeners.forEach(listener => listener(value));
}

export function subscribeWaking(listener: WakingListener): () => void {
  wakingListeners.add(listener);
  listener(isWaking);
  return () => wakingListeners.delete(listener);
}

async function get<T>(path: string): Promise<T> {
  pendingRequests++;
  if (!wakeTimer) {
    wakeTimer = setTimeout(() => setWaking(true), WAKE_THRESHOLD_MS);
  }
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? `HTTP ${res.status}`);
    }
    const json: ApiResponse<T> = await res.json();
    return json.data;
  } finally {
    pendingRequests--;
    if (pendingRequests === 0) {
      if (wakeTimer) {
        clearTimeout(wakeTimer);
        wakeTimer = null;
      }
      setWaking(false);
    }
  }
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

  getRideStats: (parkId: number, rideName: string, date: string) =>
    get<RideStats>(`/parks/${parkId}/rides/stats?name=${encodeURIComponent(rideName)}&date=${date}`),

  getRideHeatmapHistory: (parkId: number, rideName: string, days = 14, interval = 30) =>
    get<RideHeatmapHistoryPoint[]>(
      `/parks/${parkId}/rides/heatmap-history?name=${encodeURIComponent(rideName)}&days=${days}&interval=${interval}`
    ),

  getRideHistoricalProfile: (parkId: number, rideName: string, interval = 15) =>
    get<RideHistoricalProfilePoint[]>(
      `/parks/${parkId}/rides/historical-profile?name=${encodeURIComponent(rideName)}&interval=${interval}`
    ),

  getParkHistoricalProfile: (parkId: number, interval = 15) =>
    get<RideHistoricalProfilePoint[]>(`/parks/${parkId}/historical-profile?interval=${interval}`),

  getForecast: (parkId: number, days = 14) =>
    get<ForecastData>(`/parks/${parkId}/forecast?days=${days}`),

  getBacktest: (parkId: number) =>
    get<BacktestPoint[]>(`/parks/${parkId}/backtest`),

  getShows: (parkId: number, date: string) =>
    get<ShowSession[]>(`/parks/${parkId}/shows?date=${date}`),
};