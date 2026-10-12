import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts } from '@/theme';

type Variant = 'primary' | 'accent' | 'danger' | 'outline';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'lg' | 'sm' | 'xs';
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

const fills: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.ink, fg: colors.white },
  accent: { bg: colors.accent, fg: colors.white },
  danger: { bg: colors.danger, fg: colors.white },
  outline: { bg: 'transparent', fg: colors.ink, border: colors.line },
};

export const Button = ({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon: Icon,
  disabled,
  loading,
  style,
}: Props) => {
  const fill = fills[variant];
  const small = size !== 'lg';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : size === 'sm' ? styles.sm : styles.xs,
        { backgroundColor: fill.bg, borderColor: fill.border ?? fill.bg },
        variant === 'outline' && small && { borderColor: colors.ink },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fill.fg} />
      ) : (
        <>
          {Icon && <Icon size={small ? 17 : 19} color={fill.fg} strokeWidth={2} />}
          <Text style={[styles.label, small && styles.labelSm, size === 'xs' && styles.labelXs, { color: fill.fg }]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderWidth: 1.5 },
  lg: { height: 54, borderRadius: 27, alignSelf: 'stretch', paddingHorizontal: 24 },
  sm: { height: 40, borderRadius: 20, paddingHorizontal: 15 },
  xs: { height: 36, borderRadius: 18, paddingHorizontal: 13 },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.4 },
  label: { ...fonts.semibold, fontSize: 17 },
  labelSm: { fontSize: 15 },
  labelXs: { ...fonts.medium, fontSize: 14.5 },
});
