import { Fixture } from '../types';

const ITALY_TIME_ZONE = 'Europe/Rome';

type DateParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function parseDate(value: string): [number, number, number] | null {
  const italian = value.trim().match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  if (italian) return [Number(italian[3]), Number(italian[2]), Number(italian[1])];
  const iso = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  return null;
}

function parseTime(value: string): [number, number] | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 ? [hour, minute] : null;
}

function partsInItaly(timestamp: number): DateParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ITALY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestamp));
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: value('year'), month: value('month'), day: value('day'), hour: value('hour'), minute: value('minute'), second: value('second') };
}

function italyOffsetMs(timestamp: number): number {
  const parts = partsInItaly(timestamp);
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - timestamp;
}

function italyLocalTimestamp(year: number, month: number, day: number, hour: number, minute: number): number | null {
  if (year < 2000 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const wallClockUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const firstOffset = italyOffsetMs(wallClockUtc);
  let timestamp = wallClockUtc - firstOffset;
  const correctedOffset = italyOffsetMs(timestamp);
  if (correctedOffset !== firstOffset) timestamp = wallClockUtc - correctedOffset;

  const verified = partsInItaly(timestamp);
  if (verified.year !== year || verified.month !== month || verified.day !== day || verified.hour !== hour || verified.minute !== minute) return null;
  return timestamp;
}

function parsedKickoff(dateValue: string, timeValue: string): number | null {
  const date = parseDate(dateValue);
  const time = parseTime(timeValue);
  if (!date || !time) return null;
  const [year, month, day] = date;
  const [hour, minute] = time;
  return italyLocalTimestamp(year, month, day, hour, minute);
}

export function kickoffTimestamp(fixture: Fixture): number | null {
  if (fixture.kickoffAt) {
    const timestamp = Date.parse(fixture.kickoffAt);
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return parsedKickoff(fixture.dateLabel, fixture.time);
}

export function kickoffIso(dateValue: string, timeValue: string): string | null {
  const timestamp = parsedKickoff(dateValue, timeValue);
  return timestamp === null ? null : new Date(timestamp).toISOString();
}

export function kickoffInput(fixture: Fixture): { date: string; time: string } {
  if (fixture.kickoffAt) {
    const timestamp = Date.parse(fixture.kickoffAt);
    if (Number.isFinite(timestamp)) {
      const parts = partsInItaly(timestamp);
      const day = String(parts.day).padStart(2, '0');
      const month = String(parts.month).padStart(2, '0');
      const hour = String(parts.hour).padStart(2, '0');
      const minute = String(parts.minute).padStart(2, '0');
      return { date: `${day}/${month}/${parts.year}`, time: `${hour}:${minute}` };
    }
  }
  return { date: fixture.dateLabel, time: fixture.time };
}

