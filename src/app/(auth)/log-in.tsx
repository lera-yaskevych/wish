import { Link } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthScreen, authStyles } from '@/components/AuthScreen';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { useAuth } from '@/data/auth';
import { errorText, useT } from '@/i18n';
import { colors, fonts, type } from '@/theme';

const LogIn = () => {
  const { logIn, requestPasswordReset } = useAuth();
  const t = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await logIn({ email, password });
    } catch (caught) {
      setError(errorText(t, caught));
      setBusy(false);
    }
  };

  const forgot = async () => {
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError(t.errors.email_required);
      return;
    }
    try {
      await requestPasswordReset(email);
      setNotice(t.auth.resetSent);
    } catch (caught) {
      setError(errorText(t, caught));
    }
  };

  return (
    <AuthScreen
      footer={
        <Text style={authStyles.footerText}>
          {t.auth.newHere}{' '}
          <Link href="/sign-up" replace style={authStyles.footerLink}>
            {t.auth.createAnAccount}
          </Link>
        </Text>
      }>
      <Text style={type.display}>
        {t.auth.welcome[0]}
        <Text style={styles.italic}>{t.auth.welcome[1]}</Text>
      </Text>

      <View style={authStyles.fields}>
        <Field
          label={t.auth.email}
          placeholder={t.auth.emailPlaceholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <Field
          label={t.auth.password}
          placeholder={t.auth.passwordPlaceholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        hitSlop={10}
        style={styles.forgot}
        onPress={forgot}>
        <Text style={styles.forgotText}>{t.auth.forgot}</Text>
      </Pressable>

      {notice && <Text style={[type.small, styles.notice]}>{notice}</Text>}
      {error && <Text style={authStyles.error}>{error}</Text>}
      <Button label={t.auth.logIn} onPress={submit} loading={busy} style={authStyles.submit} />

      <View style={styles.staySignedIn}>
        <Lock size={15} color={colors.muted} strokeWidth={2} />
        <Text style={type.sub}>{t.auth.staySignedIn}</Text>
      </View>
    </AuthScreen>
  );
};

export default LogIn;

const styles = StyleSheet.create({
  italic: { ...fonts.serifItalic },
  forgot: { alignSelf: 'flex-end', marginTop: 16 },
  forgotText: { ...fonts.sans, fontSize: 15.5, color: colors.muted, textDecorationLine: 'underline' },
  notice: { marginTop: 12 },
  staySignedIn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
});
