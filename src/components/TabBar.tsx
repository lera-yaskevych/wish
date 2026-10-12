import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Gift, Users, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { colors, fonts } from '@/theme';

const tabs: Record<string, { key: 'myList' | 'friends'; icon: LucideIcon }> = {
  index: { key: 'myList', icon: Gift },
  friends: { key: 'friends', icon: Users },
};

export const TabBar = ({ state, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const t = useT();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const tab = tabs[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const Icon = tab.icon;
        const color = focused ? colors.ink : colors.muted;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={t.tabs[tab.key]}
            accessibilityState={{ selected: focused }}
            style={styles.tab}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            }}>
            <Icon size={24} color={color} strokeWidth={focused ? 2 : 1.75} />
            <Text style={[styles.label, { color }, focused ? fonts.semibold : fonts.sans]}>
              {t.tabs[tab.key]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 56,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.bg,
  },
  tab: { alignItems: 'center', gap: 5, minWidth: 92 },
  label: { fontSize: 12.5 },
});
