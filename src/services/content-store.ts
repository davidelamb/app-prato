import AsyncStorage from '@react-native-async-storage/async-storage';

import { playerPhotoFallbacks } from '../data/player-photo-fallbacks';
import { preseasonStandings } from '../data/season-2026-27';
import { seedContent } from '../data/seed';
import { AppContent, Fixture, MediaItem, NewsArticle, Player, SeasonMatch } from '../types';
import { completeStandingRows, emptyStandingRows, normalizeStandingRow, sortStandingRows } from '../utils/standings';

const STORAGE_KEY = '@ac-prato/content-v10';
const LEGACY_KEYS = ['@ac-prato/content-v9', '@ac-prato/content-v8', '@ac-prato/content-v7', '@ac-prato/content-v6', '@ac-prato/content-v5', '@ac-prato/content-v4', '@ac-prato/content-v3', '@ac-prato/content-v2'];

function normalizeFixture(fixture: Fixture): Fixture {
  const demoMatchday = /demo|dimostrativa/i.test(fixture.matchday);
  const demoDate = /demo|dimostrativa/i.test(fixture.dateLabel);
  return {
    ...fixture,
    matchday: demoMatchday ? '1ª giornata' : fixture.matchday,
    dateLabel: demoDate ? '' : fixture.dateLabel,
    kickoffAt: fixture.kickoffAt || undefined,
    isDemo: false,
    livePhase: fixture.livePhase ?? (fixture.status === 'live' ? 'first_half' : fixture.status === 'final' ? 'finished' : 'scheduled'),
    liveEvents: fixture.liveEvents ?? [],
  };
}

function normalizePlayer(player: Player): Player {
  const seed = seedContent.players.find((item) => item.id === player.id);
  const fallback = playerPhotoFallbacks[player.id];
  return {
    ...player,
    appearances: player.appearances ?? 0,
    goals: player.goals ?? 0,
    assists: player.assists ?? 0,
    imageUrl: player.imageUrl || fallback?.imageUrl || seed?.imageUrl || '',
    imageSourceUrl: player.imageSourceUrl || fallback?.imageSourceUrl || seed?.imageSourceUrl,
    imageScale: player.imageScale ?? fallback?.imageScale ?? seed?.imageScale ?? 1,
    imagePositionY: player.imagePositionY ?? fallback?.imagePositionY ?? seed?.imagePositionY ?? 0,
    nationality: player.nationality ?? 'Italia',
  };
}

function normalizeNews(article: NewsArticle): NewsArticle {
  return { ...article, body: article.body ?? article.summary, imageUrl: article.imageUrl ?? '', featured: false };
}

function normalizeMedia(item: MediaItem): MediaItem {
  return { ...item, description: item.description ?? '', thumbnailUrl: item.thumbnailUrl ?? '', source: item.source ?? 'Redazione' };
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
  };
}

export function normalizeContent(content: AppContent): AppContent {
  const master = preseasonStandings.map(normalizeStandingRow);
  const emptyMaster = emptyStandingRows(master);
  return {
    fixtures: Array.isArray(content.fixtures) ? content.fixtures.map(normalizeFixture) : seedContent.fixtures.map(normalizeFixture),
    standings: sortStandingRows(completeStandingRows(content.standings, master)),
    homeStandings: sortStandingRows(completeStandingRows(content.homeStandings, emptyMaster)),
    awayStandings: sortStandingRows(completeStandingRows(content.awayStandings, emptyMaster)),
    formStandings: sortStandingRows(completeStandingRows(content.formStandings, emptyMaster)),
    schedule: Array.isArray(content.schedule) ? content.schedule.map(normalizeSchedule) : seedContent.schedule?.map(normalizeSchedule),
    players: Array.isArray(content.players) ? content.players.map(normalizePlayer) : seedContent.players.map(normalizePlayer),
    news: Array.isArray(content.news) ? content.news.map(normalizeNews) : seedContent.news,
    media: Array.isArray(content.media) ? content.media.map(normalizeMedia) : seedContent.media,
    updatedAt: content.updatedAt || seedContent.updatedAt,
  };
}

export async function loadContent(): Promise<AppContent> {
  try {
    const current = await AsyncStorage.getItem(STORAGE_KEY);
    if (current) return normalizeContent(JSON.parse(current) as AppContent);
    for (const key of LEGACY_KEYS) {
      const legacy = await AsyncStorage.getItem(key);
      if (legacy) {
        const previous = JSON.parse(legacy) as AppContent;
        const source = /contenuti demo online/i.test(previous.updatedAt ?? '') ? seedContent : previous;
        const migrated = normalizeContent(source);
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
