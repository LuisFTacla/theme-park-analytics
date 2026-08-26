// Coordenadas geográficas (lat/lng) de cada atração do Beto Carrero World,
// usadas para posicionar os círculos no mapa animado de filas.
// Nomes batem exatamente com o campo `name` devolvido pela API (heatmap/hourly).

export interface LatLng {
  lat: number;
  lng: number;
}

// Centro aproximado do parque — usado para centralizar o mapa inicialmente.
export const PARK_CENTER: LatLng = { lat: -26.8014, lng: -48.6155 };

// Atrações com um único local ao longo de todo o histórico de dados.
export const RIDE_COORDINATES: Record<string, LatLng> = {
  'FireWhip':                          { lat: -26.8001282, lng: -48.6183059 },
  'Tchibum':                           { lat: -26.8004237, lng: -48.6184628 },
  'Turbo Drive':                       { lat: -26.8009638, lng: -48.6194699 },
  'Big Drop':                          { lat: -26.8015184, lng: -48.6192097 },
  'Ferrovia DinoMagic':                { lat: -26.8020064, lng: -48.6189642 },
  'Trenzinho Vila Esperança':          { lat: -26.8032161, lng: -48.6181550 }, // desativado, mas com dados históricos
  'Madagascar Crazy River Adventure!': { lat: -26.8012939, lng: -48.6180660 },
  'Rebuliço':                          { lat: -26.8018265, lng: -48.6154002 },
  'Betinho Carrero 2D':                { lat: -26.8023009, lng: -48.6148566 },
  'Raskapuska':                        { lat: -26.8023002, lng: -48.6142141 },
  'Tigor Mountain':                    { lat: -26.8023733, lng: -48.6123823 },
  'Autopista (bate-bate)':             { lat: -26.8019893, lng: -48.6127593 },
  'Xícaras Malucas':                   { lat: -26.8015363, lng: -48.6131803 },
  'Baby Elefante':                     { lat: -26.8013696, lng: -48.6135669 },
  'Roda-Gigante':                      { lat: -26.8012469, lng: -48.6130655 },
  'Barco Pirata':                      { lat: -26.8007670, lng: -48.6112414 },
  'Spin Blast':                        { lat: -26.8006477, lng: -48.6151746 },
  'Super Soaker Splash':               { lat: -26.8003358, lng: -48.6154914 },
  'Star Mountain':                     { lat: -26.7996451, lng: -48.6169187 },
  'Pedalinho':                         { lat: -26.8015476, lng: -48.6126113 }, // desativado, mas com dados históricos
};

interface RideRelocation {
  coord: LatLng;
  /** Data (YYYY-MM-DD) a partir da qual esse local passou a valer. `null` = desde sempre (local antigo). */
  from: string | null;
}

export const RIDE_RELOCATIONS: Record<string, RideRelocation[]> = {
  'Montanha-russa Dum Dum': [
    { coord: { lat: -26.8025852, lng: -48.6152909 }, from: null },         // local antigo, antes da reforma de 2026
    { coord: { lat: -26.8017968, lng: -48.6134684 }, from: '2026-06-04' }, // local novo, reabriu em 04/06/2026
  ],
  'Carrossel Veneziano': [
    { coord: { lat: -26.8016999, lng: -48.6142159 }, from: null },         // local antigo, antes da reforma de 2024
    { coord: { lat: -26.8022950, lng: -48.6128571 }, from: '2024-04-12' }, // local novo, reabriu em 12/04/2024
  ],
};

/**
 * Retorna a coordenada correta de uma atração para uma data específica
 * (YYYY-MM-DD), considerando mudanças de local ao longo do tempo.
 * Retorna `null` se a atração não tiver coordenada cadastrada.
 */
export function getRideCoordinate(rideName: string, date: string): LatLng | null {
  const relocations = RIDE_RELOCATIONS[rideName];
  if (relocations) {
    // Ordena do local mais recente pro mais antigo e pega o primeiro que já valia na data.
    const sorted = [...relocations].sort((a, b) => (b.from ?? '').localeCompare(a.from ?? ''));
    const match = sorted.find(r => r.from === null || r.from <= date);
    return match?.coord ?? null;
  }

  return RIDE_COORDINATES[rideName] ?? null;
}
