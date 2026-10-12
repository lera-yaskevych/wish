import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Grabber } from '@/components/Sheet';
import { useAuth, useMe } from '@/data/auth';
import { errorText, languages, useLanguage } from '@/i18n';
import { goBack } from '@/lib/nav';
import { colors, fonts, type } from '@/theme';

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Returns "MM-DD", null for "no birthday", or undefined when the entry is invalid.
const parseBirthday = (day: string, month: string) => {
  if (!day.trim() && !month.trim()) return null;
  const d = Number(day);
  const m = Number(month);
  if (!Number.isInteger(m) || m < 1 || m > 12) return undefined;
  if (!Number.isInteger(d) || d < 1 || d > DAYS_IN_MONTH[m - 1]) return undefined;
  return `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

const Profile = () => {
  const insets = useSafeAreaInsets();
  const me = useMe();
  const { updateProfile, logOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [name, setName] = useState(me.name);
  const [username, setUsername] = useState(me.username);
  const [day, setDay] = useState(me.birthday ? String(Number(me.birthday.slice(3))) : '');
  const [month, setMonth] = useState(me.birthday ? String(Number(me.birthday.slice(0, 2))) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const birthday = parseBirthday(day, month);
    if (birthday === undefined) {
      setError(t.profile.birthdayError);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateProfile({ name, username, birthday });
      goBack();
    } catch (caught) {
      setError(errorText(t, caught));
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.top}>
        <Grabber />
        <View style={styles.bar}>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={() => goBack()} style={styles.barSide}>
            <Text style={styles.cancel}>{t.common.cancel}</Text>
          </Pressable>
          <Text style={styles.barTitle}>{t.profile.title}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.common.save}
            hitSlop={12}
            disabled={saving}
            onPress={save}
            style={[styles.barSide, styles.barRight]}>
            {saving ? <ActivityIndicator color={colors.accent} /> : <Text style={styles.save}>{t.common.save}</Text>}
          </Pressable>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.fields}>
          <View style={styles.identity}>
            <Avatar id={me.id} name={name || me.name} size={64} plain />
            <View style={styles.identityText}>
              <Text style={styles.name} numberOfLines={1}>
                {name || me.name}
              </Text>
              <Text style={type.sub}>@{username || me.username}</Text>
            </View>
          </View>

          <Field label={t.profile.name} value={name} onChangeText={setName} autoCapitalize="words" />
          <Field
            label={t.profile.username}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.birthdayGroup}>
            <View style={styles.birthday}>
              <Field
                label={t.profile.birthdayDay}
                placeholder="2"
                value={day}
                onChangeText={setDay}
                keyboardType="number-pad"
                maxLength={2}
                containerStyle={styles.half}
              />
              <Field
                label={t.profile.birthdayMonth}
                placeholder="11"
                value={month}
                onChangeText={setMonth}
                keyboardType="number-pad"
                maxLength={2}
                containerStyle={styles.half}
              />
            </View>
            <Text style={type.small}>{t.profile.birthdayHint}</Text>
          </View>
          <View style={styles.languageGroup}>
            <Text style={type.label}>{t.profile.language}</Text>
            <View style={styles.languages}>
              {languages.map(({ code, label }) => {
                const selected = code === language;
                return (
                  <Pressable
                    key={code}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    accessibilityState={{ selected }}
                    onPress={() => setLanguage(code)}
                    style={[styles.language, selected && styles.languageSelected]}>
                    <Text style={[styles.languageLabel, selected && styles.languageLabelSelected]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
        </View>

        <Button label={t.profile.logOut} variant="outline" onPress={logOut} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { paddingTop: 10, paddingHorizontal: 24 },
  bar: { flexDirection: 'row', alignItems: 'center', height: 32, marginTop: -6 },
  barSide: { flex: 1 },
  barRight: { alignItems: 'flex-end' },
  barTitle: { ...fonts.semibold, fontSize: 17, color: colors.ink },
  cancel: { ...fonts.sans, fontSize: 17, color: colors.muted },
  save: { ...fonts.semibold, fontSize: 17, color: colors.accent },
  content: { flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 28, gap: 40 },
  fields: { gap: 20 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  identityText: { flex: 1, gap: 2 },
  name: { ...fonts.serif, fontSize: 32, lineHeight: 36, color: colors.ink },
  birthdayGroup: { gap: 8 },
  birthday: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  languageGroup: { gap: 10 },
  languages: { flexDirection: 'row', gap: 10 },
  language: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.line,
    justifyContent: 'center',
  },
  languageSelected: { borderColor: colors.ink, backgroundColor: colors.ink },
  languageLabel: { ...fonts.medium, fontSize: 15.5, color: colors.ink },
  languageLabelSelected: { color: colors.white },
  error: { ...fonts.medium, fontSize: 14.5, lineHeight: 20, color: colors.danger },
});
