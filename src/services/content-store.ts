import AsyncStorage from '@react-native-async-storage/async-storage';

import { playerPhotoFallbacks } from '../data/player-photo-fallbacks';
import { preseasonStandings } from '../data/season-2026-27';
import { seedContent } from '../data/seed';
import { defaultTeams } from '../data/teams';
import { AppContent, Fixture, LiveEvent, LivePhase, MatchLineup, MediaItem, NewsArticle, Player, SeasonMatch, Team } from '../types';
import { completeStandingRows, emptyStandingRows, normalizeStandingRow, recalculateContentStandings, sortStandingRows } from '../utils/standings';
import { canonicalTeamName, normalizeTeamName } from '../utils/team-names';
import { minuteLabelFor, inferLegacyEventPhase } from '../utils/live-match';

const STORAGE_KEY = '@ac-prato/content-v10';
const LEGACY_KEYS = ['@ac-prato/content-v9', '@ac-prato/content-v8', '@ac-prato/content-v7', '@ac-prato/content-v6', '@ac-prato/content-v5', '@ac-prato/content-v4', '@ac-prato/content-v3', '@ac-prato/content-v2'];

function normalizeLineup(lineup: MatchLineup | undefined): MatchLineup | undefined {
  if (!lineup) return undefined;
  const rawStarters = Array.isArray(lineup.starters)
    ? lineup.starters.filter((item): item is MatchLineup['starters'][number] => item != null && typeof item.playerId === 'string' && item.playerId.trim().length > 0)
    : [];
  const rawSubs = Array.isArray(lineup.substitutes)
    ? lineup.substitutes.filter((item): item is MatchLineup['substitutes'][number] => item != null && typeof item.playerId === 'string' && item.playerId.trim().length > 0)
    : [];
  const starters: MatchLineup['starters'] = [];
  const starterIds = new Set<string>();
  for (const item of rawStarters) {
    const pid = item.playerId.trim();
    if (!starterIds.has(pid)) {
      starterIds.add(pid);
      starters.push({ ...item, playerId: pid });
    }
  }
  const substitutes: MatchLineup['substitutes'] = [];
  const subIds = new Set<string>();
  for (const item of rawSubs) {
    const pid = item.playerId.trim();
    if (!starterIds.has(pid) && !subIds.has(pid)) {
      subIds.add(pid);
      substitutes.push({ ...item, playerId: pid });
    }
  }
  return {
    ...lineup,
    formation: lineup.formation?.trim() || undefined,
    confirmedAt: lineup.confirmedAt && !Number.isNaN(Date.parse(lineup.confirmedAt)) ? lineup.confirmedAt : undefined,
    starters: starters.map((item, index) => ({ ...item, starter: true, positionOrder: item.positionOrder ?? index })),
    substitutes: substitutes.map((item, index) => ({ ...item, starter: false, positionOrder: item.positionOrder ?? index })),
  };
}

function safeInt(value: unknown): number | undefined {
  if (value == null) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(0, Math.floor(n));
}

function phaseElapsedFromMinute(minute: number, phase: LivePhase | undefined): number {
  if (phase === 'second_half' || phase === 'finished') return Math.max(0, (minute - 45) * 60);
  if (phase === 'halftime') return 0;
  return minute * 60;
}

function normalizeFixture(fixture: Fixture): Fixture {
  const demoMatchday = /demo|dimostrativa/i.test(fixture.matchday);
  const demoDate = /demo|dimostrativa/i.test(fixture.dateLabel);

  const rawEvents = Array.isArray(fixture.liveEvents)
    ? fixture.liveEvents.filter((e): e is LiveEvent => e != null && typeof e === 'object')
    : [];

  const seenIds = new Set<string>();
  const liveEvents: LiveEvent[] = rawEvents.map((event, index) => {
    const cleanMinute = safeInt(event.minute);
    const cleanPhaseElapsed = safeInt(event.phaseElapsedSeconds);

    const phase = inferLegacyEventPhase(event, rawEvents);

    const phaseElapsed = cleanPhaseElapsed !== undefined
      ? cleanPhaseElapsed
      : (cleanMinute !== undefined ? phaseElapsedFromMinute(cleanMinute, phase) : undefined);

    let computedLabel: string | undefined;
    if (event.minuteLabel && typeof event.minuteLabel === 'string' && event.minuteLabel.trim().length > 0) {
      computedLabel = event.minuteLabel;
    } else if (event.type === 'halftime') {
      computedLabel = 'Intervallo';
    } else if (event.type === 'fulltime') {
      computedLabel = 'Finale';
    } else if (cleanMinute !== undefined && phase) {
      computedLabel = minuteLabelFor(phase, phaseElapsed ?? cleanMinute * 60);
    }

    const existingId = event.id && typeof event.id === 'string' && event.id.trim();
    const baseTs = (fixture.kickoffAt && !Number.isNaN(Date.parse(fixture.kickoffAt)))
      ? Date.parse(fixture.kickoffAt)
      : Date.parse('2025-01-01T00:00:00.000Z');
    const stableCreatedAt = (() => {
      if (event.createdAt && typeof event.createdAt === 'string' && !Number.isNaN(Date.parse(event.createdAt))) {
        return event.createdAt;
      }
      return new Date(baseTs + index * 1000).toISOString();
    })();
    const baseId = existingId || `${fixture.id || 'fixture'}-event-${index}`;
    let stableId = baseId;
    let collision = 0;
    while (seenIds.has(stableId)) {
      collision++;
      stableId = `${baseId}-v${collision}`;
    }
    seenIds.add(stableId);


    return {
      ...event,
      id: stableId,
      createdAt: stableCreatedAt,
      minute: cleanMinute,
      phaseElapsedSeconds: phaseElapsed,
      phase,
      minuteLabel: computedLabel,
    };
  });

  // eventBasedPhase per precedenza: finished > second_half > halftime > first_half
  const eventBasedPhase: LivePhase | undefined = (() => {
    for (const e of liveEvents) {
      if (e.type === 'fulltime') return 'finished';
    }
    for (const e of liveEvents) {
      if (e.type === 'second_half') return 'second_half';
    }
    for (const e of liveEvents) {
      if (e.type === 'halftime') return 'halftime';
    }
    for (const e of liveEvents) {
      if (e.type === 'kickoff') return 'first_half';
    }
    return undefined;
  })();

  const cleanFixtureMinute = safeInt(fixture.minute);
  const validExplicitPhase = typeof fixture.livePhase === 'string' && new Set<string>(['scheduled', 'first_half', 'halftime', 'second_half', 'finished']).has(fixture.livePhase)
    ? (fixture.livePhase as LivePhase)
    : undefined;
  const inferredLivePhase: LivePhase = fixture.status === 'final'
    ? 'finished'
    : (validExplicitPhase
        ?? eventBasedPhase
        ?? (fixture.status === 'live' ? 'first_half' : undefined)
        ?? 'scheduled');

  const explicitFirstHalf = safeInt(fixture.firstHalfElapsedSeconds);
  const explicitSecondHalf = safeInt(fixture.secondHalfElapsedSeconds);
  const firstHalfFromMinute = explicitFirstHalf !== undefined
    ? explicitFirstHalf
    : (cleanFixtureMinute !== undefined
      ? ((inferredLivePhase === 'first_half' || inferredLivePhase === 'halftime')
        ? cleanFixtureMinute * 60
        : Math.min(cleanFixtureMinute, 45) * 60)
      : 0);
  const secondHalfFromMinute = explicitSecondHalf !== undefined
    ? explicitSecondHalf
    : (cleanFixtureMinute !== undefined && (inferredLivePhase === 'second_half' || inferredLivePhase === 'finished')
      ? Math.max(0, cleanFixtureMinute - 45) * 60
      : 0);
  const normalizedLivePhase: LivePhase = inferredLivePhase;
  const validPhaseStartedAt = (
    fixture.phaseStartedAt
    && !Number.isNaN(Date.parse(fixture.phaseStartedAt))
    && (normalizedLivePhase === 'first_half' || normalizedLivePhase === 'second_half')
  ) ? fixture.phaseStartedAt : undefined;

  return {
    ...fixture,
    matchday: demoMatchday ? '1ª giornata' : fixture.matchday,
    dateLabel: demoDate ? '' : fixture.dateLabel,
    kickoffAt: fixture.kickoffAt || undefined,
    isDemo: false,
    livePhase: normalizedLivePhase,
    liveEvents,
    phaseStartedAt: validPhaseStartedAt,
    firstHalfElapsedSeconds: firstHalfFromMinute,
    secondHalfElapsedSeconds: secondHalfFromMinute,
    homeLineup: normalizeLineup(fixture.homeLineup),
    awayLineup: normalizeLineup(fixture.awayLineup),
  };
}

function normalizePlayer(player: Player): Player {
  const seed = seedContent.players.find((item) => item.id === player.id);
  const fallback = playerPhotoFallbacks[player.id];
  return {
    ...seed,
    ...player,
    appearances: player.appearances ?? 0,
    goals: player.goals ?? 0,
    liveGoals: Math.max(0, Number(player.liveGoals) || 0),
    assists: player.assists ?? 0,
    imageUrl: player.imageUrl || fallback?.imageUrl || seed?.imageUrl || '',
    imageSourceUrl: player.imageSourceUrl || fallback?.imageSourceUrl || seed?.imageSourceUrl,
    imageScale: player.imageScale ?? fallback?.imageScale ?? seed?.imageScale ?? 1,
    imagePositionX: player.imagePositionX ?? fallback?.imagePositionX ?? seed?.imagePositionX ?? 0,
    imagePositionY: player.imagePositionY ?? fallback?.imagePositionY ?? seed?.imagePositionY ?? 0,
    nationality: player.nationality ?? 'Italia',
  };
}

function normalizeNews(article: NewsArticle): NewsArticle {
  return {
    ...article,
    body: article.body ?? article.summary,
    imageUrl: article.imageUrl ?? '',
    imageScale: article.imageScale ?? 1,
    imagePositionX: article.imagePositionX ?? 0,
    imagePositionY: article.imagePositionY ?? 0,
  };
}

function normalizeMedia(item: MediaItem): MediaItem {
  return { ...item, description: item.description ?? '', thumbnailUrl: item.thumbnailUrl ?? '', source: item.source ?? 'Redazione' };
}

function normalizeGroupMatch(match: SeasonMatch, index: number): SeasonMatch {
  const matchday = Number(match.matchday) || undefined;
  return {
    ...match,
    id: match.id || `group-match-${index + 1}`,
    matchday,
    leg: match.leg ?? (matchday ? (matchday <= 17 ? 'Andata' : 'Ritorno') : undefined),
    competition: match.competition ?? 'Campionato',
    roundLabel: match.roundLabel ?? (matchday ? `${matchday}ª giornata` : ''),
    dateLabel: match.dateLabel ?? '',
    time: match.time ?? '',
    venue: match.venue ?? '',
    sortOrder: Number(match.sortOrder) || index,
    status: match.status ?? (Number.isInteger(match.homeScore) && Number.isInteger(match.awayScore) ? 'final' : 'scheduled'),
  };
}

function normalizeSchedule(match: SeasonMatch, index: number): SeasonMatch {
  const matchday = Number(match.matchday) || undefined;
  return {
    ...match,
    id: match.id || `season-match-${index + 1}`,
    matchday,
    leg: match.leg ?? (matchday ? (matchday <= 17 ? 'Andata' : 'Ritorno') : undefined),
    competition: match.competition ?? 'Campionato',
    roundLabel: match.roundLabel ?? (matchday ? `${matchday}ª giornata` : ''),
    dateLabel: match.dateLabel ?? '',
    time: match.time ?? '',
    venue: match.venue ?? '',
    sortOrder: Number(match.sortOrder) || index,
    status: match.status ?? (Number.isInteger(match.homeScore) && Number.isInteger(match.awayScore) ? 'final' : 'scheduled'),
  };
}

function normalizeTeam(team: Team, index: number): Team {
  const name = canonicalTeamName(team.name ?? '');
  const players = Array.isArray(team.players) ? team.players.filter((player) => !!player?.name) : [];
  const uniquePlayers = [...new Map(players.map((player) => [player.id || normalizeTeamName(player.name), player])).values()];
  return {
    ...team,
    id: team.id || normalizeTeamName(name) || `team-${index + 1}`,
    name,
    normalizedName: normalizeTeamName(name),
    players: uniquePlayers.sort((a, b) => (a.number ?? Number.MAX_SAFE_INTEGER) - (b.number ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name, 'it')),
  };
}

export function normalizeContent(content: AppContent): AppContent {
  const master = preseasonStandings.map(normalizeStandingRow);
  const emptyMaster = emptyStandingRows(master);

  // Merge giocatori: seed come base, dati salvati sovrascrivono per id corrispondente
  const savedPlayers = Array.isArray(content.players) ? content.players.map(normalizePlayer) : [];
  const savedMap = new Map(savedPlayers.map((p) => [p.id, p]));
  const mergedPlayers = seedContent.players.map((seedPlayer) => {
    const saved = savedMap.get(seedPlayer.id);
    return saved ? normalizePlayer({ ...seedPlayer, ...saved }) : seedPlayer;
  });
  for (const savedPlayer of savedPlayers) {
    if (!mergedPlayers.some((player) => player.id === savedPlayer.id)) mergedPlayers.push(savedPlayer);
  }

  const baseTeams = defaultTeams(mergedPlayers);
  const savedTeams = Array.isArray(content.teams) ? content.teams.map(normalizeTeam) : [];
  const savedTeamsByName = new Map(savedTeams.map((team) => [team.normalizedName, team]));
  const mergedTeams = baseTeams.map((team) => {
    const saved = savedTeamsByName.get(team.normalizedName);
    if (!saved) return team;
    return normalizeTeam({ ...team, ...saved, players: saved.players.length ? saved.players : team.players }, 0);
  });
  for (const saved of savedTeams) {
    if (!mergedTeams.some((team) => team.normalizedName === saved.normalizedName)) mergedTeams.push(saved);
  }

  const normalized: AppContent = {
    fixtures: Array.isArray(content.fixtures) ? content.fixtures.map(normalizeFixture) : seedContent.fixtures.map(normalizeFixture),
    standings: sortStandingRows(completeStandingRows(content.standings, master)),
    homeStandings: sortStandingRows(completeStandingRows(content.homeStandings, emptyMaster)),
    awayStandings: sortStandingRows(completeStandingRows(content.awayStandings, emptyMaster)),
    formStandings: sortStandingRows(completeStandingRows(content.formStandings, emptyMaster)),
    schedule: Array.isArray(content.schedule) ? content.schedule.map(normalizeSchedule) : seedContent.schedule?.map(normalizeSchedule),
    groupMatches: Array.isArray(content.groupMatches) ? content.groupMatches.map(normalizeGroupMatch) : (seedContent.groupMatches?.length ? seedContent.groupMatches.map(normalizeGroupMatch) : []),
    teams: mergedTeams,
    players: mergedPlayers,
    news: Array.isArray(content.news) ? content.news.map(normalizeNews) : seedContent.news,
    media: Array.isArray(content.media) ? content.media.map(normalizeMedia) : seedContent.media,
    updatedAt: content.updatedAt || seedContent.updatedAt,
  };
  return normalized.groupMatches?.length ? recalculateContentStandings(normalized, normalized.groupMatches) : normalized;
}

export async function loadContent(): Promise<AppContent> {
  try {
    const current = await AsyncStorage.getItem(STORAGE_KEY);
    if (current) return normalizeContent(JSON.parse(current) as AppContent);
    for (const key of LEGACY_KEYS) {
      const legacy = await AsyncStorage.getItem(key);
      if (legacy) {
        const migrated = normalizeContent(JSON.parse(legacy) as AppContent);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
    return normalizeContent(seedContent);
  } catch (error) {
    console.warn('Impossibile caricare i contenuti salvati', error);
    return normalizeContent(seedContent);
  }
}

export async function saveContent(content: AppContent): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeContent(content)));
}

export async function resetContent(): Promise<AppContent> {
  await Promise.all([AsyncStorage.removeItem(STORAGE_KEY), ...LEGACY_KEYS.map((key) => AsyncStorage.removeItem(key))]);
  return normalizeContent(seedContent);
}
