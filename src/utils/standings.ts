import { AppContent, SeasonMatch, Standing, StandingScope } from '../types';

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
    penalty: Number(row.penalty) || 0,
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
    penalty: 0,
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

function finalPoints(row: Standing): number {
  return (Number(row.points) || 0) + (Number(row.penalty) || 0);
}

export function sortStandingRows(rows: Standing[]): Standing[] {
  return rows
    .map(normalizeStandingRow)
    .sort((a, b) => finalPoints(b) - finalPoints(a)
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

/** Calculates standings from a list of SeasonMatch (only Campionato matches with scores). */
export function calculateStandings(matches: SeasonMatch[], clubs: string[]): Standing[] {
  const map = new Map<string, { played: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number }>();
  // Initialize all known clubs
  for (const club of clubs) {
    map.set(club, { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 });
  }
  for (const match of matches) {
    if (match.competition !== 'Campionato') continue;
    if (match.homeScore === undefined || match.awayScore === undefined || match.homeScore === null || match.awayScore === null) continue;
    const home = match.home.trim();
    const away = match.away.trim();
    if (!home || !away) continue;
    if (!map.has(home)) map.set(home, { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 });
    if (!map.has(away)) map.set(away, { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 });
    const h = map.get(home)!;
    const a = map.get(away)!;
    h.played += 1;
    a.played += 1;
    h.goalsFor += match.homeScore;
    h.goalsAgainst += match.awayScore;
    a.goalsFor += match.awayScore;
    a.goalsAgainst += match.homeScore;
    if (match.homeScore > match.awayScore) { h.wins += 1; a.losses += 1; }
    else if (match.homeScore < match.awayScore) { a.wins += 1; h.losses += 1; }
    else { h.draws += 1; a.draws += 1; }
  }
  const rows: Standing[] = [];
  for (const [club, data] of map) {
    rows.push({
      rank: 0,
      club,
      played: data.played,
      wins: data.wins,
      draws: data.draws,
      losses: data.losses,
      goalsFor: data.goalsFor,
      goalsAgainst: data.goalsAgainst,
      goalDifference: data.goalsFor - data.goalsAgainst,
      points: data.wins * 3 + data.draws,
      penalty: 0,
      form: [],
    });
  }
  return sortStandingRows(rows);
}
