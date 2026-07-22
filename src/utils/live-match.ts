import { Fixture, LiveEvent, LivePhase } from '../types';
import { teamNamesEqual } from './team-names';

const VALID_LIVE_PHASES = new Set<string>(['scheduled', 'first_half', 'halftime', 'second_half', 'finished']);

const FIRST_HALF_SECONDS = 45 * 60;
const FULL_TIME_SECONDS = 90 * 60;

function timestamp(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function phaseElapsedSeconds(fixture: Fixture, now = Date.now()): number {
  const phase = fixture.livePhase;
  const base = phase === 'second_half'
    ? Math.max(0, Number(fixture.secondHalfElapsedSeconds) || 0)
    : Math.max(0, Number(fixture.firstHalfElapsedSeconds) || 0);
  if (phase !== 'first_half' && phase !== 'second_half') return base;
  const startedAt = timestamp(fixture.phaseStartedAt);
  if (startedAt === null) return base;
  return base + Math.max(0, Math.floor((now - startedAt) / 1000));
}

export function footballElapsedSeconds(fixture: Fixture, now = Date.now()): number {
  const elapsed = phaseElapsedSeconds(fixture, now);
  return fixture.livePhase === 'second_half' || fixture.livePhase === 'finished'
    ? FIRST_HALF_SECONDS + elapsed
    : elapsed;
}

export function formatMatchClock(fixture: Fixture, now = Date.now()): string {
  if (fixture.livePhase === 'scheduled') return fixture.time || fixture.dateLabel;
  if (fixture.livePhase === 'halftime') return 'Intervallo';
  if (fixture.livePhase === 'finished' || fixture.status === 'final') return 'Finale';
  const total = footballElapsedSeconds(fixture, now);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function minuteLabelFor(phase: LivePhase, elapsedSeconds: number): string {
  const safeElapsed = Math.max(0, Math.floor(elapsedSeconds));
  const footballSeconds = phase === 'second_half' || phase === 'finished'
    ? FIRST_HALF_SECONDS + safeElapsed
    : safeElapsed;
  const threshold = phase === 'second_half' || phase === 'finished' ? FULL_TIME_SECONDS : FIRST_HALF_SECONDS;
  const baseMinute = phase === 'second_half' || phase === 'finished' ? 90 : 45;
  if (footballSeconds > threshold) {
    const added = Math.max(1, Math.floor(footballSeconds / 60) - baseMinute);
    return `${baseMinute}+${added}'`;
  }
  return `${Math.max(1, Math.floor(footballSeconds / 60))}'`;
}

export function currentEventTiming(fixture: Fixture, now = Date.now()) {
  const phase = fixture.livePhase ?? 'scheduled';
  const elapsed = phaseElapsedSeconds(fixture, now);
  const footballSeconds = phase === 'second_half' || phase === 'finished' ? FIRST_HALF_SECONDS + elapsed : elapsed;
  return {
    phase,
    phaseElapsedSeconds: elapsed,
    minute: Math.floor(footballSeconds / 60),
    minuteLabel: minuteLabelFor(phase, elapsed),
  };
}

function phaseOrder(phase: LivePhase | undefined, minute = 0): number {
  if (phase === 'scheduled') return 0;
  if (phase === 'first_half') return 1;
  if (phase === 'halftime') return 2;
  if (phase === 'second_half') return 3;
  if (phase === 'finished') return 4;
  return minute >= 45 ? 3 : 1;
}

export function sortLiveEvents(events: LiveEvent[]): LiveEvent[] {
  return [...events].sort((left, right) => {
    const phaseDifference = phaseOrder(left.phase, left.minute) - phaseOrder(right.phase, right.minute);
    if (phaseDifference) return phaseDifference;
    const elapsedDifference = (left.phaseElapsedSeconds ?? (left.minute ?? 0) * 60) - (right.phaseElapsedSeconds ?? (right.minute ?? 0) * 60);
    if (elapsedDifference) return elapsedDifference;
    return Date.parse(left.createdAt) - Date.parse(right.createdAt);
  });
}

function parseScore(value: string | undefined): [number, number] | null {
  const match = value?.match(/^(\d+)\s*[-:]\s*(\d+)$/);
  return match ? [Number(match[1]), Number(match[2])] : null;
}

export function scoreFromGoalEvents(fixture: Fixture, events = fixture.liveEvents ?? []): [number, number] {
  const kickoff = sortLiveEvents(events).find((event) => event.type === 'kickoff');
  const base = parseScore(kickoff?.score) ?? [0, 0];
  let [homeScore, awayScore] = base;
  for (const event of events) {
    if (event.type !== 'goal') continue;
    if (event.team && teamNamesEqual(event.team, fixture.home)) homeScore += 1;
    else if (event.team && teamNamesEqual(event.team, fixture.away)) awayScore += 1;
  }
  return [homeScore, awayScore];
}

export function inferLegacyEventPhase(event: LiveEvent, allEvents: LiveEvent[]): LivePhase {
  // 1. Rispetta phase esplicita valida
  if (event.phase && VALID_LIVE_PHASES.has(event.phase)) {
    return event.phase as LivePhase;
  }
  // 2. Mappa i tipi noti
  if (event.type === 'kickoff') return 'first_half';
  if (event.type === 'halftime') return 'halftime';
  if (event.type === 'second_half') return 'second_half';
  if (event.type === 'fulltime') return 'finished';

  // 3. Legacy senza phase: cerca il marker second_half
  const secondHalfMarker = allEvents.find((e) => e.type === 'second_half');

  if (secondHalfMarker) {
    const eventTs = event.createdAt ? Date.parse(event.createdAt) : NaN;
    const markerTs = secondHalfMarker.createdAt ? Date.parse(secondHalfMarker.createdAt) : NaN;
    if (Number.isFinite(eventTs) && Number.isFinite(markerTs) && eventTs !== markerTs) {
      return eventTs < markerTs ? 'first_half' : 'second_half';
    }
    // Fallback: confronto minuto
    if (event.minute !== undefined && secondHalfMarker.minute !== undefined) {
      return event.minute < secondHalfMarker.minute ? 'first_half' : 'second_half';
    }
  }

  // 4. Fallback conservativo per minuto
  if (event.minute !== undefined) {
    return event.minute >= 45 ? 'second_half' : 'first_half';
  }

  return 'first_half';
}

export function removeGoal(fixture: Fixture, eventId: string): Fixture {
  const originalEvents = fixture.liveEvents ?? [];
  const filteredEvents = originalEvents.filter((event) => event.id !== eventId);

  // Replay events in chronological order to compute correct scores
  const sortedEvents = sortLiveEvents(filteredEvents);
  let [runningHome, runningAway] = parseScore(
    sortedEvents.find((event) => event.type === 'kickoff')?.score,
  ) ?? [0, 0];

  const scoredEvents = sortedEvents.map((event) => {
    if (event.type === 'goal') {
      if (event.team && teamNamesEqual(event.team, fixture.home)) runningHome += 1;
      else if (event.team && teamNamesEqual(event.team, fixture.away)) runningAway += 1;
    }
    return { ...event, score: `${runningHome}-${runningAway}` };
  });

  // Build lookup for updated scores
  const scoredMap = new Map(scoredEvents.map((e) => [e.id, e]));

  // Preserve original event order
  const resultEvents = filteredEvents.map((event) => scoredMap.get(event.id) ?? event);

  return {
    ...fixture,
    liveEvents: resultEvents,
    homeScore: runningHome,
    awayScore: runningAway,
  };
}
