import AsyncStorage from '@react-native-async-storage/async-storage';

import { seedContent } from '../data/seed';
import { AppContent, Fixture, NewsArticle, Player } from '../types';

const STORAGE_KEY = '@ac-prato/content-v4';
const LEGACY_KEYS = ['@ac-prato/content-v3', '@ac-prato/content-v2'];

function normalizeFixture(fixture: Fixture): Fixture {
  return { ...fixture, livePhase: fixture.livePhase ?? (fixture.status === 'live' ? 'first_half' : fixture.status === 'final' ? 'finished' : 'scheduled'), liveEvents: fixture.liveEvents ?? [] };
}

function normalizePlayer(player: Player): Player {
  return { ...player, appearances: player.appearances ?? 0, goals: player.goals ?? 0, assists: player.assists ?? 0, imageUrl: player.imageUrl ?? '', nationality: player.nationality ?? 'Italia' };
}

function normalizeNews(article: NewsArticle): NewsArticle {
  return { ...article, body: article.body ?? article.summary, imageUrl: article.imageUrl ?? '' };
}

export function normalizeContent(content: AppContent): AppContent {
  return {
    fixtures: Array.isArray(content.fixtures) ? content.fixtures.map(normalizeFixture) : seedContent.fixtures,
    standings: Array.isArray(content.standings) ? content.standings : seedContent.standings,
    players: Array.isArray(content.players) ? content.players.map(normalizePlayer) : seedContent.players,
    news: Array.isArray(content.news) ? content.news.map(normalizeNews) : seedContent.news,
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
        const migrated = normalizeContent({ ...parsed, players: seedContent.players });
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
