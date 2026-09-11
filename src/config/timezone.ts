// Fuso horário por park_id — pode vir do backend também
export const TZ_MAP: Record<number, string> = {
  319: 'America/Sao_Paulo', 2: 'Europe/London', 4: 'Europe/Paris',
  5: 'America/New_York', 6: 'America/New_York', 7: 'America/New_York',
  8: 'America/New_York', 9: 'Europe/Paris', 15: 'America/New_York',
  16: 'America/Los_Angeles', 17: 'America/Los_Angeles', 21: 'America/New_York',
  24: 'America/New_York', 28: 'Europe/Paris', 32: 'America/Los_Angeles',
  61: 'America/Los_Angeles', 64: 'America/New_York', 65: 'America/New_York',
  66: 'America/Los_Angeles', 334: 'America/New_York',
};

export function localDateStr(tz: string, date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(date);
}

/** Data local (YYYY-MM-DD) de "hoje" para um parque específico */
export function todayForPark(parkId: number): string {
  return localDateStr(TZ_MAP[parkId] ?? 'UTC');
}
