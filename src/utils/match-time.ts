import { Fixture, SeasonMatch } from '../types';

const ITALY_TIME_ZONE = 'Europe/Rome';
const ONE_HOUR = 60 * 60 * 1000;
const FOUR_HOURS = 4 * ONE_HOUR;

function timeZoneOffsetMs(timestamp: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestamp));

  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const representedAsUtc = Date.UTC(value('year'), value('month') - 1, value('day'), value('hour'), value('minute'), value('second'));
  return representedAsUtc - timestamp;
}

function italyLocalTimestamp(year: number, month: number, day: number, hour: number, minute: number): number {
  const wallClockUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const firstOffset = timeZoneOffsetMs(wallClockUtc, ITALY_TIME_ZONE);
  let timestamp = wallClockUtc - firstOffset;
  const correctedOffset = timeZoneOffsetMs(timestamp, ITALY_TIME_ZONE);
  if (correctedOffset !== firstOffset) timestamp = wallClockUtc - correctedOffset;
  return timestamp;
}

export function parseItalianKickoff(dateLabel?: string, time?: string): number | null {
  if (!dateLabel || !time) return null;
  const date = dateLabel.trim().match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
  const clock = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!date || !clock) return null;

  const day = Number(date[1]);
  const month = Number(date[2]);
  const year = Number(date[3]);
  const hour = Number(clock[1]);
  const minute = Number(clock[2]);
  if (day < 1 || day > 31 || month < 1 || month > 12 || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return italyLocalTimestamp(year, month, day, hour, minute);
}

function explicitKickoff(value?: string): number | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function normalizedTeam(value: string): string {
  return value
    .toLocaleLowerCase('it-IT')
    .replace(/\bac\b/g, '')
    .replace(/\bcalcio\b/g, '')
    .replace(/[^a-zà-ÿ0-9]/g, '');
}

function sameFixture(fixture: Fixture, match: SeasonMatch): boolean {
  return normalizedTeam(fixture.home) === normalizedTeam(match.home) && normalizedTeam(fixture.away) === normalizedTeam(match.away);
}

export function fixtureKickoffTimestamp(fixture: Fixture, schedule: SeasonMatch[] = []): number | null {
  const direct = explicitKickoff(fixture.kickoffAt) ?? parseItalianKickoff(fixture.dateLabel, fixture.time);
  if (direct !== null) return direct;

  const scheduledMatch = schedule.find((match) => sameFixture(fixture, match));
  if (!scheduledMatch) return null;
  return explicitKickoff(scheduledMatch.kickoffAt) ?? parseItalianKickoff(scheduledMatch.dateLabel, scheduledMatch.time);
}

export function isFixtureVisibleOnHome(fixture: Fixture, schedule: SeasonMatch[] = [], now = Date.now()): boolean {
  if (fixture.status === 'final') return false;
  const kickoff = fixtureKickoffTimestamp(fixture, schedule);
  if (kickoff === null || now < kickoff - ONE_HOUR) return false;
  if (fixture.status === 'live') return true;
  return now <= kickoff + FOUR_HOURS;
}

export function findHomeLiveFixture(fixtures: Fixture[], schedule: SeasonMatch[] = [], now = Date.now()): Fixture | undefined {
  return fixtures
    .filter((fixture) => isFixtureVisibleOnHome(fixture, schedule, now))
    .sort((a, b) => (fixtureKickoffTimestamp(a, schedule) ?? Number.MAX_SAFE_INTEGER) - (fixtureKickoffTimestamp(b, schedule) ?? Number.MAX_SAFE_INTEGER))[0];
}
