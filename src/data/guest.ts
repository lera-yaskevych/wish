import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { newId } from '@/lib/ids';

// Someone without an account who opened a shared list. This device keeps a random key,
// which is how the backend knows a guest's reservations are theirs (so they can undo
// them), and the nickname they last reserved under, so they need not type it again.

const STORAGE_KEY = 'wishlist.guest';

export type Guest = { key: string; nickname: string };

const read = async (): Promise<Guest> => {
  try {
    const saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) ?? '{}') as Partial<Guest>;
    if (typeof saved.key === 'string' && saved.key.length >= 20) {
      return { key: saved.key, nickname: typeof saved.nickname === 'string' ? saved.nickname : '' };
    }
  } catch {
    // Unreadable: start over with a fresh key.
  }
  const fresh = { key: newId(), nickname: '' };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)).catch(() => {});
  return fresh;
};

// Null until the saved guest has been read.
export const useGuest = () => {
  const [guest, setGuest] = useState<Guest | null>(null);

  useEffect(() => {
    read().then(setGuest);
  }, []);

  const rememberNickname = (nickname: string) => {
    if (!guest) return;
    const next = { ...guest, nickname };
    setGuest(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  return { guest, rememberNickname };
};
