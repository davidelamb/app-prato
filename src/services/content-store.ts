import AsyncStorage from '@react-native-async-storage/async-storage';

import { seedContent } from '../data/seed';
import { AppContent } from '../types';

const STORAGE_KEY = '@ac-prato/content-v2';

export async function loadContent(): Promise<AppContent> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AppContent) : seedContent;
  } catch {
    return seedContent;
  }
}

export async function saveContent(content: AppContent): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(content));
}

export async function resetContent(): Promise<AppContent> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  return seedContent;
}
