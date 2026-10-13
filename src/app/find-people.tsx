import { router } from 'expo-router';
import { Check, Search } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { BackLink } from '@/components/BackLink';
import { Button } from '@/components/Button';
import { useMe } from '@/data/auth';
import { useFollow, useInviteCode, usePeopleSearch, useUnfollow } from '@/data/hooks';
import { useT } from '@/i18n';
import { shareText } from '@/lib/share';
import { colors, fonts, type } from '@/theme';

const FindPeople = () => {
  const insets = useSafeAreaInsets();
  const me = useMe();
  const t = useT();
  const [query, setQuery] = useState('');
  const searching = query.trim().length > 0;
  const { data: results } = usePeopleSearch(query);
  const follow = useFollow();
  const unfollow = useUnfollow();

  // Search sits on top of the tabs. Closing it first opens the list inside the Friends
  // tab, where it belongs, instead of stacking a second copy of the tabs over this screen.
  const openList = (userId: string) => {
    if (router.canDismiss()) router.dismiss();
    router.push({ pathname: '/friends/[userId]', params: { userId } });
  };

  const { data: inviteCode } = useInviteCode();
  const [copied, setCopied] = useState(false);

  // On the web the app's own address makes a link that opens sign-up with the invite code filled in.
  const share = async () => {
    const link =
      Platform.OS === 'web' && inviteCode
        ? `${window.location.origin}/sign-up?invite=${encodeURIComponent(inviteCode)}`
        : null;
    if ((await shareText(t.find.shareMessage(me.username, link))) === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={searching ? (results ?? []) : []}
        keyExtractor={(person) => person.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 10 }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <BackLink label={t.friends.title} to="/friends" />
            <Text style={[type.display, styles.title]}>{t.find.title}</Text>
            <View style={[styles.search, searching && styles.searchActive]}>
              <Search size={19} color={colors.muted} strokeWidth={2} />
              <TextInput
                accessibilityLabel={t.find.placeholder}
                placeholder={t.find.placeholder}
                placeholderTextColor={colors.faint}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                returnKeyType="search"
                style={styles.searchInput}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          searching && results ? <Text style={[type.sub, styles.noResults]}>{t.find.none}</Text> : null
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.name}
              onPress={() => openList(item.id)}
              style={styles.person}>
              <Avatar id={item.id} name={item.name} size={48} />
              <View style={styles.text}>
                <Text style={type.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={type.sub} numberOfLines={1}>
                  @{item.username}
                </Text>
              </View>
            </Pressable>
            {item.isFollowing ? (
              <Button
                label={t.friends.following}
                variant="outline"
                size="sm"
                icon={Check}
                onPress={() => unfollow.mutate(item.id)}
                style={styles.following}
              />
            ) : (
              <Button label={t.friends.follow} variant="accent" size="sm" onPress={() => follow.mutate(item.id)} />
            )}
          </View>
        )}
      />

      <View style={[styles.invite, { marginBottom: insets.bottom + 16 }]}>
        <View style={styles.text}>
          <Text style={type.cardTitle}>{t.find.inviteTitle}</Text>
          <Text style={type.sub}>{t.find.inviteBody}</Text>
        </View>
        <Button label={copied ? t.find.copied : t.find.share} size="sm" onPress={share} style={styles.share} />
      </View>
    </KeyboardAvoidingView>
  );
};

export default FindPeople;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: 24, paddingBottom: 24 },
  header: { paddingBottom: 14 },
  title: { marginTop: 10 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    marginTop: 22,
  },
  searchActive: { borderColor: colors.ink },
  searchInput: {
    flex: 1,
    height: '100%',
    ...fonts.sans,
    fontSize: 17,
    color: colors.ink,
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
  noResults: { paddingTop: 20, fontSize: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  person: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  text: { flex: 1, gap: 2 },
  following: { borderColor: colors.line },
  invite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 24,
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.panel,
  },
  share: { height: 44, borderRadius: 22 },
});
