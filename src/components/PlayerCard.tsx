import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, radii } from '../theme';
import { Player } from '../types';

export function PlayerCard({ player, onPress, style }: { player: Player; onPress: () => void; style?: ViewStyle }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
      <View style={styles.photoWrap}>
        {player.imageUrl ? <Image source={{ uri: player.imageUrl }} resizeMode="cover" style={styles.photo} /> : <View style={styles.placeholder}><MaterialCommunityIcons name="account" size={56} color={colors.mutedDark} /></View>}
        <View style={styles.numberBlock}><Text style={styles.numberText}>{player.number ?? '—'}</Text></View>
      </View>
      <View style={styles.info}>
        <Text style={styles.role}>{player.role}</Text>
        <Text numberOfLines={1} style={styles.name}>{player.name}</Text>
        <View style={styles.metaRow}><Text style={styles.meta}>{player.age ? `${player.age} anni` : player.nationality ?? 'Italia'}</Text><View style={styles.dot} /><Text style={styles.meta}>{player.marketValue ?? 'AC Prato'}</Text></View>
        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statValue}>{player.appearances}</Text><Text style={styles.statLabel}>Pres.</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{player.goals}</Text><Text style={styles.statLabel}>Gol</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{player.assists ?? 0}</Text><Text style={styles.statLabel}>Assist</Text></View>
        </View>
      </View>
      <View style={styles.arrow}><MaterialCommunityIcons name="arrow-top-right" size={20} color={colors.accentStrong} /></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 158, flexDirection: 'row', overflow: 'hidden', borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineSoft, shadowColor: colors.shadow, shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  photoWrap: { width: 128, minHeight: 158, overflow: 'hidden', backgroundColor: colors.canvasRaised },
  photo: { width: '100%', height: '100%' }, placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvasRaised },
  numberBlock: { position: 'absolute', left: 0, bottom: 0, minWidth: 48, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: colors.navy }, numberText: { color: colors.paper, fontSize: 17, fontWeight: '900', textAlign: 'center' },
  info: { flex: 1, paddingVertical: 17, paddingLeft: 17, paddingRight: 8 },
  role: { color: colors.accentStrong, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  name: { color: colors.ink, fontSize: 20, lineHeight: 24, fontWeight: '900', marginTop: 5, letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginTop: 7 }, meta: { color: colors.muted, fontSize: 11 }, dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.accentStrong },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 14 }, stat: { minWidth: 48, paddingVertical: 7, paddingHorizontal: 9, borderRadius: radii.sm, backgroundColor: colors.canvas }, statValue: { color: colors.ink, fontSize: 16, fontWeight: '900' }, statLabel: { color: colors.muted, fontSize: 9, marginTop: 1, textTransform: 'uppercase' },
  arrow: { width: 40, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: colors.lineSoft },
});
