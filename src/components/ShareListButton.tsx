import { Share as ShareIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useShareToken } from '@/data/hooks';
import { useT } from '@/i18n';
import { listLink, shareText } from '@/lib/share';
import { colors, fonts } from '@/theme';

type Props = {
  // Whose list the link opens, and whether that is the person sharing it.
  userId: string;
  name: string;
  own?: boolean;
};

// Sends a link that opens someone's list for anyone, with or without an account.
export const ShareListButton = ({ userId, name, own }: Props) => {
  const t = useT();
  const { data: token } = useShareToken(userId);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    if (!token) return;
    const link = listLink(token);
    const message = own ? t.share.ownMessage(link) : t.share.friendMessage(name, link);
    if ((await shareText(message)) === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const label = copied ? t.share.copied : t.share.list;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !token }}
      disabled={!token}
      hitSlop={12}
      onPress={share}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, !token && styles.waiting]}>
      <ShareIcon size={18} color={colors.muted} strokeWidth={2} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44 },
  pressed: { opacity: 0.6 },
  waiting: { opacity: 0.5 },
  label: { ...fonts.sans, fontSize: 16.5, color: colors.muted },
});
