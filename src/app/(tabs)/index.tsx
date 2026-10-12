import { router } from 'expo-router';
import { Archive, Plus } from 'lucide-react-native';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { WishCard } from '@/components/WishCard';
import { useMe } from '@/data/auth';
import { useMyWishes } from '@/data/hooks';
import { useT } from '@/i18n';
import { colors, fonts, type } from '@/theme';

const MyList = () => {
  const insets = useSafeAreaInsets();
  const me = useMe();
  const t = useT();
  const { data: wishes } = useMyWishes();

  const header = (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={t.myList.profile} onPress={() => router.push('/profile')}>
          <Avatar id={me.id} name={me.name} size={44} plain />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.myList.archive}
          hitSlop={12}
          onPress={() => router.push('/archive')}
          style={({ pressed }) => [styles.archive, pressed && styles.pressed]}>
          <Archive size={18} color={colors.muted} strokeWidth={2} />
          <Text style={styles.archiveLabel}>{t.myList.archive}</Text>
        </Pressable>
      </View>
      <Text style={type.display}>{t.myList.title}</Text>
      {wishes && <Text style={[type.sub, styles.count]}>{t.wishCount(wishes.length)}</Text>}
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={wishes ?? []}
        keyExtractor={(wish) => wish.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 10 }]}
        ListHeaderComponent={header}
        ListEmptyComponent={
          wishes ? (
            <EmptyState title={t.myList.emptyTitle} body={t.myList.emptyBody}>
              <Button label={t.myList.addWish} variant="accent" size="sm" icon={Plus} onPress={() => router.push('/wish/new')} />
            </EmptyState>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        renderItem={({ item }) => (
          <WishCard
            wish={item}
            onPress={() => router.push({ pathname: '/wish/[id]', params: { id: item.id } })}
          />
        )}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.myList.addWish}
        onPress={() => router.push('/wish/new')}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
        <Plus size={26} color={colors.white} strokeWidth={2} />
      </Pressable>
    </View>
  );
};

export default MyList;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: 20, paddingBottom: 110 },
  header: { paddingHorizontal: 4, paddingBottom: 22 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  archive: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  archiveLabel: { ...fonts.sans, fontSize: 16.5, color: colors.muted },
  pressed: { opacity: 0.6 },
  count: { marginTop: 8, fontSize: 16 },
  gap: { height: 12 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    boxShadow: '0 8px 20px rgba(169, 76, 43, 0.28)',
  },
  fabPressed: { transform: [{ scale: 0.96 }] },
});
