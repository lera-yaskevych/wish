import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { WishCard } from '@/components/WishCard';
import type { User, Wish } from '@/data';
import { useMyReservations, useUnreserve } from '@/data/hooks';
import { useT } from '@/i18n';
import { colors, type } from '@/theme';

type Group = { owner: User; wishes: Wish[] };

// Everything the signed-in person has promised to give, gathered by who it is for.
const Reserved = () => {
  const insets = useSafeAreaInsets();
  const t = useT();
  const { data: reservations } = useMyReservations();
  const unreserve = useUnreserve();

  const groups = useMemo(() => {
    const byOwner = new Map<string, Group>();
    for (const { wish, owner } of reservations ?? []) {
      const group = byOwner.get(owner.id) ?? { owner, wishes: [] };
      group.wishes.push(wish);
      byOwner.set(owner.id, group);
    }
    return [...byOwner.values()].sort((a, b) => a.owner.name.localeCompare(b.owner.name));
  }, [reservations]);

  return (
    <FlatList
      style={styles.screen}
      data={groups}
      keyExtractor={(group) => group.owner.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.list, { paddingTop: insets.top + 10 }]}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={type.display}>{t.reserved.title}</Text>
          {reservations && reservations.length > 0 && (
            <Text style={[type.sub, styles.count]}>{t.reserved.count(reservations.length, groups.length)}</Text>
          )}
        </View>
      }
      ListEmptyComponent={
        reservations ? <EmptyState title={t.reserved.emptyTitle} body={t.reserved.emptyBody} /> : null
      }
      ItemSeparatorComponent={() => <View style={styles.groupGap} />}
      renderItem={({ item: { owner, wishes } }) => (
        <View style={styles.group}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={owner.name}
            onPress={() => router.push({ pathname: '/friends/[userId]', params: { userId: owner.id } })}
            style={({ pressed }) => [styles.person, pressed && styles.pressed]}>
            <Avatar id={owner.id} name={owner.name} size={36} />
            <View style={styles.personText}>
              <Text style={type.cardTitle} numberOfLines={1}>
                {owner.name}
              </Text>
              {owner.birthday && <Text style={type.small}>{t.friends.birthday(owner.birthday)}</Text>}
            </View>
            <ChevronRight size={18} color={colors.faint} strokeWidth={2} />
          </Pressable>
          {wishes.map((wish) => (
            <WishCard
              key={wish.id}
              wish={wish}
              onPress={() => router.push({ pathname: '/wish/[id]', params: { id: wish.id } })}
              onUnreserve={() => unreserve.mutate(wish.id)}
            />
          ))}
        </View>
      )}
    />
  );
};

export default Reserved;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  // The other tabs have a row of controls above their title; the same space keeps titles level.
  header: { paddingHorizontal: 4, paddingTop: 66, paddingBottom: 22 },
  count: { marginTop: 8, fontSize: 16 },
  group: { gap: 12 },
  groupGap: { height: 28 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  personText: { flex: 1, gap: 1 },
  pressed: { opacity: 0.6 },
});
