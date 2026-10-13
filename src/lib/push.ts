import { Platform } from 'react-native';

import { api } from '@/data';
import type { Language } from '@/i18n';

// Web push: the browser subscribes with the push service, and the subscription is
// saved so the backend can reach this device. Only available on the web build.

const VAPID_PUBLIC_KEY = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;

export type PushState = 'unsupported' | 'needs-install' | 'blocked' | 'off' | 'on';

const isWeb = Platform.OS === 'web';

const canPush = () =>
  isWeb && !!VAPID_PUBLIC_KEY && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

// iPhones only offer notifications to a site that has been added to the Home Screen.
const isIosBrowserTab = () =>
  isWeb && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(navigator as { standalone?: boolean }).standalone;

const register = () => navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready);

const currentSubscription = async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
};

const toBytes = (base64Url: string) => {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')), (char) => char.charCodeAt(0));
};

const save = (subscription: PushSubscription, language: Language) => {
  const { endpoint, keys } = subscription.toJSON();
  if (!endpoint || !keys?.p256dh || !keys.auth) throw new Error('Incomplete push subscription');
  return api.savePushSubscription({ endpoint, p256dh: keys.p256dh, auth: keys.auth, language });
};

export const getPushState = async (): Promise<PushState> => {
  if (!canPush()) return isIosBrowserTab() ? 'needs-install' : 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  return Notification.permission === 'granted' && (await currentSubscription()) ? 'on' : 'off';
};

// Must be called from a tap: browsers only ask for permission in response to one.
export const turnPushOn = async (language: Language): Promise<PushState> => {
  if ((await Notification.requestPermission()) !== 'granted') {
    return Notification.permission === 'denied' ? 'blocked' : 'off';
  }
  const registration = await register();
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toBytes(VAPID_PUBLIC_KEY!),
    }));
  await save(subscription, language);
  return 'on';
};

export const turnPushOff = async (): Promise<PushState> => {
  const subscription = await currentSubscription();
  if (subscription) {
    await api.removePushSubscription(subscription.endpoint).catch(() => {});
    await subscription.unsubscribe();
  }
  return 'off';
};

// Keeps this device's saved subscription pointing at whoever is signed in, in their language.
export const syncPush = async (language: Language) => {
  if (!canPush() || Notification.permission !== 'granted') return;
  const subscription = await currentSubscription();
  if (subscription) await save(subscription, language);
};

// Before signing out, so this device stops hearing about that person's friends.
export const forgetPush = async () => {
  if (!canPush()) return;
  const subscription = await currentSubscription();
  if (subscription) await api.removePushSubscription(subscription.endpoint);
};
