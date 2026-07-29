import { Fixture } from '../types';
import { isLiveWindow, kickoffTimestamp } from './fixture-time';

export const NEXT_FIXTURE_REVEAL_MS = 48 * 60 * 60 * 1000;

function byKickoffAscending(a: Fixture, b: Fixture): number {
  return (kickoffTimestamp(a) ?? Number.MAX_SAFE_INTEGER) - (kickoffTimestamp(b) ?? Number.MAX_SAFE_INTEGER);
}

function byKickoffDescending(a: Fixture, b: Fixture): number {
  return (kickoffTimestamp(b) ?? Number.MIN_SAFE_INTEGER) - (kickoffTimestamp(a) ?? Number.MIN_SAFE_INTEGER);
}

/**
 * Seleziona la partita mostrata nella sezione Live.
 *
 * Una gara in corso ha sempre la precedenza. Dopo la conclusione, l'ultima
 * partita resta visibile fino a 48 ore prima del calcio d'inizio della
 * successiva; da quel momento viene mostrata la prossima gara.
 */
export function selectPublicLiveFixture(fixtures: Fixture[], now = Date.now()): Fixture | null {
  const realFixtures = fixtures.filter((fixture) => !fixture.isDemo);

  const explicitlyLive = realFixtures.find((fixture) => fixture.status === 'live');
  if (explicitlyLive) return explicitlyLive;

  const inLiveWindow = realFixtures
    .filter((fixture) => fixture.status !== 'final' && isLiveWindow(fixture, now))
    .sort(byKickoffAscending);
  if (inLiveWindow.length > 0) return inLiveWindow[0];

  const upcoming = realFixtures
    .filter((fixture) => fixture.status === 'scheduled' && (kickoffTimestamp(fixture) ?? Number.MIN_SAFE_INTEGER) > now)
    .sort(byKickoffAscending);
  const nextFixture = upcoming[0] ?? null;

  const completed = realFixtures
    .filter((fixture) => fixture.status === 'final' && (kickoffTimestamp(fixture) ?? Number.MAX_SAFE_INTEGER) <= now)
    .sort(byKickoffDescending);
  const latestCompleted = completed[0] ?? null;

  if (latestCompleted) {
    const nextKickoff = nextFixture ? kickoffTimestamp(nextFixture) : null;
    if (nextKickoff === null || now < nextKickoff - NEXT_FIXTURE_REVEAL_MS) {
      return latestCompleted;
    }
  }

  return nextFixture ?? latestCompleted;
}
