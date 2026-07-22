import { AppContent, SeasonMatch, Standing, StandingScope } from '../types';
import { canonicalTeamName, normalizeTeamName } from './team-names';

export const standingScopes: Array<{ value: StandingScope; label: string }> = [
  { value: 'overall', label: 'Generale' },
  { value: 'home', label: 'Casa' },
  { value: 'away', label: 'Trasferta' },
  { value: 'form', label: 'Forma' },
];

export const numberValue = (value: number | undefined) => Number(value) || 0;

export function normalizeStandingRow(row: Standing, index = 0): Standing {
  const goalsFor = numberValue(row.goalsFor);
  const goalsAgainst = numberValue(row.goalsAgainst);
  return {
    ...row,
    club: canonicalTeamName(row.club),
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

export function emptyStandingRows(rows: Standing[]): Standing[] {
  return rows.map((row, index) => ({
    rank: index + 1,
    club: canonicalTeamName(row.club),
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
  const byClub = new Map(normalizedRows.map((row) => [normalizeTeamName(row.club), row]));

  return masterRows.map((master, index) => {
    const existing = byClub.get(normalizeTeamName(master.club));
    return normalizeStandingRow({
      ...(existing ?? master),
      club: canonicalTeamName(master.club),
      rank: existing?.rank ?? master.rank ?? index + 1,
    }, index);
  });
}

function finalPoints(row: Standing): number {
  return numberValue(row.points) + numberValue(row.penalty);
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

type MutableStanding = {
  club: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  form: Array<'W' | 'D' | 'L'>;
};

export type StandingSets = {
  overall: Standing[];
  home: Standing[];
  away: Standing[];
  form: Standing[];
};

function validScore(value: number | undefined): value is number {
  return Number.isInteger(value) && (value ?? -1) >= 0;
}

function matchOrder(match: SeasonMatch, index: number): number {
  if (Number.isFinite(match.matchday)) return Number(match.matchday) * 10_000 + (match.sortOrder ?? index);
  return 1_000_000 + (match.sortOrder ?? index);
}

function resultFor(goalsFor: number, goalsAgainst: number): 'W' | 'D' | 'L' {
  return goalsFor > goalsAgainst ? 'W' : goalsFor < goalsAgainst ? 'L' : 'D';
}

function newMutable(club: string): MutableStanding {
  return { club, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, form: [] };
}

function applyResult(row: MutableStanding, goalsFor: number, goalsAgainst: number) {
  row.played += 1;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
  const result = resultFor(goalsFor, goalsAgainst);
  if (result === 'W') row.wins += 1;
  else if (result === 'D') row.draws += 1;
  else row.losses += 1;
  row.form.push(result);
}

function toStanding(row: MutableStanding, penalty = 0): Standing {
  return {
    rank: 0,
    club: row.club,
    played: row.played,
    wins: row.wins,
    draws: row.draws,
    losses: row.losses,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDifference: row.goalsFor - row.goalsAgainst,
    points: row.wins * 3 + row.draws,
    penalty,
    form: row.form.slice(-5),
  };
}

export function calculateStandingSets(
  matches: SeasonMatch[],
  clubs: string[],
  penalties: ReadonlyMap<string, number> = new Map(),
): StandingSets {
  const orderedClubs = [...new Map(clubs.filter(Boolean).map((club) => {
    const canonical = canonicalTeamName(club);
    return [normalizeTeamName(canonical), canonical] as const;
  })).values()];
  const matchClubs = matches.flatMap((match) => [match.home, match.away]);
  for (const club of matchClubs) {
    const canonical = canonicalTeamName(club);
    if (canonical && !orderedClubs.some((item) => normalizeTeamName(item) === normalizeTeamName(canonical))) orderedClubs.push(canonical);
  }

  const createMap = () => new Map(orderedClubs.map((club) => [normalizeTeamName(club), newMutable(club)]));
  const overall = createMap();
  const home = createMap();
  const away = createMap();
  const histories = new Map<string, Array<{ order: number; goalsFor: number; goalsAgainst: number }>>(
    orderedClubs.map((club) => [normalizeTeamName(club), []]),
  );

  matches
    .map((match, index) => ({ match, order: matchOrder(match, index) }))
    .sort((a, b) => a.order - b.order)
    .forEach(({ match, order }) => {
      if ((match.competition ?? 'Campionato') !== 'Campionato' || match.status === 'live') return;
      if (!validScore(match.homeScore) || !validScore(match.awayScore)) return;
      const homeKey = normalizeTeamName(match.home);
      const awayKey = normalizeTeamName(match.away);
      const homeOverall = overall.get(homeKey);
      const awayOverall = overall.get(awayKey);
      const homeOnly = home.get(homeKey);
      const awayOnly = away.get(awayKey);
      if (!homeOverall || !awayOverall || !homeOnly || !awayOnly) return;
      applyResult(homeOverall, match.homeScore, match.awayScore);
      applyResult(awayOverall, match.awayScore, match.homeScore);
      applyResult(homeOnly, match.homeScore, match.awayScore);
      applyResult(awayOnly, match.awayScore, match.homeScore);
      histories.get(homeKey)?.push({ order, goalsFor: match.homeScore, goalsAgainst: match.awayScore });
      histories.get(awayKey)?.push({ order, goalsFor: match.awayScore, goalsAgainst: match.homeScore });
    });

  const form = createMap();
  for (const [key, history] of histories) {
    const row = form.get(key);
    if (!row) continue;
    history.sort((a, b) => a.order - b.order).slice(-5).forEach((result) => applyResult(row, result.goalsFor, result.goalsAgainst));
  }

  const penaltyFor = (club: string) => penalties.get(normalizeTeamName(club)) ?? penalties.get(club) ?? 0;
  return {
    overall: sortStandingRows([...overall.values()].map((row) => toStanding(row, penaltyFor(row.club)))),
    home: sortStandingRows([...home.values()].map((row) => toStanding(row))),
    away: sortStandingRows([...away.values()].map((row) => toStanding(row))),
    form: sortStandingRows([...form.values()].map((row) => toStanding(row))),
  };
}

/** Compatibility wrapper used by existing admin code. */
export function calculateStandings(matches: SeasonMatch[], clubs: string[]): Standing[] {
  return calculateStandingSets(matches, clubs).overall;
}

export function recalculateContentStandings(content: AppContent, matches = content.groupMatches ?? []): AppContent {
  const baseClubs = (content.standings ?? []).map((row) => row.club);
  const penalties = new Map((content.standings ?? []).map((row) => [normalizeTeamName(row.club), numberValue(row.penalty)]));
  const sets = calculateStandingSets(matches, baseClubs, penalties);
  return {
    ...content,
    standings: sets.overall,
    homeStandings: sets.home,
    awayStandings: sets.away,
    formStandings: sets.form,
  };
}
