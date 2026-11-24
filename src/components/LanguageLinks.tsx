import { Pressable, StyleSheet, Text, View } from 'react-native';

import { languages, useLanguage } from '@/i18n';
import { colors, fonts } from '@/theme';

// The other languages, for screens used before signing in, where the profile's switch is out of reach.
export const LanguageLinks = () => {
  const { language, setLanguage } = useLanguage();
  const others = languages.filter(({ code }) => code !== language);
  return (
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
  );
};

const styles = StyleSheet.create({
  languages: { flexDirection: 'row', gap: 16 },
  language: { ...fonts.sans, fontSize: 14.5, color: colors.muted },
});
