import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthScreen, authStyles } from '@/components/AuthScreen';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { useAuth } from '@/data/auth';
import { errorText, useT } from '@/i18n';
import { goBack } from '@/lib/nav';
import { fonts, type } from '@/theme';

// Where the link in a password-reset email lands: the link signs the person in,
// and this screen lets them choose the new password.
const ResetPassword = () => {
  const { setPassword } = useAuth();
  const t = useT();
  const [password, setPasswordText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await setPassword(password);
      goBack('/');
    } catch (caught) {
      setError(errorText(t, caught));
      setBusy(false);
    }
  };

  return (
    <AuthScreen footer={<View />}>
      <Text style={type.display}>
        {t.auth.newPasswordTitle[0]}
        <Text style={styles.italic}>{t.auth.newPasswordTitle[1]}</Text>
      </Text>

      <View style={authStyles.fields}>
        <Field
          label={t.auth.newPassword}
          placeholder={t.auth.newPasswordPlaceholder}
          value={password}
          onChangeText={setPasswordText}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      </View>

      {error && <Text style={authStyles.error}>{error}</Text>}
      <Button label={t.auth.savePassword} onPress={submit} loading={busy} style={authStyles.submit} />
    </AuthScreen>
  );
};

export default ResetPassword;

const styles = StyleSheet.create({
  italic: { ...fonts.serifItalic },
});
