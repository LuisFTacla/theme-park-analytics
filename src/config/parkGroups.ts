export interface ParkGroup {
  id: string;
  label: string;
  /** park_ids que compõem o grupo — assume-se que todos estão no mesmo fuso horário */
  parkIds: number[];
  /** aparece resumido na Home sem precisar expandir */
  featured: boolean;
}

export const PARK_GROUPS: ParkGroup[] = [
  // ── Destaques ──
  { id: 'bcw',               label: 'Beto Carrero World',  parkIds: [319],          featured: true },
  { id: 'wdw',                label: 'Walt Disney World',   parkIds: [6, 5, 7, 8],   featured: true },
  { id: 'universal-orlando',  label: 'Universal Orlando',   parkIds: [65, 64, 334],  featured: true },
  { id: 'united-parks',       label: 'United Parks',        parkIds: [24, 21],       featured: true },

  // ── Demais grupos (view expandida) ──
  { id: 'disneyland-resort',   label: 'Disneyland Resort',    parkIds: [16, 17], featured: false },
  // Six Flags e Cedar Fair (dona do Knott's Berry Farm) se fundiram em 2024.
  { id: 'six-flags',           label: 'Six Flags',            parkIds: [32, 61], featured: false },
  { id: 'universal-hollywood', label: 'Universal Hollywood',  parkIds: [66],     featured: false },
  { id: 'disneyland-paris',    label: 'Disneyland Paris',     parkIds: [4, 28],  featured: false },
  { id: 'merlin',              label: 'Merlin',               parkIds: [2],      featured: false },
  { id: 'hershey',             label: 'Hershey',              parkIds: [15],     featured: false },
  { id: 'parc-asterix',        label: 'Parc Astérix',         parkIds: [9],      featured: false },
];
