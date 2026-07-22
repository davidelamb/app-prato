import { AppContent, Fixture, FixtureStatus, SeasonMatch } from '../types';
import { recalculateContentStandings } from './standings';
import { teamNamesEqual } from './team-names';

function matchdayNumber(value: number | string | undefined): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = String(value ?? '').match(/\d+/)?.[0];
  return parsed ? Number(parsed) : undefined;
}

function normalizedDate(value: string | undefined): string {
  return String(value ?? '').toLocaleLowerCase('it').replace(/[^a-z0-9]+/g, ' ').trim();
}

type MatchIdentity = Pick<SeasonMatch, 'id' | 'home' | 'away' | 'matchday' | 'dateLabel' | 'fixtureId'>;
type FixtureIdentity = Pick<Fixture, 'id' | 'home' | 'away' | 'matchday' | 'dateLabel' | 'scheduleMatchId' | 'groupMatchId'>;

function linkedIds(left: MatchIdentity | FixtureIdentity, right: MatchIdentity | FixtureIdentity): boolean {
  const leftIds = new Set([left.id, 'fixtureId' in left ? left.fixtureId : undefined, 'scheduleMatchId' in left ? left.scheduleMatchId : undefined, 'groupMatchId' in left ? left.groupMatchId : undefined].filter(Boolean));
  const rightIds = [right.id, 'fixtureId' in right ? right.fixtureId : undefined, 'scheduleMatchId' in right ? right.scheduleMatchId : undefined, 'groupMatchId' in right ? right.groupMatchId : undefined].filter(Boolean);
  return rightIds.some((id) => leftIds.has(id));
}

export function sameMatch(left: MatchIdentity | FixtureIdentity, right: MatchIdentity | FixtureIdentity): boolean {
  if (linkedIds(left, right)) return true;
  if (!teamNamesEqual(left.home, right.home) || !teamNamesEqual(left.away, right.away)) return false;
  const leftDay = matchdayNumber(left.matchday);
  const rightDay = matchdayNumber(right.matchday);
  if (leftDay !== undefined && rightDay !== undefined) return leftDay === rightDay;
  const leftDate = normalizedDate(left.dateLabel);
  const rightDate = normalizedDate(right.dateLabel);
  return !!leftDate && !!rightDate && leftDate === rightDate;
}

function scoreStatus(homeScore: number | undefined, awayScore: number | undefined, fallback?: FixtureStatus): FixtureStatus {
  if (fallback === 'live') return 'live';
  return Number.isInteger(homeScore) && Number.isInteger(awayScore) ? 'final' : 'scheduled';
}

function resultPatch(source: Pick<SeasonMatch, 'homeScore' | 'awayScore' | 'status'>) {
  return {
    homeScore: source.homeScore,
    awayScore: source.awayScore,
    status: scoreStatus(source.homeScore, source.awayScore, source.status),
  };
}

function fixtureResultPatch(source: Pick<Fixture, 'homeScore' | 'awayScore' | 'status'>) {
  return { homeScore: source.homeScore, awayScore: source.awayScore, status: source.status };
}

export function synchronizeGroupMatches(content: AppContent, groupMatches: SeasonMatch[]): AppContent {
  const schedule = (content.schedule ?? []).map((match) => {
    const source = groupMatches.find((candidate) => sameMatch(match, candidate));
    return source ? { ...match, ...resultPatch(source) } : match;
  });
  const fixtures = content.fixtures.map((fixture) => {
    const source = groupMatches.find((candidate) => sameMatch(fixture, candidate));
    if (!source) return fixture;
    const patch = resultPatch(source);
    return {
      ...fixture,
      homeScore: patch.homeScore,
      awayScore: patch.awayScore,
      status: patch.status,
      livePhase: patch.status === 'final' ? 'finished' : patch.status === 'scheduled' ? 'scheduled' : fixture.livePhase,
      phaseStartedAt: patch.status === 'live' ? fixture.phaseStartedAt : undefined,
    };
  });
  return recalculateContentStandings({ ...content, groupMatches, schedule, fixtures }, groupMatches);
}

export function synchronizeSchedule(content: AppContent, schedule: SeasonMatch[]): AppContent {
  const groupMatches = (content.groupMatches ?? []).map((match) => {
    const source = schedule.find((candidate) => sameMatch(match, candidate));
    return source ? { ...match, ...resultPatch(source) } : match;
  });
  const fixtures = content.fixtures.map((fixture) => {
    const source = schedule.find((candidate) => sameMatch(fixture, candidate));
    if (!source) return fixture;
    const patch = resultPatch(source);
    return { ...fixture, homeScore: patch.homeScore, awayScore: patch.awayScore, status: patch.status, livePhase: patch.status === 'final' ? 'finished' : patch.status === 'scheduled' ? 'scheduled' : fixture.livePhase };
  });
  return recalculateContentStandings({ ...content, schedule, groupMatches, fixtures }, groupMatches);
}

export function synchronizeFixture(content: AppContent, nextFixture: Fixture): AppContent {
  const fixtures = content.fixtures.map((fixture) => fixture.id === nextFixture.id ? nextFixture : fixture);
  const schedule = (content.schedule ?? []).map((match) => sameMatch(match, nextFixture) ? { ...match, ...fixtureResultPatch(nextFixture), fixtureId: nextFixture.id } : match);
  const groupMatches = (content.groupMatches ?? []).map((match) => sameMatch(match, nextFixture) ? { ...match, ...fixtureResultPatch(nextFixture), fixtureId: nextFixture.id } : match);
  const completedGoals = new Map<string, number>();
  for (const fixture of fixtures) {
    if (fixture.status !== 'final') continue;
    for (const event of fixture.liveEvents ?? []) {
      if (event.type === 'goal' && event.playerId) completedGoals.set(event.playerId, (completedGoals.get(event.playerId) ?? 0) + 1);
    }
  }
  const players = content.players.map((player) => {
    const previousLiveGoals = Math.max(0, Number(player.liveGoals) || 0);
    const nextLiveGoals = completedGoals.get(player.id) ?? 0;
    return { ...player, goals: Math.max(0, player.goals - previousLiveGoals + nextLiveGoals), liveGoals: nextLiveGoals };
  });
  return recalculateContentStandings({ ...content, fixtures, schedule, groupMatches, players }, groupMatches);
}
