import { StyleSheet, Text, View } from 'react-native';

import { initialOf } from '@/lib/format';
import { colors, fonts, tintFor } from '@/theme';

type Props = {
  id: string;
  name: string;
  size?: number;
  // The signed-in person's own avatar: neutral, outlined, sans initial.
  plain?: boolean;
};

export const Avatar = ({ id, name, size = 52, plain }: Props) => {
  const tint = tintFor(id);
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        plain ? styles.plain : { backgroundColor: tint.bg },
      ]}>
      <Text
        style={
          plain
            ? { ...fonts.bold, fontSize: size * 0.4, color: colors.ink }
            : { ...fonts.serif, fontSize: size * 0.54, color: tint.text }
        }>
        {initialOf(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  plain: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line },
});
