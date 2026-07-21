import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

export function ScreenHeader({ eyebrow, title, copy, wide = false }: { eyebrow: string; title: string; copy: string; wide?: boolean }) {
  return <View style={styles.header}>
    <Text style={styles.eyebrow}>{eyebrow}</Text>
    <Text style={[styles.title, wide && styles.titleWide]}>{title}</Text>
    <Text style={styles.copy}>{copy}</Text>
  </View>;
}

const styles = StyleSheet.create({
  header: { paddingRight: 48 },
  eyebrow: { color: colors.accentStrong, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 29, lineHeight: 34, fontWeight: '900', marginTop: 2 },
  titleWide: { fontSize: 35, lineHeight: 40 },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 18, fontWeight: '700', marginTop: 4 },
});
