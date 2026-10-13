import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { languages, useLanguage } from '@/i18n';
import { colors, fonts } from '@/theme';

type Props = {
  children: ReactNode;
  // The "Already have an account?" line pinned to the bottom.
  footer: ReactNode;
};

export const AuthScreen = ({ children, footer }: Props) => {
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useLanguage();
  // Offers the other languages, since the profile's switch is out of reach before signing in.
  const others = languages.filter(({ code }) => code !== language);
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 28 }]}>
        <View>
          <View style={styles.top}>
            <Text style={styles.logo}>wish.</Text>
            <View style={styles.languages}>
              {others.map(({ code, label }) => (
                <Pressable
                  key={code}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  hitSlop={8}
                  onPress={() => setLanguage(code)}>
                  <Text style={styles.language}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          {children}
        </View>
        <View style={styles.footer}>{footer}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export const authStyles = StyleSheet.create({
  fields: { gap: 18, marginTop: 30 },
  submit: { marginTop: 26 },
  error: { ...fonts.medium, fontSize: 14.5, lineHeight: 20, color: colors.danger, marginTop: 14 },
  footerText: { ...fonts.sans, fontSize: 16, color: colors.muted },
  footerLink: { ...fonts.bold, color: colors.ink, textDecorationLine: 'underline' },
});

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: 28 },
  top: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 },
  logo: { ...fonts.serif, fontSize: 22, color: colors.accent },
  languages: { flexDirection: 'row', gap: 16 },
  language: { ...fonts.sans, fontSize: 14.5, color: colors.muted },
  footer: { alignItems: 'center', marginTop: 40 },
});
