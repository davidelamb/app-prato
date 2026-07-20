import AsyncStorage from '@react-native-async-storage/async-storage';

import { seedContent } from '../data/seed';
import { AppContent, Fixture, NewsArticle, Player } from '../types';

const STORAGE_KEY = '@ac-prato/content-v3';
const LEGACY_STORAGE_KEY = '@ac-prato/content-v2';

function normalizeFixture(fixture: Fixture): Fixture {
  return {
    ...fixture,
    livePhase: fixture.livePhase ?? (fixture.status === 'live' ? 'first_half' : fixture.status === 'final' ? 'finished' : 'scheduled'),
    liveEvents: fixture.liveEvents ?? [],
  };
}

function normalizePlayer(player: Player): Player {
  return { ...player, imageUrl: player.imageUrl ?? '' };
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
    const stored = (await AsyncStorage.getItem(STORAGE_KEY)) ?? (await AsyncStorage.getItem(LEGACY_STORAGE_KEY));
    return stored ? normalizeContent(JSON.parse(stored) as AppContent) : normalizeContent(seedContent);
  } catch (error) {
    console.warn('Impossibile caricare i contenuti salvati', error);
    return normalizeContent(seedContent);
  }
}

export async function saveContent(content: AppContent): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeContent(content)));
}

export async function resetContent(): Promise<AppContent> {
  await Promise.all([AsyncStorage.removeItem(STORAGE_KEY), AsyncStorage.removeItem(LEGACY_STORAGE_KEY)]);
  return normalizeContent(seedContent);
}
