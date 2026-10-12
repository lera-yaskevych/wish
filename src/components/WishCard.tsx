import { Check, Link as LinkIcon } from 'lucide-react-native';
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
  // Present on a friend's list: the card then carries the reserve controls.
  onReserve?: () => void;
  onUnreserve?: () => void;
};

export const WishCard = ({ wish, onPress, onReserve, onUnreserve }: Props) => {
  const t = useT();
  const friendView = !!onReserve;
  const mine = wish.reservation === 'mine';
  const taken = wish.reservation === 'taken';
  const note = isNoteOnly(wish);
  const domain = wish.url ? domainOf(wish.url) : null;
  const titleColor = taken ? colors.muted : colors.ink;

  const details = friendView ? (
    mine ? (
      <View style={styles.inline}>
        <Check size={15} color={colors.green} strokeWidth={2.4} />
        <Text style={styles.reservedByYou}>{t.card.reservedByYou}</Text>
      </View>
    ) : (
      <Text style={type.sub} numberOfLines={1}>
        {[wish.price, domain ?? wish.note].filter(Boolean).join(' · ')}
      </Text>
    )
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

  const control = !friendView ? null : mine ? (
    <Pressable accessibilityRole="button" accessibilityLabel={t.card.undoReservation} onPress={onUnreserve} hitSlop={10}>
      <Text style={styles.undo}>{t.card.undo}</Text>
    </Pressable>
  ) : taken ? (
    <Text style={styles.taken}>{t.card.reserved}</Text>
  ) : (
    <Button label={t.card.reserve} variant="outline" size="sm" onPress={onReserve} />
  );

  return (
    <View style={[styles.card, mine && styles.mine, taken && styles.takenCard]}>
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
              <Text style={[type.small, styles.noteLabel]}>{t.card.note}</Text>
            </>
          ) : (
            <>
              <Text style={[type.cardTitle, { color: titleColor }]} numberOfLines={2}>
                {wish.title}
              </Text>
              {details}
              {!friendView && !!wish.imageUri && !!wish.price && <Text style={type.price}>{wish.price}</Text>}
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
  undo: { ...fonts.medium, fontSize: 15.5, color: colors.green, paddingHorizontal: 8 },
  taken: { ...fonts.medium, fontSize: 14.5, color: colors.muted, paddingHorizontal: 4 },
});
