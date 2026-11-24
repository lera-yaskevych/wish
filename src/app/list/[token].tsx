import { Link, router, useLocalSearchParams } from 'expo-router';
import { ArrowUpRight, Bookmark, Check, Link as LinkIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authStyles } from '@/components/AuthScreen';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Field } from '@/components/Field';
import { LanguageLinks } from '@/components/LanguageLinks';
import { Sheet } from '@/components/Sheet';
import { WishCard } from '@/components/WishCard';
import { WishImage } from '@/components/WishImage';
import type { Wish } from '@/data';
import { useAuth } from '@/data/auth';
import { useGuest } from '@/data/guest';
import { useReserveAsGuest, useSharedList, useUnreserveAsGuest } from '@/data/hooks';
import { NICKNAME_MAX_LENGTH } from '@/data/validate';
import { errorText, useT } from '@/i18n';
import { isNoteOnly } from '@/lib/format';
import { domainOf } from '@/lib/links';
import { colors, fonts, type } from '@/theme';

type Step = 'details' | 'nickname';

// Someone's list, opened from the link they or a friend shared. Anyone with the link can
// look and reserve under a nickname, no account needed. Members are sent on to the
// app's own screens, where they reserve under their name.
const SharedListScreen = () => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const t = useT();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { user } = useAuth();
  const { guest, rememberNickname } = useGuest();
  const { data: list, isPending } = useSharedList(token, user ? null : guest?.key);
  const reserve = useReserveAsGuest();
  const unreserve = useUnreserveAsGuest();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('details');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !list) return;
    if (list.owner.id === user.id) router.replace('/');
    else router.replace({ pathname: '/friends/[userId]', params: { userId: list.owner.id } });
  }, [user, list]);

  if (!list || user) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        {!isPending && !list && <EmptyState title={t.shared.missingTitle} body={t.shared.missingBody} />}
      </View>
    );
  }

  const owner = list.owner;
  // Looked up afresh so the sheet follows the list as reservations change.
  const selected = list.wishes.find((wish) => wish.id === selectedId) ?? null;

  const open = (wish: Wish, first: Step) => {
    setSelectedId(wish.id);
    setStep(first);
    setNickname(guest?.nickname ?? '');
    setError(null);
    setSheetOpen(true);
  };

  const confirm = async () => {
    if (!selected || !guest) return;
    setError(null);
    try {
      await reserve.mutateAsync({ token, wishId: selected.id, guestKey: guest.key, nickname });
      rememberNickname(nickname.trim());
      setSheetOpen(false);
    } catch (caught) {
      setError(errorText(t, caught));
    }
  };

  const undo = (wishId: string) => {
    if (guest) unreserve.mutate({ wishId, guestKey: guest.key });
  };

  const details = selected && (
    <>
      <ScrollView style={{ maxHeight: height * 0.5 }} showsVerticalScrollIndicator={false} bounces={false}>
        {selected.imageUri && (
          <WishImage uri={selected.imageUri} seed={selected.id} iconSize={30} style={styles.sheetImage} />
        )}
        <Text style={isNoteOnly(selected) ? styles.noteTitle : styles.sheetTitle}>
          {isNoteOnly(selected) ? t.quote(selected.title) : selected.title}
        </Text>
        {selected.price && <Text style={styles.price}>{selected.price}</Text>}
        {selected.note && <Text style={[type.body, styles.sheetBody]}>{selected.note}</Text>}
        {selected.url && (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={t.wish.open(domainOf(selected.url))}
            onPress={() => Linking.openURL(selected.url!).catch(() => {})}
            style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
            <LinkIcon size={18} color={colors.ink} strokeWidth={2} />
            <Text style={styles.linkLabel} numberOfLines={1}>
              {domainOf(selected.url)}
            </Text>
            <ArrowUpRight size={18} color={colors.ink} strokeWidth={2} />
          </Pressable>
        )}
      </ScrollView>
      <View style={styles.sheetActions}>
        {selected.reservation === 'mine' ? (
          <>
            <View style={styles.reservedByYou}>
              <Check size={17} color={colors.green} strokeWidth={2.4} />
              <Text style={styles.reservedByYouLabel}>{t.card.reservedByYou}</Text>
            </View>
            <Button
              label={t.card.undoReservation}
              variant="outline"
              loading={unreserve.isPending}
              onPress={() => undo(selected.id)}
            />
            <Text style={[type.small, styles.footnote]}>{t.wish.secretNoteShort(owner.name)}</Text>
          </>
        ) : selected.reservation === 'taken' ? (
          <>
            <Button label={t.wish.alreadyReserved} variant="outline" disabled />
            <Text style={[type.small, styles.footnote]}>{t.wish.takenNote}</Text>
          </>
        ) : (
          <Button label={t.wish.reserveGift} variant="accent" icon={Bookmark} onPress={() => setStep('nickname')} />
        )}
      </View>
    </>
  );

  const askNickname = selected && (
    <>
      <Text style={styles.sheetTitle}>{t.shared.nicknameTitle}</Text>
      <Text style={[type.body, styles.sheetBody]}>{t.shared.nicknameBody(owner.name)}</Text>
      <Field
        label={t.shared.nickname}
        placeholder={t.shared.nicknamePlaceholder}
        value={nickname}
        onChangeText={setNickname}
        maxLength={NICKNAME_MAX_LENGTH}
        autoFocus
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="go"
        onSubmitEditing={confirm}
        containerStyle={styles.nickname}
      />
      {error && <Text style={authStyles.error}>{error}</Text>}
      <View style={styles.sheetActions}>
        <Button
          label={t.wish.reserveGift}
          variant="accent"
          icon={Bookmark}
          loading={reserve.isPending}
          onPress={confirm}
        />
        <Text style={[type.small, styles.footnote]}>{t.shared.undoHint}</Text>
      </View>
    </>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={list.wishes}
        keyExtractor={(wish) => wish.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 32 }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.top}>
              <Text style={styles.logo}>wish.</Text>
              <LanguageLinks />
            </View>
            <View style={styles.person}>
              <Avatar id={owner.id} name={owner.name} size={56} />
              <View style={styles.personText}>
                <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  {t.friends.listOf(owner.name)}
                </Text>
                <Text style={type.sub}>{t.wishCount(list.wishes.length)}</Text>
              </View>
            </View>
            {list.wishes.length > 0 && <Text style={[type.sub, styles.intro]}>{t.shared.intro(owner.name)}</Text>}
          </View>
        }
        ListEmptyComponent={
          <EmptyState title={t.friends.noWishesTitle} body={t.friends.noWishesBody(owner.name)} />
        }
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        renderItem={({ item }) => (
          <WishCard
            wish={item}
            onPress={() => open(item, 'details')}
            onReserve={() => open(item, 'nickname')}
            onUnreserve={() => undo(item.id)}
          />
        )}
        ListFooterComponent={
          <Text style={[authStyles.footerText, styles.footer]}>
            {t.auth.haveAccount}{' '}
            <Link href="/log-in" style={authStyles.footerLink}>
              {t.auth.logIn}
            </Link>
          </Text>
        }
      />

      <Sheet visible={sheetOpen && !!selected} onClose={() => setSheetOpen(false)}>
        {step === 'nickname' ? askNickname : details}
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setSheetOpen(false)} style={styles.cancel}>
          <Text style={styles.cancelLabel}>{step === 'nickname' ? t.common.cancel : t.common.close}</Text>
        </Pressable>
      </Sheet>
    </View>
  );
};

export default SharedListScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: 20 },
  header: { paddingHorizontal: 4, paddingBottom: 24 },
  top: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 26 },
  logo: { ...fonts.serif, fontSize: 22, color: colors.accent },
  person: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  personText: { flex: 1, gap: 1 },
  name: { ...fonts.serif, fontSize: 32, lineHeight: 36, letterSpacing: -0.3, color: colors.ink },
  intro: { marginTop: 16, lineHeight: 21 },
  gap: { height: 12 },
  footer: { textAlign: 'center', marginTop: 36 },
  sheetImage: { height: 180, borderRadius: 18, marginBottom: 18 },
  sheetTitle: { ...fonts.serif, fontSize: 30, lineHeight: 34, color: colors.ink },
  noteTitle: { ...fonts.serifItalic, fontSize: 28, lineHeight: 34, color: colors.ink },
  price: { ...fonts.bold, fontSize: 19, color: colors.ink, marginTop: 6 },
  sheetBody: { marginTop: 10 },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 52,
    paddingHorizontal: 18,
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  linkLabel: { flex: 1, ...fonts.medium, fontSize: 16, color: colors.ink },
  pressed: { opacity: 0.7 },
  nickname: { marginTop: 20 },
  sheetActions: { gap: 12, marginTop: 22 },
  reservedByYou: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  reservedByYouLabel: { ...fonts.semibold, fontSize: 16, color: colors.green },
  footnote: { textAlign: 'center', paddingHorizontal: 8, lineHeight: 19 },
  cancel: { alignSelf: 'center', paddingVertical: 14, marginTop: 4 },
  cancelLabel: { ...fonts.sans, fontSize: 16, color: colors.muted },
});
