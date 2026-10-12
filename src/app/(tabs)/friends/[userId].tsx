import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { BackLink } from '@/components/BackLink';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { WishCard } from '@/components/WishCard';
import { useFollow, useProfile, useReserve, useUnfollow, useUnreserve, useWishesOf } from '@/data/hooks';
import { useT } from '@/i18n';
import { colors, fonts, type } from '@/theme';

const FriendList = () => {
  const insets = useSafeAreaInsets();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const t = useT();
  const { data: profile } = useProfile(userId);
  const { data: wishes } = useWishesOf(userId);
  const follow = useFollow();
  const unfollow = useUnfollow();
  const reserve = useReserve();
  const unreserve = useUnreserve();

  return (
    <FlatList
      style={styles.screen}
      data={wishes ?? []}
      keyExtractor={(wish) => wish.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.list, { paddingTop: insets.top + 10 }]}
      ListHeaderComponent={
        <View style={styles.header}>
          <BackLink label={t.friends.title} fallback="/friends" />
          {profile && (
            <View style={styles.person}>
              <Avatar id={profile.id} name={profile.name} size={56} />
              <View style={styles.personText}>
                <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  {t.friends.listOf(profile.name)}
                </Text>
                <Text style={type.sub} numberOfLines={1}>
                  {t.friends.subtitle(profile)}
                </Text>
              </View>
              {profile.isFollowing ? (
                <Button
                  label={t.friends.following}
                  variant="outline"
                  size="xs"
                  onPress={() => unfollow.mutate(profile.id)}
                  style={styles.following}
                />
              ) : (
                <Button label={t.friends.follow} variant="accent" size="xs" onPress={() => follow.mutate(profile.id)} />
              )}
            </View>
          )}
        </View>
      }
      ListEmptyComponent={
        wishes && profile ? (
          <EmptyState
            title={t.friends.noWishesTitle}
            body={t.friends.noWishesBody(profile.name)}
          />
        ) : null
      }
      ItemSeparatorComponent={() => <View style={styles.gap} />}
      renderItem={({ item }) => (
        <WishCard
          wish={item}
          onPress={() => router.push({ pathname: '/wish/[id]', params: { id: item.id } })}
          onReserve={() => reserve.mutate(item.id)}
          onUnreserve={() => unreserve.mutate(item.id)}
        />
      )}
    />
  );
};

export default FriendList;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { paddingHorizontal: 4, paddingBottom: 26 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 6 },
  personText: { flex: 1, gap: 1 },
  name: { ...fonts.serif, fontSize: 32, lineHeight: 36, letterSpacing: -0.3, color: colors.ink },
  following: { borderColor: colors.line },
  gap: { height: 12 },
});
