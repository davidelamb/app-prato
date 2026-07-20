export type SeasonMatch = {
  id: string;
  matchday: number;
  leg: 'Andata' | 'Ritorno';
  home: string;
  away: string;
  dateLabel: string;
  time: string;
};

export type SeasonStanding = {
  rank: number;
  club: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export const transfermarktSeasonSource = 'https://www.transfermarkt.it/serie-d-girone-e/startseite/wettbewerb/IT4E';

export const serieDTeams2026 = [
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
] as const;

const pratoOpponents = [
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
  'GSD Ghiviborgo VDS',
  'FC Scandicci 1908',
  'Foligno Calcio 1928',
  'Ternana Calcio',
  'ASD Angelana 1930',
  'Rondinella Marzocco',
  'Polisportiva Pietralunghese',
] as const;

const firstLeg: SeasonMatch[] = pratoOpponents.map((opponent, index) => {
  const pratoAtHome = index % 2 === 0;
  return {
    id: `serie-d-2026-${index + 1}`,
    matchday: index + 1,
    leg: 'Andata',
    home: pratoAtHome ? 'AC Prato' : opponent,
    away: pratoAtHome ? opponent : 'AC Prato',
    dateLabel: 'Data da definire',
    time: '—',
  };
});

const secondLeg: SeasonMatch[] = firstLeg.map((match, index) => ({
  id: `serie-d-2026-${index + 18}`,
  matchday: index + 18,
  leg: 'Ritorno',
  home: match.away,
  away: match.home,
  dateLabel: 'Data da definire',
  time: '—',
}));

export const provisionalPratoSchedule: SeasonMatch[] = [...firstLeg, ...secondLeg];

export const preseasonStandings: SeasonStanding[] = [...serieDTeams2026]
  .sort((a, b) => a.localeCompare(b, 'it'))
  .map((club, index) => ({
    rank: index + 1,
    club,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }));
