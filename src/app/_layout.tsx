import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';
import {
  CormorantGaramond_500Medium,
  CormorantGaramond_500Medium_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { loadAsync, useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { AuthProvider, useAuth } from '@/data/auth';
import { LanguageProvider, useLanguage } from '@/i18n';
import { syncPush } from '@/lib/push';
import { colors } from '@/theme';

const RootNavigator = () => {
  const { user, ready } = useAuth();
  const { ready: languageReady, language } = useLanguage();
  const userId = user?.id;
  const [fontsLoaded] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
  });

  // Draws Ukrainian headings; fetched in the background so English never waits for it.
  useEffect(() => {
    loadAsync({ CormorantGaramond_500Medium, CormorantGaramond_500Medium_Italic }).catch(() => {});
  }, []);

  // Notifications follow whoever is signed in on this device, in the language they chose.
  useEffect(() => {
    if (userId && languageReady) syncPush(language).catch(() => {});
  }, [userId, language, languageReady]);

  if (!ready || !languageReady || !fontsLoaded) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="archive" />
        <Stack.Screen name="find-people" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="wish/[id]/index" />
        <Stack.Screen name="wish/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="wish/[id]/edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
  );
};

const RootLayout = () => {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default RootLayout;
