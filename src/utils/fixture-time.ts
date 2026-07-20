import { Fixture } from '../types';

const ONE_HOUR = 60 * 60 * 1000;

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
  return hour <= 23 && minute <= 59 ? [hour, minute] : null;
}

export function kickoffTimestamp(fixture: Fixture): number | null {
  if (fixture.kickoffAt) {
    const timestamp = Date.parse(fixture.kickoffAt);
    if (Number.isFinite(timestamp)) return timestamp;
  }

  const date = parseDate(fixture.dateLabel);
  const time = parseTime(fixture.time);
  if (!date || !time) return null;
  const [year, month, day] = date;
  const [hour, minute] = time;
  const timestamp = new Date(year, month - 1, day, hour, minute, 0, 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function kickoffIso(dateValue: string, timeValue: string): string | null {
  const date = parseDate(dateValue);
  const time = parseTime(timeValue);
  if (!date || !time) return null;
  const [year, month, day] = date;
  const [hour, minute] = time;
  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

export function kickoffInput(fixture: Fixture): { date: string; time: string } {
  if (fixture.kickoffAt) {
    const date = new Date(fixture.kickoffAt);
    if (Number.isFinite(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      return { date: `${day}/${month}/${date.getFullYear()}`, time: `${hour}:${minute}` };
    }
  }
  return { date: fixture.dateLabel, time: fixture.time };
}

export function isHomeLiveVisible(fixture: Fixture, now = Date.now()): boolean {
  if (fixture.status === 'final') return false;
  const kickoff = kickoffTimestamp(fixture);
  return kickoff !== null && now >= kickoff - ONE_HOUR;
}
