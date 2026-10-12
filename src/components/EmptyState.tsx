import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fonts, colors, type } from '@/theme';

type Props = {
  title: string;
  body: string;
  children?: ReactNode;
};

export const EmptyState = ({ title, body, children }: Props) => (
  <View style={styles.box}>
    <Text style={styles.title}>{title}</Text>
    <Text style={[type.sub, styles.body]}>{body}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  box: { alignItems: 'center', paddingTop: 72, paddingHorizontal: 24, gap: 8 },
  title: { ...fonts.serifItalic, fontSize: 26, lineHeight: 30, color: colors.ink, textAlign: 'center' },
  body: { textAlign: 'center', fontSize: 16, lineHeight: 23, marginBottom: 16 },
});
