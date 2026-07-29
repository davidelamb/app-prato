import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { registerPushSubscription } from './content-api';

const DEVICE_ID_KEY = '@app-prato/push-device-id-v1';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function createDeviceId(): string {
  return `device-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

async function loadDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const next = createDeviceId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, next);
  return next;
}

export async function registerForPushNotifications(): Promise<boolean> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return false;
  if (Constants.executionEnvironment === 'storeClient') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('app-prato', {
      name: 'APPrato',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: '#FFC400',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const permission = current.status === 'granted'
    ? current
    : await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return false;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return false;

  const [{ data: token }, deviceId] = await Promise.all([
    Notifications.getExpoPushTokenAsync({ projectId }),
    loadDeviceId(),
  ]);
  await registerPushSubscription({ token, platform: Platform.OS, deviceId });
  return true;
}

export function observeNotificationTabs(onTab: (tab: 'news' | 'live') => void): () => void {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return () => undefined;
  const open = (data: Record<string, unknown> | undefined) => {
    if (data?.tab === 'news' || data?.tab === 'live') onTab(data.tab);
  };
  const previous = Notifications.getLastNotificationResponse();
  if (previous) open(previous.notification.request.content.data);
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    open(response.notification.request.content.data);
  });
  return () => subscription.remove();
}
