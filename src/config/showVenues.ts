import type { LatLng } from '@/config/rideCoordinates';

// Nome (bate com o campo `nome` da API de shows) do labirinto de terror que
// não segue o modelo de sessões com horário -- ver `isMazeVenue`.
export const PORTAL_DA_ESCURIDAO = 'Portal da Escuridão';

export interface ShowVenue {
  coord: LatLng;
  icon: string;  // emoji usado no marcador do mapa
  /** Cor da linha no heatmap. Ausente = não entra no heatmap (caso do Portal). */
  color?: string;
  /**
   * Hora local (0-23) em que o destaque de "prestes a começar" deve iniciar,
   * substituindo o padrão de 30min antes da primeira sessão -- caso do
   * No Ritmo de Trolls, cujo público começa a se deslocar bem antes da janela
   * padrão de 30min.
   */
  highlightFromHour?: number;
}

// Ordem canônica pras "raias" do heatmap — cada show sempre aparece na mesma
// posição vertical, esteja ou não ativo naquela coluna (facilita comparar
// visualmente ao longo do dia).
export const SHOW_ORDER = [
  'Hot Wheels Epic Show',
  'Madagascar Circus Show',
  'Excalibur',
  'O Sonho do Cowboy',
  'No Ritmo de Trolls',
];

export const SHOW_VENUES: Record<string, ShowVenue> = {
  'Hot Wheels Epic Show': {
    coord: { lat: -26.8010922, lng: -48.6204122 },
    icon: '🏎️',
    color: '#38bdf8', // azul claro
  },
  'Madagascar Circus Show': {
    coord: { lat: -26.8020160, lng: -48.6165288 },
    icon: '🦁',
    color: '#fb923c', // laranja
  },
  'Excalibur': {
    coord: { lat: -26.8025263, lng: -48.6135030 },
    icon: '⚔️',
    color: '#22c55e', // verde
  },
  'O Sonho do Cowboy': {
    coord: { lat: -26.8013495, lng: -48.6153507 },
    icon: '🤠',
    color: '#1e40af', // azul escuro
  },
  'No Ritmo de Trolls': {
    coord: { lat: -26.8010251, lng: -48.6138914 },
    icon: '🧌',
    color: '#a855f7', // roxo
    highlightFromHour: 18,
  },
  [PORTAL_DA_ESCURIDAO]: {
    coord: { lat: -26.8000548, lng: -48.6158801 },
    icon: '👻',
    // sem `color` -- não é um show com sessões, não entra no heatmap.
  },
};
