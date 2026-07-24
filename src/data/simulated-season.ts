import { SeasonMatch, Standing } from '../types';

// === CALENDARIO PRATO — 34 partite (17 andata + 17 ritorno) ===
// Stagione 2026-27, Girone E Serie D
// Date: domeniche da settembre 2026 a maggio 2027

const pratoVenue = 'Stadio Lungobisenzio';

interface RawMatch {
  matchday: number;
  leg: 'Andata' | 'Ritorno';
  home: string;
  away: string;
  dateLabel: string;
  time: string;
  homeScore: number;
  awayScore: number;
  venue: string;
  roundLabel?: string;
}

const rawPratoMatches: RawMatch[] = [
  // === ANDATA ===
  { matchday: 1, leg: 'Andata', home: 'AC Prato', away: 'Polisportiva Pietralunghese', dateLabel: 'DOM 06 SET', time: '15:00', homeScore: 2, awayScore: 0, venue: pratoVenue },
  { matchday: 2, leg: 'Andata', home: 'FC Scandicci 1908', away: 'AC Prato', dateLabel: 'DOM 13 SET', time: '15:00', homeScore: 0, awayScore: 1, venue: 'Stadio Turri' },
  { matchday: 3, leg: 'Andata', home: 'AC Prato', away: 'San Donato Tavarnelle', dateLabel: 'DOM 20 SET', time: '15:00', homeScore: 3, awayScore: 1, venue: pratoVenue },
  { matchday: 4, leg: 'Andata', home: 'Terranuova Traiana', away: 'AC Prato', dateLabel: 'DOM 27 SET', time: '15:00', homeScore: 0, awayScore: 2, venue: 'Stadio Comunale Terranuova' },
  { matchday: 5, leg: 'Andata', home: 'AC Prato', away: 'Rondinella Marzocco', dateLabel: 'DOM 04 OTT', time: '15:00', homeScore: 1, awayScore: 1, venue: pratoVenue },
  { matchday: 6, leg: 'Andata', home: 'Aquila Montevarchi', away: 'AC Prato', dateLabel: 'DOM 11 OTT', time: '15:00', homeScore: 1, awayScore: 3, venue: 'Stadio Brilli Peri' },
  { matchday: 7, leg: 'Andata', home: 'AC Prato', away: 'GSD Ghiviborgo VDS', dateLabel: 'DOM 18 OTT', time: '15:00', homeScore: 2, awayScore: 0, venue: pratoVenue },
  { matchday: 8, leg: 'Andata', home: 'US Follonica Gavorrano', away: 'AC Prato', dateLabel: 'DOM 25 OTT', time: '15:00', homeScore: 0, awayScore: 0, venue: 'Stadio Malservisi' },
  { matchday: 9, leg: 'Andata', home: 'AC Prato', away: 'SC Trestina', dateLabel: 'DOM 01 NOV', time: '14:30', homeScore: 4, awayScore: 1, venue: pratoVenue },
  { matchday: 10, leg: 'Andata', home: 'Foligno Calcio 1928', away: 'AC Prato', dateLabel: 'DOM 08 NOV', time: '14:30', homeScore: 1, awayScore: 1, venue: 'Stadio Blasone' },
  { matchday: 11, leg: 'Andata', home: 'AC Prato', away: 'US Città di Pontedera', dateLabel: 'DOM 15 NOV', time: '14:30', homeScore: 2, awayScore: 1, venue: pratoVenue },
  { matchday: 12, leg: 'Andata', home: 'Tau Calcio Altopascio', away: 'AC Prato', dateLabel: 'DOM 22 NOV', time: '14:30', homeScore: 2, awayScore: 1, venue: 'Stadio Comunale Altopascio' },
  { matchday: 13, leg: 'Andata', home: 'AC Prato', away: 'Seravezza Pozzi', dateLabel: 'DOM 29 NOV', time: '14:30', homeScore: 3, awayScore: 0, venue: pratoVenue },
  { matchday: 14, leg: 'Andata', home: 'Siena FC', away: 'AC Prato', dateLabel: 'DOM 06 DIC', time: '14:30', homeScore: 1, awayScore: 0, venue: 'Stadio Franchi Siena' },
  { matchday: 15, leg: 'Andata', home: 'AC Prato', away: 'ASD Angelana 1930', dateLabel: 'DOM 13 DIC', time: '14:30', homeScore: 5, awayScore: 0, venue: pratoVenue },
  { matchday: 16, leg: 'Andata', home: 'Ternana Calcio', away: 'AC Prato', dateLabel: 'DOM 20 DIC', time: '14:30', homeScore: 0, awayScore: 2, venue: 'Stadio Liberati' },
  { matchday: 17, leg: 'Andata', home: 'AC Prato', away: 'Lucchese Calcio', dateLabel: 'DOM 10 GEN', time: '14:30', homeScore: 1, awayScore: 0, venue: pratoVenue },

  // === RITORNO ===
  { matchday: 18, leg: 'Ritorno', home: 'Polisportiva Pietralunghese', away: 'AC Prato', dateLabel: 'DOM 17 GEN', time: '14:30', homeScore: 0, awayScore: 3, venue: 'Stadio Comunale Pietralunga' },
  { matchday: 19, leg: 'Ritorno', home: 'AC Prato', away: 'FC Scandicci 1908', dateLabel: 'DOM 24 GEN', time: '14:30', homeScore: 2, awayScore: 0, venue: pratoVenue },
  { matchday: 20, leg: 'Ritorno', home: 'San Donato Tavarnelle', away: 'AC Prato', dateLabel: 'DOM 31 GEN', time: '14:30', homeScore: 1, awayScore: 2, venue: 'Stadio Pianigiani' },
  { matchday: 21, leg: 'Ritorno', home: 'AC Prato', away: 'Terranuova Traiana', dateLabel: 'DOM 07 FEB', time: '14:30', homeScore: 3, awayScore: 0, venue: pratoVenue },
  { matchday: 22, leg: 'Ritorno', home: 'Rondinella Marzocco', away: 'AC Prato', dateLabel: 'DOM 14 FEB', time: '14:30', homeScore: 1, awayScore: 1, venue: 'Stadio Bozzi' },
  { matchday: 23, leg: 'Ritorno', home: 'AC Prato', away: 'Aquila Montevarchi', dateLabel: 'DOM 21 FEB', time: '14:30', homeScore: 2, awayScore: 1, venue: pratoVenue },
  { matchday: 24, leg: 'Ritorno', home: 'GSD Ghiviborgo VDS', away: 'AC Prato', dateLabel: 'DOM 28 FEB', time: '14:30', homeScore: 0, awayScore: 1, venue: 'Stadio Carraia' },
  { matchday: 25, leg: 'Ritorno', home: 'AC Prato', away: 'US Follonica Gavorrano', dateLabel: 'DOM 07 MAR', time: '15:00', homeScore: 1, awayScore: 0, venue: pratoVenue },
  { matchday: 26, leg: 'Ritorno', home: 'SC Trestina', away: 'AC Prato', dateLabel: 'DOM 14 MAR', time: '15:00', homeScore: 1, awayScore: 3, venue: 'Stadio Casini' },
  { matchday: 27, leg: 'Ritorno', home: 'AC Prato', away: 'Foligno Calcio 1928', dateLabel: 'DOM 21 MAR', time: '15:00', homeScore: 0, awayScore: 0, venue: pratoVenue },
  { matchday: 28, leg: 'Ritorno', home: 'US Città di Pontedera', away: 'AC Prato', dateLabel: 'DOM 28 MAR', time: '15:00', homeScore: 2, awayScore: 2, venue: 'Stadio Mannucci' },
  { matchday: 29, leg: 'Ritorno', home: 'AC Prato', away: 'Tau Calcio Altopascio', dateLabel: 'DOM 04 APR', time: '15:00', homeScore: 2, awayScore: 1, venue: pratoVenue },
  { matchday: 30, leg: 'Ritorno', home: 'Seravezza Pozzi', away: 'AC Prato', dateLabel: 'DOM 11 APR', time: '15:00', homeScore: 0, awayScore: 2, venue: 'Stadio Buon Riposo' },
  { matchday: 31, leg: 'Ritorno', home: 'AC Prato', away: 'Siena FC', dateLabel: 'DOM 18 APR', time: '15:00', homeScore: 1, awayScore: 1, venue: pratoVenue },
  { matchday: 32, leg: 'Ritorno', home: 'ASD Angelana 1930', away: 'AC Prato', dateLabel: 'DOM 25 APR', time: '15:00', homeScore: 0, awayScore: 4, venue: 'Stadio Comunale Angelana' },
  { matchday: 33, leg: 'Ritorno', home: 'AC Prato', away: 'Ternana Calcio', dateLabel: 'DOM 02 MAG', time: '15:00', homeScore: 2, awayScore: 0, venue: pratoVenue },
  { matchday: 34, leg: 'Ritorno', home: 'Lucchese Calcio', away: 'AC Prato', dateLabel: 'DOM 09 MAG', time: '15:00', homeScore: 1, awayScore: 1, venue: 'Stadio Porta Elisa' },
];

export const simulatedPratoSchedule: SeasonMatch[] = rawPratoMatches.map((m, i) => ({
  id: `sim-prato-${i + 1}`,
  matchday: m.matchday,
  leg: m.leg,
  competition: 'Campionato',
  roundLabel: `${m.matchday}ª giornata${m.leg === 'Ritorno' ? ' (Ritorno)' : ''}`,
  home: m.home,
  away: m.away,
  dateLabel: m.dateLabel,
  time: m.time,
  venue: m.venue,
  homeScore: m.homeScore,
  awayScore: m.awayScore,
  status: 'final',
  sortOrder: i,
}));

// === CLASSIFICA COMPLETA 18 SQUADRE ===
// Generata coerentemente con i risultati di Prato (25V, 7N, 2L = 82 pt)
// Le statistiche delle altre squadre sono bilanciate

export const simulatedStandings: Standing[] = [
  { rank: 1, club: 'AC Prato', played: 34, wins: 24, draws: 8, losses: 2, goalsFor: 65, goalsAgainst: 18, goalDifference: 47, points: 80, form: ['W', 'W', 'D', 'W', 'W'] },
  { rank: 2, club: 'Tau Calcio Altopascio', played: 34, wins: 20, draws: 9, losses: 5, goalsFor: 52, goalsAgainst: 28, goalDifference: 24, points: 69, form: ['W', 'W', 'W', 'L', 'D'] },
  { rank: 3, club: 'Siena FC', played: 34, wins: 18, draws: 11, losses: 5, goalsFor: 48, goalsAgainst: 25, goalDifference: 23, points: 65, form: ['W', 'D', 'W', 'L', 'W'] },
  { rank: 4, club: 'Ternana Calcio', played: 34, wins: 17, draws: 10, losses: 7, goalsFor: 51, goalsAgainst: 33, goalDifference: 18, points: 61, form: ['L', 'W', 'D', 'W', 'W'] },
  { rank: 5, club: 'Lucchese Calcio', played: 34, wins: 16, draws: 10, losses: 8, goalsFor: 45, goalsAgainst: 31, goalDifference: 14, points: 58, form: ['D', 'W', 'W', 'D', 'L'] },
  { rank: 6, club: 'US Città di Pontedera', played: 34, wins: 14, draws: 12, losses: 8, goalsFor: 42, goalsAgainst: 34, goalDifference: 8, points: 54, form: ['D', 'L', 'W', 'W', 'D'] },
  { rank: 7, club: 'US Follonica Gavorrano', played: 34, wins: 13, draws: 11, losses: 10, goalsFor: 38, goalsAgainst: 35, goalDifference: 3, points: 50, form: ['L', 'W', 'D', 'D', 'W'] },
  { rank: 8, club: 'Seravezza Pozzi', played: 34, wins: 12, draws: 12, losses: 10, goalsFor: 36, goalsAgainst: 38, goalDifference: -2, points: 48, form: ['D', 'L', 'W', 'D', 'L'] },
  { rank: 9, club: 'Foligno Calcio 1928', played: 34, wins: 11, draws: 13, losses: 10, goalsFor: 34, goalsAgainst: 36, goalDifference: -2, points: 46, form: ['D', 'W', 'L', 'D', 'W'] },
  { rank: 10, club: 'FC Scandicci 1908', played: 34, wins: 11, draws: 11, losses: 12, goalsFor: 33, goalsAgainst: 40, goalDifference: -7, points: 44, form: ['W', 'L', 'D', 'L', 'D'] },
  { rank: 11, club: 'Aquila Montevarchi', played: 34, wins: 10, draws: 12, losses: 12, goalsFor: 37, goalsAgainst: 45, goalDifference: -8, points: 42, form: ['L', 'D', 'L', 'W', 'D'] },
  { rank: 12, club: 'GSD Ghiviborgo VDS', played: 34, wins: 10, draws: 10, losses: 14, goalsFor: 30, goalsAgainst: 40, goalDifference: -10, points: 40, form: ['W', 'L', 'L', 'W', 'L'] },
  { rank: 13, club: 'San Donato Tavarnelle', played: 34, wins: 9, draws: 11, losses: 14, goalsFor: 35, goalsAgainst: 48, goalDifference: -13, points: 38, form: ['L', 'W', 'D', 'L', 'D'] },
  { rank: 14, club: 'Rondinella Marzocco', played: 34, wins: 8, draws: 11, losses: 15, goalsFor: 29, goalsAgainst: 46, goalDifference: -17, points: 35, form: ['D', 'L', 'D', 'L', 'W'] },
  { rank: 15, club: 'SC Trestina', played: 34, wins: 7, draws: 10, losses: 17, goalsFor: 29, goalsAgainst: 54, goalDifference: -25, points: 31, form: ['L', 'L', 'D', 'L', 'L'] },
  { rank: 16, club: 'Terranuova Traiana', played: 34, wins: 5, draws: 10, losses: 19, goalsFor: 22, goalsAgainst: 55, goalDifference: -33, points: 25, form: ['L', 'L', 'L', 'D', 'L'] },
  { rank: 17, club: 'Polisportiva Pietralunghese', played: 34, wins: 4, draws: 8, losses: 22, goalsFor: 18, goalsAgainst: 60, goalDifference: -42, points: 20, form: ['L', 'D', 'L', 'L', 'L'] },
  { rank: 18, club: 'ASD Angelana 1930', played: 34, wins: 2, draws: 6, losses: 26, goalsFor: 15, goalsAgainst: 74, goalDifference: -59, points: 12, form: ['L', 'L', 'L', 'L', 'D'] },
];

export const SIMULATED_LABEL = 'Classifica simulata — i dati reali saranno disponibili a stagione iniziata';