import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { storeAdminToken, verifyAdminToken } from '../../services/content-api';
import { colors, radii } from '../../theme';
import { Button } from './Primitives';

export function AdminLogin({ checking, onAuthenticated }: { checking: boolean; onAuthenticated: () => void }) {
  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const login = async () => {
    if (!token.trim()) return;
    setSubmitting(true);
    setError('');
    const valid = await verifyAdminToken(token);
    if (valid) {
      await storeAdminToken(token);
      onAuthenticated();
    } else {
      setError('Chiave amministratore non valida oppure servizio non raggiungibile.');
    }
    setSubmitting(false);
  };

  return (
    <View style={styles.shell}>
      <View style={styles.icon}>
        <MaterialCommunityIcons name="shield-lock-outline" size={34} color={colors.accentStrong} />
      </View>
      <Text style={styles.eyebrow}>AREA RISERVATA</Text>
      <Text style={styles.title}>Accesso amministratore</Text>
      <Text style={styles.copy}>Inserisci la chiave privata per modificare i contenuti condivisi dell’app.</Text>
      {checking ? (
        <ActivityIndicator color={colors.accentStrong} />
      ) : (
        <>
          <TextInput
            accessibilityLabel="Chiave amministratore"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setToken}
            onSubmitEditing={() => void login()}
            placeholder="Chiave amministratore"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
            value={token}
          />
          <Button label={submitting ? 'Verifica...' : 'Accedi'} icon="login" disabled={submitting || !token.trim()} onPress={() => void login()} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 24,
    marginTop: 70,
    borderRadius: radii.lg,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  icon: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised },
  eyebrow: { color: colors.yellow, fontSize: 11, fontWeight: '900' },
  title: { color: colors.ink, fontSize: 25, fontWeight: '900', textAlign: 'center' },
  copy: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  input: { width: '100%', minHeight: 48, paddingHorizontal: 14, borderRadius: radii.md, borderWidth: 1, borderColor: colors.line, color: colors.ink, backgroundColor: colors.canvasRaised },
  error: { color: colors.live, fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
});
