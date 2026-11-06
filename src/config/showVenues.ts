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
  'Papo de Galinheiro',
  'O Dodói da Galinha Pintadinha',
];

export const SHOW_VENUES: Record<string, ShowVenue> = {
  'Hot Wheels Epic Show': {
    coord: { lat: -26.8010922, lng: -48.6204122 },
    icon: '🏎️',
    color: '#3B6FE0', // azul
  },
  'Madagascar Circus Show': {
    coord: { lat: -26.8020160, lng: -48.6165288 },
    icon: '🦁',
    color: '#F7931E', // laranja
  },
  'Excalibur': {
    coord: { lat: -26.8025263, lng: -48.6135030 },
    icon: '⚔️',
    color: '#22C3CF', // ciano
  },
  'O Sonho do Cowboy': {
    coord: { lat: -26.8013495, lng: -48.6153507 },
    icon: '🤠',
    color: '#FFD21F', // amarelo
  },
  'No Ritmo de Trolls': {
    coord: { lat: -26.8010251, lng: -48.6138914 },
    icon: '🧌',
    color: '#E0368F', // magenta
    highlightFromHour: 18,
  },
  [PORTAL_DA_ESCURIDAO]: {
    coord: { lat: -26.8000548, lng: -48.6158801 },
    icon: '👻',
    // sem `color` -- não é um show com sessões, não entra no heatmap.
  },
  // Mesmo local (galinheiro), dois shows diferentes -- mesmo ícone e cor.
  'Papo de Galinheiro': {
    coord: { lat: -26.8009723, lng: -48.6147192 },
    icon: '🐔',
    color: '#8B3FD1', // roxo
  },
  'O Dodói da Galinha Pintadinha': {
    coord: { lat: -26.8009723, lng: -48.6147192 },
    icon: '🐔',
    color: '#8B3FD1', // roxo
  },
};
