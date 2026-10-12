import { Stack } from 'expo-router';

import { colors } from '@/theme';

const AuthLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="log-in" />
    </Stack>
  );
};

export default AuthLayout;
