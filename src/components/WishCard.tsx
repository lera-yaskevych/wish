import { Bookmark, Check, Link as LinkIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Wish } from '@/data';
import { useT } from '@/i18n';
import { isNoteOnly } from '@/lib/format';
import { domainOf } from '@/lib/links';
import { colors, fonts, type } from '@/theme';

import { Button } from './Button';
import { WishImage } from './WishImage';

type Props = {
  wish: Wish;
  onPress: () => void;
  // Present on a friend's list (or a shared one): the card then shows who has it and
  // offers to reserve. Without it or onUnreserve, this is the owner's own list.
  onReserve?: () => void;
  // Alone, without onReserve, this is the overview of your reservations: every card
  // there is yours, so it reads like a plain wish with a way to release it.
  onUnreserve?: () => void;
};

export const WishCard = ({ wish, onPress, onReserve, onUnreserve }: Props) => {
  const t = useT();
  const overview = !onReserve && !!onUnreserve;
  const friendView = !!onReserve || overview;
  const mine = wish.reservation === 'mine' && !overview;
  const taken = wish.reservation === 'taken';
  const note = isNoteOnly(wish);
  const domain = wish.url ? domainOf(wish.url) : null;
  const titleColor = taken && friendView ? colors.muted : colors.ink;

  // Who has it. The owner is told only that it is reserved; reservedBy is empty for them.
  const status = mine ? (
    <View style={styles.inline}>
      <Check size={15} color={colors.green} strokeWidth={2.4} />
      <Text style={styles.reservedByYou}>{t.card.reservedByYou}</Text>
    </View>
  ) : taken ? (
    <View style={styles.inline}>
      <Bookmark size={14} color={friendView ? colors.muted : colors.accent} strokeWidth={2} />
      <Text style={[styles.reservedBy, !friendView && styles.reservedForOwner]} numberOfLines={1}>
        {wish.reservedBy ? t.card.reservedBy(wish.reservedBy) : t.card.reserved}
      </Text>
    </View>
  ) : null;

  const summary = (
    <Text style={type.sub} numberOfLines={1}>
      {[wish.price, domain ?? wish.note].filter(Boolean).join(' · ')}
    </Text>
  );

  const details = friendView ? (
    (status ?? summary)
  ) : domain ? (
    <View style={styles.inline}>
      {!wish.imageUri && <LinkIcon size={14} color={colors.muted} strokeWidth={2} />}
      <Text style={[type.sub, styles.flex]} numberOfLines={1}>
        {domain}
      </Text>
    </View>
  ) : wish.note ? (
    <Text style={type.sub} numberOfLines={1}>
      {wish.note}
    </Text>
  ) : null;

  const control = !friendView ? null : mine || overview ? (
    <Pressable accessibilityRole="button" accessibilityLabel={t.card.undoReservation} onPress={onUnreserve} hitSlop={10}>
      <Text style={styles.undo}>{t.card.undo}</Text>
    </Pressable>
  ) : taken ? null : (
    <Button label={t.card.reserve} variant="outline" size="sm" onPress={onReserve} />
  );

  return (
    <View style={[styles.card, mine && styles.mine, taken && friendView && styles.takenCard]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={wish.title}
        onPress={onPress}
        style={({ pressed }) => [
          styles.body,
          wish.imageUri ? styles.withImage : styles.textOnly,
          friendView && styles.besideControl,
          pressed && styles.pressed,
        ]}>
        {wish.imageUri && (
          <WishImage uri={wish.imageUri} seed={wish.id} style={friendView ? styles.thumbSmall : styles.thumb} />
        )}
        <View style={styles.text}>
          {note ? (
            <>
              <Text style={[type.quote, { color: titleColor }]}>{t.quote(wish.title)}</Text>
              <View style={styles.noteLabel}>{status ?? <Text style={type.small}>{t.card.note}</Text>}</View>
            </>
          ) : (
            <>
              <Text style={[type.cardTitle, { color: titleColor }]} numberOfLines={2}>
                {wish.title}
              </Text>
              {details}
              {!friendView && !!wish.imageUri && !!wish.price && <Text style={type.price}>{wish.price}</Text>}
              {!friendView && status}
            </>
          )}
        </View>
        {!friendView && !wish.imageUri && !!wish.price && <Text style={type.price}>{wish.price}</Text>}
      </Pressable>
      {control && <View style={styles.control}>{control}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
  },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  control: { paddingRight: 13 },
  besideControl: { paddingRight: 8 },
  withImage: { padding: 11, paddingRight: 14 },
  textOnly: { paddingVertical: 15, paddingHorizontal: 15 },
  mine: { backgroundColor: colors.greenSoft, borderColor: colors.greenSoft },
  takenCard: { backgroundColor: 'transparent', borderColor: colors.line },
  pressed: { opacity: 0.85 },
  thumb: { width: 76, height: 76, borderRadius: 13 },
  thumbSmall: { width: 64, height: 64, borderRadius: 12 },
  text: { flex: 1, gap: 2 },
  flex: { flexShrink: 1 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  noteLabel: { marginTop: 6 },
  reservedByYou: { ...fonts.semibold, fontSize: 14.5, color: colors.green },
  reservedBy: { ...fonts.medium, fontSize: 14.5, color: colors.muted, flexShrink: 1 },
  reservedForOwner: { color: colors.accent },
  undo: { ...fonts.medium, fontSize: 15.5, color: colors.green, paddingHorizontal: 8 },
});
