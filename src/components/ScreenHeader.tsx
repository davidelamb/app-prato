import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

export function ScreenHeader({ eyebrow, title, copy, wide = false }: { eyebrow?: string; title: string; copy?: string; wide?: boolean }) {
  return <View style={styles.header}>
    {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
    <Text style={[styles.title, wide && styles.titleWide]}>{title}</Text>
    {copy ? <Text style={styles.copy}>{copy}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  header: { paddingRight: 48 },
  eyebrow: { color: colors.accentStrong, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { color: colors.yellow, fontSize: 29, lineHeight: 34, fontWeight: '900', marginTop: 2 },
  titleWide: { fontSize: 35, lineHeight: 40 },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 18, fontWeight: '700', marginTop: 4 },
});
