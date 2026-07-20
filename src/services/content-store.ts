import AsyncStorage from '@react-native-async-storage/async-storage';

import { seedContent } from '../data/seed';
import { AppContent, Fixture, MediaItem, NewsArticle, Player, SeasonMatch, Standing } from '../types';

const STORAGE_KEY = '@ac-prato/content-v6';
const LEGACY_KEYS = ['@ac-prato/content-v5', '@ac-prato/content-v4', '@ac-prato/content-v3', '@ac-prato/content-v2'];

function normalizeFixture(fixture: Fixture): Fixture {
  return { ...fixture, livePhase: fixture.livePhase ?? (fixture.status === 'live' ? 'first_half' : fixture.status === 'final' ? 'finished' : 'scheduled'), liveEvents: fixture.liveEvents ?? [] };
}

function normalizePlayer(player: Player): Player {
  return { ...player, appearances: player.appearances ?? 0, goals: player.goals ?? 0, assists: player.assists ?? 0, imageUrl: player.imageUrl ?? '', nationality: player.nationality ?? 'Italia' };
}

function normalizeNews(article: NewsArticle): NewsArticle {
  return { ...article, body: article.body ?? article.summary, imageUrl: article.imageUrl ?? '' };
}

function normalizeMedia(item: MediaItem): MediaItem {
  return { ...item, description: item.description ?? '', thumbnailUrl: item.thumbnailUrl ?? '', source: item.source ?? 'Redazione' };
}

function normalizeStanding(row: Standing, index: number): Standing {
  const goalsFor = Number(row.goalsFor) || 0;
  const goalsAgainst = Number(row.goalsAgainst) || 0;
  return {
    ...row,
    rank: Number(row.rank) || index + 1,
    played: Number(row.played) || 0,
    wins: Number(row.wins) || 0,
    draws: Number(row.draws) || 0,
    losses: Number(row.losses) || 0,
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    points: Number(row.points) || 0,
    form: row.form ?? [],
  };
}

function normalizeSchedule(match: SeasonMatch, index: number): SeasonMatch {
  const matchday = Number(match.matchday) || index + 1;
  return {
    ...match,
    id: match.id || `season-match-${matchday}`,
    matchday,
    leg: match.leg ?? (matchday <= 17 ? 'Andata' : 'Ritorno'),
    dateLabel: match.dateLabel ?? '',
    time: match.time ?? '',
  };
}

export function normalizeContent(content: AppContent): AppContent {
  return {
    fixtures: Array.isArray(content.fixtures) ? content.fixtures.map(normalizeFixture) : seedContent.fixtures,
    standings: Array.isArray(content.standings) ? content.standings.map(normalizeStanding) : seedContent.standings.map(normalizeStanding),
    schedule: Array.isArray(content.schedule) ? content.schedule.map(normalizeSchedule) : undefined,
    players: Array.isArray(content.players) ? content.players.map(normalizePlayer) : seedContent.players,
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
        const parsed = normalizeContent(JSON.parse(legacy) as AppContent);
        const migrated = normalizeContent({ ...parsed, news: seedContent.news, media: seedContent.media });
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
