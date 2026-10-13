import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthScreen, authStyles } from '@/components/AuthScreen';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { useAuth } from '@/data/auth';
import { errorText, useT } from '@/i18n';
import { usernameAsTyped, usernameFrom } from '@/lib/username';
import { fonts, type } from '@/theme';

const SignUp = () => {
  const { signUp } = useAuth();
  const t = useT();
  const [name, setName] = useState('');
  // Follows the name until the person types a username of their own.
  const [username, setUsername] = useState('');
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // An invite link (…/sign-up?invite=code) fills this in for the person.
  const { invite } = useLocalSearchParams<{ invite?: string }>();
  const [inviteCode, setInviteCode] = useState(invite ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await signUp({ name, username, email, password, inviteCode });
    } catch (caught) {
      setError(errorText(t, caught));
      setBusy(false);
    }
  };

  return (
    <AuthScreen
      footer={
        <Text style={authStyles.footerText}>
          {t.auth.haveAccount}{' '}
          <Link href="/log-in" replace style={authStyles.footerLink}>
            {t.auth.logIn}
          </Link>
        </Text>
      }>
      <Text style={type.display}>
        {t.auth.headline[0]}
        {'\n'}
        <Text style={styles.italic}>{t.auth.headline[1]}</Text>
      </Text>
      <Text style={[type.body, styles.intro]}>
        {t.auth.intro}
      </Text>

      <View style={authStyles.fields}>
        <Field
          label={t.auth.name}
          placeholder={t.auth.namePlaceholder}
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (!usernameEdited) setUsername(usernameFrom(text));
          }}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
        />
        <View style={styles.withHint}>
          <Field
            label={t.auth.username}
            value={username}
            onChangeText={(text) => {
              setUsernameEdited(true);
              setUsername(usernameAsTyped(text));
            }}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            returnKeyType="next"
          />
          <Text style={type.small}>{t.auth.usernameHint}</Text>
        </View>
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
          placeholder={t.auth.newPasswordPlaceholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
        />
        <Field
          label={t.auth.inviteCode}
          placeholder={t.auth.inviteCodePlaceholder}
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      </View>

      {error && <Text style={authStyles.error}>{error}</Text>}
      <Button label={t.auth.createAccount} onPress={submit} loading={busy} style={authStyles.submit} />
    </AuthScreen>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  italic: { ...fonts.serifItalic },
  intro: { marginTop: 18 },
  withHint: { gap: 6 },
});
