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

export const officialGironeSource = 'https://lnd.it/seried/attivita-interregionale/i-gironi-del-campionato-2026-2027/';
export const officialCalendarSource = 'https://lnd.it/seried/calendari-campionato-2026-2027/';

export const serieDTeams2026 = [
  'Flaminia Civitacastellana',
  'Aquila Montevarchi',
  'US Follonica Gavorrano',
  'GSD Ghiviborgo VDS',
  'Grassina',
  'Lucchese Calcio',
  'AC Prato',
  'Rondinella Marzocco',
  'San Donato Tavarnelle',
  'FC Scandicci 1908',
  'Seravezza Pozzi',
  'Siena FC',
  'Tau Calcio Altopascio',
  'Terranuova Traiana',
  'Nuova Ternana',
  'Mezzolara',
  'Progresso',
  'Sasso Marconi',
] as const;

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
