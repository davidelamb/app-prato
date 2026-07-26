import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { AppContent } from '../types';

const PRODUCTION_ORIGIN = 'https://app-prato.david3-a.workers.dev';
const ADMIN_TOKEN_KEY = '@app-prato/admin-token-v1';

function apiOrigin(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') return origin;
  }
  return PRODUCTION_ORIGIN;
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${apiOrigin()}${path}`, init);
}

export async function loadAdminToken(): Promise<string | null> {
  return Platform.OS === 'web'
    ? AsyncStorage.getItem(ADMIN_TOKEN_KEY)
    : SecureStore.getItemAsync(ADMIN_TOKEN_KEY);
}

export async function storeAdminToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(ADMIN_TOKEN_KEY, token.trim());
    return;
  }
  await SecureStore.setItemAsync(ADMIN_TOKEN_KEY, token.trim());
}

export async function clearAdminToken(): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(ADMIN_TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(ADMIN_TOKEN_KEY);
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  if (!token.trim()) return false;
  try {
    const response = await apiFetch('/api/admin/check', {
      headers: { Authorization: `Bearer ${token.trim()}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function loadRemoteContent(): Promise<AppContent | null> {
  const response = await apiFetch('/api/content', {
    headers: { Accept: 'application/json' },
  });
  if (response.status === 204 || response.status === 404) return null;
  if (!response.ok) throw new Error(`Caricamento remoto non riuscito (${response.status}).`);
  return response.json() as Promise<AppContent>;
}

async function uploadDataImage(dataUrl: string, prefix: string, token: string): Promise<string> {
  const response = await apiFetch('/api/images', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dataUrl, prefix }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Caricamento immagine non riuscito (${response.status}): ${detail}`);
  }
  const result = await response.json() as { url: string };
  return result.url;
}

async function persistentImageUrl(value: string | undefined, prefix: string, token: string): Promise<string | undefined> {
  if (!value?.startsWith('data:image/')) return value;
  return uploadDataImage(value, prefix, token);
}

export async function materializeContentImages(content: AppContent, token: string): Promise<AppContent> {
  const players = await Promise.all(content.players.map(async (player) => ({
    ...player,
    imageUrl: await persistentImageUrl(player.imageUrl, `players/${player.id}`, token),
  })));
  const news = await Promise.all(content.news.map(async (article) => ({
    ...article,
    imageUrl: await persistentImageUrl(article.imageUrl, `news/${article.id}`, token),
  })));
  const media = await Promise.all(content.media.map(async (item) => ({
    ...item,
    thumbnailUrl: await persistentImageUrl(item.thumbnailUrl, `media/${item.id}`, token) ?? '',
  })));
  return { ...content, players, news, media };
}

export async function saveRemoteContent(content: AppContent, token: string): Promise<AppContent> {
  const response = await apiFetch('/api/content', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(content),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Salvataggio remoto non riuscito (${response.status}): ${detail}`);
  }
  return response.json() as Promise<AppContent>;
}
