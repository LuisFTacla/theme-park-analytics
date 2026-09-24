export interface Park {
  park_id: number;
  park_name: string;
}

export interface HourlyAverage {
  name: string;
  hora_cheia: number;
  wait_time: number;
}

export interface DailyAverage {
  data_local: string;
  ano_registro: number;
  wait_time: number;
  year: number;
  month: number;
  day: number;
  day_of_week: string;
  week_of_year: number;
  is_forecast?: boolean; // true quando o dia vem do modelo de previsão, não do histórico real
  show_sessions?: number; // total de sessões de show nesse dia -- só existe a partir de 2026-09-24 (início da coleta)
}

export interface HeatmapDataPoint {
  name: string;
  hora: number;
  minuto_bloco: number;
  wait_time_medio: number;
  label_tempo: string;
}

// ─── Detalhe de uma atração (modal) ─────────────────────────────────────────

export interface RideStats {
  historicalAvg: number | null;
  historicalMax: number | null;
  dailyAvg: number | null;
  dailyMax: number | null;
}

export interface RideHeatmapHistoryPoint {
  data_local: string;
  hora: number;
  minuto_bloco: number;
  wait_time_medio: number;
  label_tempo: string;
}

export interface RideHistoricalProfilePoint {
  hora: number;
  minuto_bloco: number;
  wait_time_medio: number;
  label_tempo: string;
}

// ─── Horários de shows (só BCW, hoje) ────────────────────────────────────────

export interface ShowSession {
  atracao_id: number;
  nome: string;
  periodo_de: string;  // "HH:MM:SS"
  periodo_ate: string; // "HH:MM:SS"
}

export interface LiveRide {
  id: number;
  name: string;
  is_open: boolean;
  wait_time: number;
}

export interface DailyEvolutionPoint {
  horario: string;
  wait_time: number;
}

export interface CalendarData {
  data: DailyAverage[];
  years: number[];
}

// ─── Previsão (forecast) ────────────────────────────────────────────────────

export interface ForecastPoint {
  name: string;
  data_local: string; // YYYY-MM-DD
  pred_wait_time: number;
}

export interface ForecastData {
  previsoes: ForecastPoint[];
  horizonte_minimo_dias: number;
  mae_esperado_val: number;
}

// ─── Validação / Backtest ───────────────────────────────────────────────────

export interface BacktestPoint {
  data_local: string; // YYYY-MM-DD
  name: string;
  wait_time_real: number;
  wait_time_previsto: number;
  mes_referencia: string; // YYYY-MM
  abs_erro: number;
}

export interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

// Intervalo para o heatmap
export type HeatmapInterval = 5 | 10 | 15 | 30 | 60;

export type TabId = 'live' | 'calendar' | 'validation';