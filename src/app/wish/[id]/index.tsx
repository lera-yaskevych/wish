import { router, useLocalSearchParams, type Href } from 'expo-router';
import { ArrowUpRight, Bookmark, Check, ChevronLeft, Link as LinkIcon, Pencil, RotateCcw } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { WishImage } from '@/components/WishImage';
import { useMe } from '@/data/auth';
import {
  useDeleteWish,
  useFulfillWish,
  useProfile,
  useReserve,
  useRestoreWish,
  useUnreserve,
  useWish,
} from '@/data/hooks';
import { useT } from '@/i18n';
import { isNoteOnly } from '@/lib/format';
import { domainOf } from '@/lib/links';
import { goBack } from '@/lib/nav';
import { colors, fonts, type } from '@/theme';

const WishDetail = () => {
  const insets = useSafeAreaInsets();
  const me = useMe();
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: wish, isPending } = useWish(id);
  const { data: owner } = useProfile(wish && wish.ownerId !== me.id ? wish.ownerId : undefined);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const fulfill = useFulfillWish();
  const restore = useRestoreWish();
  const remove = useDeleteWish();
  const reserve = useReserve();
  const unreserve = useUnreserve();

  // Where the back button leads when this screen was opened directly and has nothing
  // beneath it: a friend's wish belongs with their list, your own with yours.
  const home: Href =
    wish && wish.ownerId !== me.id ? { pathname: '/friends/[userId]', params: { userId: wish.ownerId } } : '/';

  const back = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.common.back}
      onPress={() => goBack(home)}
      style={[styles.round, styles.back, { top: insets.top + 8 }]}>
      <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
    </Pressable>
  );

  if (!wish) {
    return (
      <View style={styles.screen}>
        {back}
        {!isPending && (
          <Text style={[type.body, styles.gone, { marginTop: insets.top + 96 }]}>{t.wish.gone}</Text>
        )}
      </View>
    );
  }

  const own = wish.ownerId === me.id;

  const markFulfilled = async () => {
    setConfirmingDelete(false);
    await fulfill.mutateAsync(wish.id);
    goBack();
  };

  const deleteWish = async () => {
    setConfirmingDelete(false);
    await remove.mutateAsync(wish.id);
    goBack();
  };

  const ownerActions = wish.fulfilledAt ? (
    <Button label={t.wish.putBack} icon={RotateCcw} loading={restore.isPending} onPress={() => restore.mutate(wish.id)} />
  ) : (
    <Button label={t.wish.gotThis} icon={Check} loading={fulfill.isPending} onPress={markFulfilled} />
  );

  const friendActions =
    wish.reservation === 'mine' ? (
      <>
        <View style={styles.reservedByYou}>
          <Check size={17} color={colors.green} strokeWidth={2.4} />
          <Text style={styles.reservedByYouLabel}>{t.card.reservedByYou}</Text>
        </View>
        <Button label={t.card.undoReservation} variant="outline" loading={unreserve.isPending} onPress={() => unreserve.mutate(wish.id)} />
        {owner && <Text style={[type.small, styles.footnote]}>{t.wish.secretNoteShort(owner.name)}</Text>}
      </>
    ) : wish.reservation === 'taken' ? (
      <>
        <Button label={t.wish.alreadyReserved} variant="outline" disabled />
        <Text style={[type.small, styles.footnote]}>{t.wish.takenNote}</Text>
      </>
    ) : (
      <>
        <Button
          label={t.wish.reserveGift}
          variant="accent"
          icon={Bookmark}
          loading={reserve.isPending}
          onPress={() => reserve.mutate(wish.id)}
        />
        {owner && <Text style={[type.small, styles.footnote]}>{t.wish.secretNote(owner.name)}</Text>}
      </>
    );

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} bounces={false}>
        {wish.imageUri ? (
          <WishImage uri={wish.imageUri} seed={wish.id} iconSize={36} style={styles.hero} />
        ) : (
          <View style={{ height: insets.top + 76 }} />
        )}
        <View style={[styles.content, !!wish.imageUri && styles.contentOverHero]}>
          {!own && owner && <Text style={[type.label, styles.eyebrow]}>{t.wish.ownedBy(owner.name)}</Text>}
          {wish.fulfilledAt && (
            <View style={styles.fulfilled}>
              <Check size={15} color={colors.green} strokeWidth={2.2} />
              <Text style={styles.fulfilledLabel}>{t.wish.fulfilledOn(wish.fulfilledAt)}</Text>
            </View>
          )}
          <Text style={isNoteOnly(wish) ? styles.noteTitle : type.title}>
            {isNoteOnly(wish) ? t.quote(wish.title) : wish.title}
          </Text>
          {wish.price && <Text style={styles.price}>{wish.price}</Text>}
          {wish.note && <Text style={[type.body, styles.note]}>{wish.note}</Text>}
          {wish.url && (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={t.wish.open(domainOf(wish.url))}
              onPress={() => Linking.openURL(wish.url!).catch(() => {})}
              style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
              <LinkIcon size={18} color={colors.ink} strokeWidth={2} />
              <Text style={styles.linkLabel} numberOfLines={1}>
                {domainOf(wish.url)}
              </Text>
              <ArrowUpRight size={18} color={colors.ink} strokeWidth={2} />
            </Pressable>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {own ? ownerActions : friendActions}
        {own && (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setConfirmingDelete(true)} style={styles.delete}>
            <Text style={styles.deleteLabel}>{t.wish.deleteWish}</Text>
          </Pressable>
        )}
      </View>

      {back}
      {own && !wish.fulfilledAt && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.wish.edit}
          onPress={() => router.push({ pathname: '/wish/[id]/edit', params: { id: wish.id } })}
          style={[styles.round, styles.edit, { top: insets.top + 8 }]}>
          <Pencil size={16} color={colors.ink} strokeWidth={2} />
          <Text style={styles.editLabel}>{t.wish.edit}</Text>
        </Pressable>
      )}

      <Sheet visible={confirmingDelete} onClose={() => setConfirmingDelete(false)}>
        <Text style={styles.sheetTitle}>{t.wish.deleteTitle}</Text>
        <Text style={[type.body, styles.sheetBody]}>
          {t.wish.deleteBody(wish.title)}
          {!wish.fulfilledAt && ` ${t.wish.deleteHint}`}
        </Text>
        <View style={styles.sheetActions}>
          <Button label={t.wish.delete} variant="danger" loading={remove.isPending} onPress={deleteWish} />
          {!wish.fulfilledAt && <Button label={t.wish.markFulfilled} variant="outline" onPress={markFulfilled} />}
        </View>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setConfirmingDelete(false)} style={styles.cancel}>
          <Text style={styles.cancelLabel}>{t.common.cancel}</Text>
        </Pressable>
      </Sheet>
    </View>
  );
};

export default WishDetail;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1 },
  gone: { textAlign: 'center', paddingHorizontal: 32 },
  hero: { height: 356 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24, backgroundColor: colors.bg },
  contentOverHero: { marginTop: -28, paddingTop: 34, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  eyebrow: { marginBottom: 8 },
  fulfilled: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  fulfilledLabel: { ...fonts.medium, fontSize: 14.5, color: colors.green },
  noteTitle: { ...fonts.serifItalic, fontSize: 32, lineHeight: 38, color: colors.ink },
  price: { ...fonts.bold, fontSize: 20, color: colors.ink, marginTop: 8 },
  note: { marginTop: 18 },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 54,
    paddingHorizontal: 18,
    marginTop: 22,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  linkLabel: { flex: 1, ...fonts.medium, fontSize: 16, color: colors.ink },
  pressed: { opacity: 0.7 },
  footer: { paddingHorizontal: 24, paddingTop: 12, gap: 12, backgroundColor: colors.bg },
  footnote: { textAlign: 'center', paddingHorizontal: 8, lineHeight: 19 },
  reservedByYou: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 2 },
  reservedByYouLabel: { ...fonts.semibold, fontSize: 16, color: colors.green },
  delete: { alignSelf: 'center', paddingVertical: 10 },
  deleteLabel: { ...fonts.medium, fontSize: 16, color: colors.danger },
  round: {
    position: 'absolute',
    height: 44,
    minWidth: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  back: { left: 16 },
  edit: { right: 16, flexDirection: 'row', gap: 8, paddingHorizontal: 18 },
  editLabel: { ...fonts.medium, fontSize: 16, color: colors.ink },
  sheetTitle: { ...fonts.serif, fontSize: 32, lineHeight: 36, color: colors.ink },
  sheetBody: { marginTop: 12 },
  sheetActions: { gap: 10, marginTop: 24 },
  cancel: { alignSelf: 'center', paddingVertical: 16, marginTop: 6 },
  cancelLabel: { ...fonts.sans, fontSize: 16, color: colors.muted },
});
