import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { ApiError } from '@/data/types';

import { en, type Dictionary } from './en';
import { tr } from './tr';
import { uk } from './uk';

export type Language = 'en' | 'uk' | 'tr';

export const languages: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'uk', label: 'Українська' },
  { code: 'tr', label: 'Türkçe' },
];

const dictionaries: Record<Language, Dictionary> = { en, uk, tr };

const isLanguage = (code: unknown): code is Language => languages.some((language) => language.code === code);

const STORAGE_KEY = 'wishlist.language';

// Follows the phone's language until the person picks one in their profile.
const deviceLanguage = (): Language => {
  const code = getLocales()[0]?.languageCode;
  return isLanguage(code) ? code : 'en';
};

type LanguageValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Dictionary;
  // False until a saved choice has been read, so the first screen never flips language.
  ready: boolean;
};

const LanguageContext = createContext<LanguageValue | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(deviceLanguage);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (isLanguage(saved)) setLanguageState(saved);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageValue>(
    () => ({
      language,
      ready,
      t: dictionaries[language],
      setLanguage: (next) => {
        setLanguageState(next);
        AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      },
    }),
    [language, ready],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
};

export const useT = () => useLanguage().t;

// Turns anything a screen catches into a sentence in the current language.
export const errorText = (t: Dictionary, caught: unknown) =>
  caught instanceof ApiError ? t.errors[caught.code] : t.errors.unknown;

export type { Dictionary };
