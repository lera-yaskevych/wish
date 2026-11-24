import { router } from 'expo-router';
import { Check, Gift } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Wish } from '@/data';
import { useDismissGiven, useFulfillWish } from '@/data/hooks';
import { useT } from '@/i18n';
import { colors, fonts, type } from '@/theme';

import { Button } from './Button';

// Asks the owner whether a gift someone marked as given has arrived. Yes marks the wish as
// received, the same as "I got this"; no clears the question and keeps the reservation.
export const GivenPrompt = ({ wish }: { wish: Wish }) => {
  const t = useT();
  const fulfill = useFulfillWish();
  const dismiss = useDismissGiven();
  const busy = fulfill.isPending || dismiss.isPending;

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={wish.title}
        onPress={() => router.push({ pathname: '/wish/[id]', params: { id: wish.id } })}
        style={({ pressed }) => [styles.top, pressed && styles.pressed]}>
        <View style={styles.icon}>
          <Gift size={18} color={colors.accent} strokeWidth={2} />
        </View>
        <View style={styles.text}>
          <Text style={styles.question}>{t.given.question}</Text>
          <Text style={type.sub} numberOfLines={3}>
            {t.given.someoneGave(wish.title)}
          </Text>
        </View>
      </Pressable>
      <View style={styles.actions}>
        <Button
          label={t.given.yes}
          size="sm"
          icon={Check}
          loading={fulfill.isPending}
          disabled={busy && !fulfill.isPending}
          onPress={() => fulfill.mutate(wish.id)}
        />
        <Button
          label={t.given.no}
          size="sm"
          variant="outline"
          loading={dismiss.isPending}
          disabled={busy && !dismiss.isPending}
          onPress={() => dismiss.mutate(wish.id)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  pressed: { opacity: 0.7 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  text: { flex: 1, gap: 2 },
  question: { ...fonts.semibold, fontSize: 17, lineHeight: 22, color: colors.ink },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
