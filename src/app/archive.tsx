import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackLink } from '@/components/BackLink';
import { EmptyState } from '@/components/EmptyState';
import { WishImage } from '@/components/WishImage';
import type { Wish } from '@/data';
import { useArchive, useRestoreWish } from '@/data/hooks';
import { useT } from '@/i18n';
import { isNoteOnly } from '@/lib/format';
import { colors, fonts, tintFor, type } from '@/theme';

const Thumb = ({ wish }: { wish: Wish }) => {
  const t = useT();
  if (wish.imageUri) return <WishImage uri={wish.imageUri} seed={wish.id} iconSize={0} style={styles.thumb} />;
  return (
    <View style={[styles.thumb, { backgroundColor: tintFor(wish.id).bg }]}>
      {isNoteOnly(wish) && <Text style={styles.quoteMark}>{t.quote('').charAt(0)}</Text>}
    </View>
  );
};

const ArchiveScreen = () => {
  const insets = useSafeAreaInsets();
  const { data: wishes } = useArchive();
  const t = useT();
  const restore = useRestoreWish();

  return (
    <FlatList
      style={styles.screen}
      data={wishes ?? []}
      keyExtractor={(wish) => wish.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.list, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 32 }]}
      ListHeaderComponent={
        <View style={styles.header}>
          <BackLink label={t.tabs.myList} />
          <Text style={[type.display, styles.title]}>{t.archive.title}</Text>
          <Text style={[type.sub, styles.subtitle]}>{t.archive.subtitle}</Text>
        </View>
      }
      ListEmptyComponent={
        wishes ? (
          <EmptyState title={t.archive.emptyTitle} body={t.archive.emptyBody} />
        ) : null
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.title}
            onPress={() => router.push({ pathname: '/wish/[id]', params: { id: item.id } })}
            style={({ pressed }) => [styles.body, pressed && styles.pressed]}>
            <Thumb wish={item} />
            <View style={styles.text}>
              <Text style={type.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.fulfilled}>
                <Check size={15} color={colors.green} strokeWidth={2.2} />
                <Text style={styles.fulfilledLabel}>{t.wish.fulfilledOn(item.fulfilledAt!)}</Text>
              </View>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.archive.restoreItem(item.title)}
            hitSlop={12}
            onPress={() => restore.mutate(item.id)}>
            <Text style={styles.restore}>{t.archive.restore}</Text>
          </Pressable>
        </View>
      )}
    />
  );
};

export default ArchiveScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: 24 },
  header: { paddingBottom: 20 },
  title: { marginTop: 10 },
  subtitle: { marginTop: 8, fontSize: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  pressed: { opacity: 0.6 },
  thumb: { width: 52, height: 52, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  quoteMark: { ...fonts.serif, fontSize: 30, lineHeight: 38, color: colors.faint },
  text: { flex: 1, gap: 2 },
  fulfilled: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fulfilledLabel: { ...fonts.sans, fontSize: 14.5, color: colors.green },
  restore: { ...fonts.sans, fontSize: 15.5, color: colors.muted },
});
