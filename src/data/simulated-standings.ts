// ⚠️ DATI DIMOSTRATIVI / SIMULAZIONE ⚠️
// Questo file contiene dati simulati matematicamente coerenti per collaudare
// la logica della classifica. Non sono dati sportivi reali.
// I dati reali (da AsyncStorage o seed) hanno sempre priorità.
// Per rimuovere la simulazione, eliminare questo file e i riferimenti in StatsScreen.

import { Standing } from '../types';

const TEAMS = [
  'US Città di Pontedera',
  'Tau Calcio Altopascio',
  'Siena FC',
  'SC Trestina',
  'US Follonica Gavorrano',
  'San Donato Tavarnelle',
  'Aquila Montevarchi',
  'Lucchese Calcio',
  'Terranuova Traiana',
  'Seravezza Pozzi',
  'AC Prato',
  'GSD Ghiviborgo VDS',
  'FC Scandicci 1908',
  'Foligno Calcio 1928',
  'Ternana Calcio',
  'ASD Angelana 1930',
  'Rondinella Marzocco',
  'Polisportiva Pietralunghese',
];

export const SIMULATED_LABEL = '⚠️ Dati dimostrativi / Simulazione — non reali';

function buildRow(params: {
  club: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  form: Array<'W' | 'D' | 'L'>;
}): Standing {
  const { club, played, wins, draws, losses, goalsFor, goalsAgainst, form } = params;
  return {
    rank: 0,
    club,
    played,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    points: wins * 3 + draws,
    form,
  };
}

function sortAndRank(rows: Standing[]): Standing[] {
  return rows
    .sort((a, b) =>
      b.points - a.points
      || (b.goalDifference ?? 0) - (a.goalDifference ?? 0)
      || (b.goalsFor ?? 0) - (a.goalsFor ?? 0)
      || a.club.localeCompare(b.club, 'it'),
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

// Ogni riga rispetta: G = V+N+P, DR = GF-GS, PT = V*3+N
export const simulatedOverall: Standing[] = sortAndRank([
  buildRow({ club: 'Siena FC',              played: 8, wins: 6, draws: 1, losses: 1, goalsFor: 18, goalsAgainst: 4,  form: ['W', 'W', 'W', 'D', 'W'] }),
  buildRow({ club: 'Tau Calcio Altopascio',  played: 8, wins: 5, draws: 2, losses: 1, goalsFor: 14, goalsAgainst: 5,  form: ['W', 'D', 'W', 'W', 'L'] }),
  buildRow({ club: 'Ternana Calcio',         played: 8, wins: 5, draws: 1, losses: 2, goalsFor: 16, goalsAgainst: 10, form: ['L', 'W', 'W', 'W', 'D'] }),
  buildRow({ club: 'Lucchese Calcio',        played: 8, wins: 4, draws: 3, losses: 1, goalsFor: 12, goalsAgainst: 7,  form: ['D', 'W', 'D', 'W', 'W'] }),
  buildRow({ club: 'AC Prato',               played: 8, wins: 4, draws: 2, losses: 2, goalsFor: 13, goalsAgainst: 9,  form: ['W', 'D', 'L', 'W', 'D'] }),
  buildRow({ club: 'Seravezza Pozzi',        played: 8, wins: 4, draws: 2, losses: 2, goalsFor: 11, goalsAgainst: 8,  form: ['W', 'W', 'L', 'D', 'W'] }),
  buildRow({ club: 'US Città di Pontedera',  played: 8, wins: 3, draws: 3, losses: 2, goalsFor: 10, goalsAgainst: 9,  form: ['D', 'L', 'D', 'W', 'W'] }),
  buildRow({ club: 'FC Scandicci 1908',      played: 8, wins: 3, draws: 2, losses: 3, goalsFor: 9,  goalsAgainst: 10, form: ['L', 'W', 'D', 'L', 'W'] }),
  buildRow({ club: 'San Donato Tavarnelle',  played: 8, wins: 3, draws: 1, losses: 4, goalsFor: 8,  goalsAgainst: 11, form: ['W', 'L', 'W', 'L', 'D'] }),
  buildRow({ club: 'Foligno Calcio 1928',    played: 8, wins: 3, draws: 1, losses: 4, goalsFor: 9,  goalsAgainst: 13, form: ['D', 'W', 'L', 'W', 'L'] }),
  buildRow({ club: 'US Follonica Gavorrano', played: 8, wins: 2, draws: 3, losses: 3, goalsFor: 7,  goalsAgainst: 9,  form: ['L', 'D', 'L', 'D', 'W'] }),
  buildRow({ club: 'SC Trestina',            played: 8, wins: 2, draws: 3, losses: 3, goalsFor: 6,  goalsAgainst: 12, form: ['D', 'L', 'W', 'D', 'L'] }),
  buildRow({ club: 'Aquila Montevarchi',     played: 8, wins: 2, draws: 2, losses: 4, goalsFor: 8,  goalsAgainst: 14, form: ['W', 'L', 'L', 'D', 'L'] }),
  buildRow({ club: 'GSD Ghiviborgo VDS',     played: 8, wins: 2, draws: 1, losses: 5, goalsFor: 7,  goalsAgainst: 15, form: ['L', 'L', 'W', 'L', 'W'] }),
  buildRow({ club: 'Terranuova Traiana',     played: 8, wins: 1, draws: 3, losses: 4, goalsFor: 5,  goalsAgainst: 12, form: ['D', 'L', 'D', 'L', 'D'] }),
  buildRow({ club: 'ASD Angelana 1930',      played: 8, wins: 1, draws: 3, losses: 4, goalsFor: 4,  goalsAgainst: 11, form: ['L', 'D', 'D', 'L', 'L'] }),
  buildRow({ club: 'Rondinella Marzocco',    played: 8, wins: 1, draws: 2, losses: 5, goalsFor: 5,  goalsAgainst: 14, form: ['L', 'D', 'L', 'L', 'D'] }),
  buildRow({ club: 'Polisportiva Pietralunghese', played: 8, wins: 0, draws: 3, losses: 5, goalsFor: 3, goalsAgainst: 16, form: ['D', 'L', 'L', 'D', 'L'] }),
]);

export const simulatedHome: Standing[] = sortAndRank([
  buildRow({ club: 'Tau Calcio Altopascio',  played: 4, wins: 3, draws: 1, losses: 0, goalsFor: 9,  goalsAgainst: 1,  form: ['W', 'D', 'W', 'W'] }),
  buildRow({ club: 'Siena FC',              played: 4, wins: 3, draws: 0, losses: 1, goalsFor: 10, goalsAgainst: 2,  form: ['W', 'W', 'W', 'D'] }),
  buildRow({ club: 'Lucchese Calcio',        played: 4, wins: 3, draws: 1, losses: 0, goalsFor: 8,  goalsAgainst: 3,  form: ['D', 'W', 'D', 'W'] }),
  buildRow({ club: 'Ternana Calcio',         played: 4, wins: 3, draws: 0, losses: 1, goalsFor: 9,  goalsAgainst: 5,  form: ['L', 'W', 'W', 'W'] }),
  buildRow({ club: 'AC Prato',               played: 4, wins: 2, draws: 1, losses: 1, goalsFor: 7,  goalsAgainst: 4,  form: ['W', 'D', 'L', 'W'] }),
  buildRow({ club: 'Seravezza Pozzi',        played: 4, wins: 2, draws: 1, losses: 1, goalsFor: 6,  goalsAgainst: 3,  form: ['W', 'W', 'L', 'D'] }),
  buildRow({ club: 'US Città di Pontedera',  played: 4, wins: 2, draws: 1, losses: 1, goalsFor: 5,  goalsAgainst: 4,  form: ['D', 'L', 'D', 'W'] }),
  buildRow({ club: 'FC Scandicci 1908',      played: 4, wins: 2, draws: 0, losses: 2, goalsFor: 6,  goalsAgainst: 5,  form: ['L', 'W', 'D', 'L'] }),
  buildRow({ club: 'San Donato Tavarnelle',  played: 4, wins: 2, draws: 1, losses: 1, goalsFor: 5,  goalsAgainst: 5,  form: ['W', 'L', 'W', 'L'] }),
  buildRow({ club: 'Foligno Calcio 1928',    played: 4, wins: 2, draws: 0, losses: 2, goalsFor: 5,  goalsAgainst: 6,  form: ['D', 'W', 'L', 'W'] }),
  buildRow({ club: 'Aquila Montevarchi',     played: 4, wins: 2, draws: 1, losses: 1, goalsFor: 5,  goalsAgainst: 7,  form: ['W', 'L', 'L', 'D'] }),
  buildRow({ club: 'US Follonica Gavorrano', played: 4, wins: 1, draws: 2, losses: 1, goalsFor: 3,  goalsAgainst: 3,  form: ['L', 'D', 'L', 'D'] }),
  buildRow({ club: 'SC Trestina',            played: 4, wins: 1, draws: 2, losses: 1, goalsFor: 4,  goalsAgainst: 5,  form: ['D', 'L', 'W', 'D'] }),
  buildRow({ club: 'GSD Ghiviborgo VDS',     played: 4, wins: 1, draws: 1, losses: 2, goalsFor: 4,  goalsAgainst: 6,  form: ['L', 'L', 'W', 'L'] }),
  buildRow({ club: 'Terranuova Traiana',     played: 4, wins: 0, draws: 2, losses: 2, goalsFor: 2,  goalsAgainst: 5,  form: ['D', 'L', 'D', 'L'] }),
  buildRow({ club: 'ASD Angelana 1930',      played: 4, wins: 0, draws: 2, losses: 2, goalsFor: 2,  goalsAgainst: 5,  form: ['L', 'D', 'D', 'L'] }),
  buildRow({ club: 'Rondinella Marzocco',    played: 4, wins: 1, draws: 1, losses: 2, goalsFor: 3,  goalsAgainst: 7,  form: ['L', 'D', 'L', 'L'] }),
  buildRow({ club: 'Polisportiva Pietralunghese', played: 4, wins: 0, draws: 1, losses: 3, goalsFor: 1, goalsAgainst: 8, form: ['D', 'L', 'L', 'D'] }),
]);

export const simulatedAway: Standing[] = sortAndRank([
  buildRow({ club: 'Siena FC',              played: 4, wins: 3, draws: 1, losses: 0, goalsFor: 8,  goalsAgainst: 2,  form: ['W', 'W', 'W', 'D'] }),
  buildRow({ club: 'Ternana Calcio',         played: 4, wins: 2, draws: 1, losses: 1, goalsFor: 7,  goalsAgainst: 5,  form: ['L', 'W', 'W', 'W'] }),
  buildRow({ club: 'Tau Calcio Altopascio',  played: 4, wins: 2, draws: 1, losses: 1, goalsFor: 5,  goalsAgainst: 4,  form: ['W', 'D', 'W', 'W'] }),
  buildRow({ club: 'AC Prato',               played: 4, wins: 2, draws: 1, losses: 1, goalsFor: 6,  goalsAgainst: 5,  form: ['W', 'D', 'L', 'W'] }),
  buildRow({ club: 'Lucchese Calcio',        played: 4, wins: 1, draws: 2, losses: 1, goalsFor: 4,  goalsAgainst: 4,  form: ['D', 'W', 'D', 'W'] }),
  buildRow({ club: 'Seravezza Pozzi',        played: 4, wins: 2, draws: 1, losses: 1, goalsFor: 5,  goalsAgainst: 5,  form: ['W', 'W', 'L', 'D'] }),
  buildRow({ club: 'US Città di Pontedera',  played: 4, wins: 1, draws: 2, losses: 1, goalsFor: 5,  goalsAgainst: 5,  form: ['D', 'L', 'D', 'W'] }),
  buildRow({ club: 'US Follonica Gavorrano', played: 4, wins: 1, draws: 1, losses: 2, goalsFor: 4,  goalsAgainst: 6,  form: ['L', 'D', 'L', 'D'] }),
  buildRow({ club: 'FC Scandicci 1908',      played: 4, wins: 1, draws: 2, losses: 1, goalsFor: 3,  goalsAgainst: 5,  form: ['L', 'W', 'D', 'L'] }),
  buildRow({ club: 'San Donato Tavarnelle',  played: 4, wins: 1, draws: 0, losses: 3, goalsFor: 3,  goalsAgainst: 6,  form: ['W', 'L', 'W', 'L'] }),
  buildRow({ club: 'Foligno Calcio 1928',    played: 4, wins: 1, draws: 1, losses: 2, goalsFor: 4,  goalsAgainst: 7,  form: ['D', 'W', 'L', 'W'] }),
  buildRow({ club: 'SC Trestina',            played: 4, wins: 1, draws: 1, losses: 2, goalsFor: 2,  goalsAgainst: 7,  form: ['D', 'L', 'W', 'D'] }),
  buildRow({ club: 'Aquila Montevarchi',     played: 4, wins: 0, draws: 1, losses: 3, goalsFor: 3,  goalsAgainst: 7,  form: ['W', 'L', 'L', 'D'] }),
  buildRow({ club: 'ASD Angelana 1930',      played: 4, wins: 1, draws: 1, losses: 2, goalsFor: 2,  goalsAgainst: 6,  form: ['L', 'D', 'D', 'L'] }),
  buildRow({ club: 'GSD Ghiviborgo VDS',     played: 4, wins: 1, draws: 0, losses: 3, goalsFor: 3,  goalsAgainst: 9,  form: ['L', 'L', 'W', 'L'] }),
  buildRow({ club: 'Terranuova Traiana',     played: 4, wins: 1, draws: 1, losses: 2, goalsFor: 3,  goalsAgainst: 7,  form: ['D', 'L', 'D', 'L'] }),
  buildRow({ club: 'Rondinella Marzocco',    played: 4, wins: 0, draws: 1, losses: 3, goalsFor: 2,  goalsAgainst: 7,  form: ['L', 'D', 'L', 'L'] }),
  buildRow({ club: 'Polisportiva Pietralunghese', played: 4, wins: 0, draws: 2, losses: 2, goalsFor: 2, goalsAgainst: 8, form: ['D', 'L', 'L', 'D'] }),
]);

export const simulatedForm: Standing[] = sortAndRank([
  buildRow({ club: 'Siena FC',              played: 5, wins: 4, draws: 1, losses: 0, goalsFor: 12, goalsAgainst: 2,  form: ['W', 'W', 'W', 'D', 'W'] }),
  buildRow({ club: 'Lucchese Calcio',        played: 5, wins: 3, draws: 2, losses: 0, goalsFor: 8,  goalsAgainst: 3,  form: ['D', 'W', 'D', 'W', 'W'] }),
  buildRow({ club: 'Tau Calcio Altopascio',  played: 5, wins: 3, draws: 1, losses: 1, goalsFor: 9,  goalsAgainst: 4,  form: ['W', 'D', 'W', 'W', 'L'] }),
  buildRow({ club: 'Ternana Calcio',         played: 5, wins: 3, draws: 1, losses: 1, goalsFor: 10, goalsAgainst: 6,  form: ['L', 'W', 'W', 'W', 'D'] }),
  buildRow({ club: 'Seravezza Pozzi',        played: 5, wins: 3, draws: 0, losses: 2, goalsFor: 8,  goalsAgainst: 5,  form: ['W', 'W', 'L', 'D', 'W'] }),
  buildRow({ club: 'AC Prato',               played: 5, wins: 2, draws: 2, losses: 1, goalsFor: 8,  goalsAgainst: 6,  form: ['W', 'D', 'L', 'W', 'D'] }),
  buildRow({ club: 'US Città di Pontedera',  played: 5, wins: 2, draws: 2, losses: 1, goalsFor: 6,  goalsAgainst: 5,  form: ['D', 'L', 'D', 'W', 'W'] }),
  buildRow({ club: 'FC Scandicci 1908',      played: 5, wins: 2, draws: 1, losses: 2, goalsFor: 6,  goalsAgainst: 7,  form: ['L', 'W', 'D', 'L', 'W'] }),
  buildRow({ club: 'US Follonica Gavorrano', played: 5, wins: 2, draws: 1, losses: 2, goalsFor: 4,  goalsAgainst: 5,  form: ['L', 'D', 'L', 'D', 'W'] }),
  buildRow({ club: 'Foligno Calcio 1928',    played: 5, wins: 2, draws: 0, losses: 3, goalsFor: 6,  goalsAgainst: 9,  form: ['D', 'W', 'L', 'W', 'L'] }),
  buildRow({ club: 'San Donato Tavarnelle',  played: 5, wins: 2, draws: 0, losses: 3, goalsFor: 5,  goalsAgainst: 8,  form: ['W', 'L', 'W', 'L', 'D'] }),
  buildRow({ club: 'GSD Ghiviborgo VDS',     played: 5, wins: 2, draws: 0, losses: 3, goalsFor: 5,  goalsAgainst: 10, form: ['L', 'L', 'W', 'L', 'W'] }),
  buildRow({ club: 'Terranuova Traiana',     played: 5, wins: 1, draws: 2, losses: 2, goalsFor: 3,  goalsAgainst: 7,  form: ['D', 'L', 'D', 'L', 'D'] }),
  buildRow({ club: 'SC Trestina',            played: 5, wins: 1, draws: 1, losses: 3, goalsFor: 4,  goalsAgainst: 9,  form: ['D', 'L', 'W', 'D', 'L'] }),
  buildRow({ club: 'Aquila Montevarchi',     played: 5, wins: 1, draws: 1, losses: 3, goalsFor: 5,  goalsAgainst: 10, form: ['W', 'L', 'L', 'D', 'L'] }),
  buildRow({ club: 'ASD Angelana 1930',      played: 5, wins: 0, draws: 2, losses: 3, goalsFor: 2,  goalsAgainst: 8,  form: ['L', 'D', 'D', 'L', 'L'] }),
  buildRow({ club: 'Rondinella Marzocco',    played: 5, wins: 0, draws: 1, losses: 4, goalsFor: 3,  goalsAgainst: 11, form: ['L', 'D', 'L', 'L', 'D'] }),
  buildRow({ club: 'Polisportiva Pietralunghese', played: 5, wins: 0, draws: 1, losses: 4, goalsFor: 1, goalsAgainst: 12, form: ['D', 'L', 'L', 'D', 'L'] }),
]);

export function isStandingsEmpty(rows: Standing[] | undefined): boolean {
  if (!rows || rows.length === 0) return true;
  return rows.every((row) => (row.played ?? 0) === 0);
}

export function getSimulatedStandings(scope: 'overall' | 'home' | 'away' | 'form'): Standing[] {
  switch (scope) {
    case 'home': return simulatedHome;
    case 'away': return simulatedAway;
    case 'form': return simulatedForm;
    default: return simulatedOverall;
  }
}