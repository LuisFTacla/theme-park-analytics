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
}

export interface HeatmapDataPoint {
  name: string;
  hora: number;
  minuto_bloco: number;
  wait_time_medio: number;
  label_tempo: string;
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

export interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

// Intervalo para o heatmap
export type HeatmapInterval = 15 | 30 | 60;

export type TabId = 'live' | 'hourly' | 'calendar';
