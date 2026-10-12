import { Stack } from 'expo-router';

import { colors } from '@/theme';

// A friend's list opens inside the Friends tab, so the tab bar stays visible.
const FriendsLayout = () => (
  <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
);

export default FriendsLayout;
