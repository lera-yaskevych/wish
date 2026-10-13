import { router, type Href } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useT } from '@/i18n';
import { colors, fonts } from '@/theme';

// "‹ Friends" style link. It names a place, so it always goes there: back to that
// screen when it is underneath, and straight to it when this screen was opened
// directly (from a notification, a search result or a reload).
export const BackLink = ({ label, to }: { label: string; to: Href }) => {
  const t = useT();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.common.backTo(label)}
      hitSlop={12}
      onPress={() => router.dismissTo(to)}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
      <ChevronLeft size={20} color={colors.muted} strokeWidth={2} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  link: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginLeft: -4, height: 44 },
  pressed: { opacity: 0.6 },
  label: { ...fonts.sans, fontSize: 16.5, color: colors.muted },
});
