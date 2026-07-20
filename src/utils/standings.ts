import { AppContent, Standing, StandingScope } from '../types';

export const standingScopes: Array<{ value: StandingScope; label: string }> = [
  { value: 'overall', label: 'Generale' },
  { value: 'home', label: 'Casa' },
  { value: 'away', label: 'Trasferta' },
  { value: 'form', label: 'Forma' },
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
    form: (row.form ?? []).slice(-5),
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
  if (scope === 'form') return content.formStandings ?? [];
  return content.standings ?? [];
}

export function setStandingRows(content: AppContent, scope: StandingScope, rows: Standing[]): AppContent {
  if (scope === 'home') return { ...content, homeStandings: rows };
  if (scope === 'away') return { ...content, awayStandings: rows };
  if (scope === 'form') return { ...content, formStandings: rows };
  return { ...content, standings: rows };
}

export function parseForm(value: string): Array<'W' | 'D' | 'L'> {
  return value
    .toUpperCase()
    .split(/[\s,;|\-]+/)
    .map((item) => item === 'V' ? 'W' : item === 'N' ? 'D' : item === 'P' ? 'L' : item)
    .filter((item): item is 'W' | 'D' | 'L' => item === 'W' || item === 'D' || item === 'L')
    .slice(-5);
}
