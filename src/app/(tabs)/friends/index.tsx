import { router } from 'expo-router';
import { ChevronRight, UserPlus } from 'lucide-react-native';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { useFollowing } from '@/data/hooks';
import { useT } from '@/i18n';
import { colors, type } from '@/theme';

const Friends = () => {
  const insets = useSafeAreaInsets();
  const { data: people } = useFollowing();
  const t = useT();
  const findPeople = () => router.push('/find-people');

  return (
    <FlatList
      style={styles.screen}
      data={people ?? []}
      keyExtractor={(person) => person.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.list, { paddingTop: insets.top + 10 }]}
      ListHeaderComponent={
        <View style={styles.header}>
          <Button label={t.friends.findPeople} size="sm" icon={UserPlus} onPress={findPeople} style={styles.find} />
          <Text style={type.display}>{t.friends.title}</Text>
          {people && <Text style={[type.sub, styles.count]}>{t.friends.followingCount(people.length)}</Text>}
        </View>
      }
      ListEmptyComponent={
        people ? (
          <EmptyState title={t.friends.emptyTitle} body={t.friends.emptyBody}>
            <Button label={t.friends.findPeople} variant="accent" size="sm" icon={UserPlus} onPress={findPeople} />
          </EmptyState>
        ) : null
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={item.name}
          onPress={() => router.push({ pathname: '/friends/[userId]', params: { userId: item.id } })}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <Avatar id={item.id} name={item.name} size={52} />
          <View style={styles.text}>
            <Text style={type.cardTitle} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={type.sub} numberOfLines={1}>
              {t.friends.subtitle(item)}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.faint} strokeWidth={2} />
        </Pressable>
      )}
    />
  );
};

export default Friends;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: 24, paddingBottom: 40 },
  header: { paddingBottom: 18 },
  find: { alignSelf: 'flex-end', height: 44, borderRadius: 22, marginBottom: 22 },
  count: { marginTop: 8, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 80, paddingHorizontal: 4 },
  pressed: { opacity: 0.6 },
  text: { flex: 1, gap: 2 },
});
