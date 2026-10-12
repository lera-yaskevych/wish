import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { colors, fonts, type } from '@/theme';

type Props = TextInputProps & {
  label: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export const Field = ({ label, containerStyle, style, multiline, onFocus, onBlur, ...input }: Props) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={type.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.faint}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[styles.input, multiline && styles.multiline, focused && styles.focused, style]}
        {...input}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 8 },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 17,
    ...fonts.sans,
    fontSize: 17,
    color: colors.ink,
    // Browsers draw their own focus ring unless the outline is solid and zero-width.
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
  multiline: { height: undefined, minHeight: 100, paddingTop: 14, paddingBottom: 14, lineHeight: 23 },
  focused: { borderColor: colors.ink },
});
