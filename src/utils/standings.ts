import { AppContent, SeasonMatch, Standing, StandingScope } from '../types';

export const standingScopes: Array<{ value: StandingScope; label: string }> = [
  { value: 'overall', label: 'Totale' },
  { value: 'home', label: 'Casa' },
  { value: 'away', label: 'Fuori' },
];

export const numberValue = (value: number | undefined) => Number(value) || 0;

export function normalizeStandingRow(row: Standing, index: number): Standing {
  const goalsFor = numberValue(row.goalsFor);
  const goalsAgainst = numberValue(row.goalsAgainst);
  return {
    ...row,
    rank: Number(row.rank) || index + 1,
    played: Number(row.played) || 0,
    wins: numberValue(row.wins),
    draws: numberValue(row.draws),
    losses: numberValue(row.losses),
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    points: Number(row.points) || 0,
    form: (row.form ?? []).slice(-20),
  };
}

function clubKey(value: string): string {
  return value
    .toLocaleLowerCase('it')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(ac|asd|us|gsd|fc|calcio)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function emptyStandingRows(rows: Standing[]): Standing[] {
  return rows.map((row, index) => ({
    rank: index + 1,
    club: row.club,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    form: [],
  }));
}

export function completeStandingRows(rows: Standing[] | undefined, masterRows: Standing[]): Standing[] {
  const normalizedRows = (rows ?? []).filter((row) => !!row?.club).map(normalizeStandingRow);
  const byClub = new Map(normalizedRows.map((row) => [clubKey(row.club), row]));

  return masterRows.map((master, index) => {
    const existing = byClub.get(clubKey(master.club));
    return normalizeStandingRow({
      ...(existing ?? master),
      club: master.club,
      rank: existing?.rank ?? master.rank ?? index + 1,
    }, index);
  });
}

export function sortStandingRows(rows: Standing[]): Standing[] {
  return rows
    .map(normalizeStandingRow)
    .sort((a, b) => b.points - a.points
      || numberValue(b.goalDifference) - numberValue(a.goalDifference)
      || numberValue(b.goalsFor) - numberValue(a.goalsFor)
      || a.club.localeCompare(b.club, 'it'))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function standingRows(content: AppContent, scope: StandingScope): Standing[] {
  if (scope === 'home') return content.homeStandings ?? [];
  if (scope === 'away') return content.awayStandings ?? [];
  return content.standings ?? [];
}
export function setStandingRows(content: AppContent, scope: StandingScope, rows: Standing[]): AppContent {
  if (scope === 'home') return { ...content, homeStandings: rows };
  if (scope === 'away') return { ...content, awayStandings: rows };
  return { ...content, standings: rows };
}

export function calculatedStandingRows(matches: SeasonMatch[], masterRows: Standing[], scope: StandingScope): Standing[] {
  const rows = emptyStandingRows(masterRows);
  const byClub = new Map(rows.map((row) => [clubKey(row.club), row]));
  const completed = [...matches]
    .filter((match) => (match.competition ?? 'Campionato') === 'Campionato'
      && match.homeScore !== undefined && match.awayScore !== undefined)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const addResult = (club: string, goalsFor: number, goalsAgainst: number) => {
    const row = byClub.get(clubKey(club));
    if (!row) return;
    const result: NonNullable<Standing['form']>[number] = goalsFor > goalsAgainst ? 'W' : goalsFor === goalsAgainst ? 'D' : 'L';
    row.played += 1;
    row.wins = numberValue(row.wins) + (result === 'W' ? 1 : 0);
    row.draws = numberValue(row.draws) + (result === 'D' ? 1 : 0);
    row.losses = numberValue(row.losses) + (result === 'L' ? 1 : 0);
    row.goalsFor = numberValue(row.goalsFor) + goalsFor;
    row.goalsAgainst = numberValue(row.goalsAgainst) + goalsAgainst;
    row.goalDifference = numberValue(row.goalsFor) - numberValue(row.goalsAgainst);
    row.points += result === 'W' ? 3 : result === 'D' ? 1 : 0;
    row.form = [...(row.form ?? []), result].slice(-20);
  };

  completed.forEach((match) => {
    if (scope !== 'away') addResult(match.home, match.homeScore!, match.awayScore!);
    if (scope !== 'home') addResult(match.away, match.awayScore!, match.homeScore!);
  });
  return sortStandingRows(rows);
}
