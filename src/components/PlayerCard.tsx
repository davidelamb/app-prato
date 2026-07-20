import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, radii } from '../theme';
import { Player } from '../types';

export function PlayerCard({ player, onPress, style }: { player: Player; onPress: () => void; style?: ViewStyle }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
      <View style={styles.photoWrap}>
        {player.imageUrl ? (
          <Image source={{ uri: player.imageUrl }} resizeMode="cover" style={styles.photo} />
        ) : (
          <View style={styles.placeholder}><MaterialCommunityIcons name="account" size={50} color={colors.mutedDark} /></View>
        )}
        <View style={styles.numberPill}><Text style={styles.numberText}>{player.number ? `#${player.number}` : '—'}</Text></View>
      </View>
      <View style={styles.info}>
        <Text style={styles.role}>{player.role}</Text>
        <Text numberOfLines={1} style={styles.name}>{player.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{player.age ? `${player.age} anni` : player.nationality ?? 'Italia'}</Text>
          <View style={styles.dot} />
          <Text style={styles.meta}>{player.marketValue ?? 'Rosa AC Prato'}</Text>
        </View>
        <View style={styles.statsRow}>
          <View><Text style={styles.statValue}>{player.appearances}</Text><Text style={styles.statLabel}>Pres.</Text></View>
          <View><Text style={styles.statValue}>{player.goals}</Text><Text style={styles.statLabel}>Gol</Text></View>
          <View><Text style={styles.statValue}>{player.assists ?? 0}</Text><Text style={styles.statLabel}>Assist</Text></View>
        </View>
      </View>
      <View style={styles.arrow}><MaterialCommunityIcons name="chevron-right" size={24} color={colors.accent} /></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 150, flexDirection: 'row', overflow: 'hidden', borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineSoft },
  pressed: { opacity: 0.88, transform: [{ scale: 0.995 }] },
  photoWrap: { width: 126, minHeight: 150, overflow: 'hidden', backgroundColor: colors.canvasRaised },
  photo: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvasRaised },
  numberPill: { position: 'absolute', left: 10, bottom: 10, minWidth: 38, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: 'rgba(4,18,31,0.86)' },
  numberText: { color: colors.paper, fontSize: 12, fontWeight: '900', textAlign: 'center' },
  info: { flex: 1, paddingVertical: 16, paddingLeft: 16, paddingRight: 8 },
  role: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  name: { color: colors.ink, fontSize: 19, lineHeight: 23, fontWeight: '900', marginTop: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginTop: 7 },
  meta: { color: colors.muted, fontSize: 12 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.mutedDark },
  statsRow: { flexDirection: 'row', gap: 22, marginTop: 14 },
  statValue: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 10, marginTop: 1, textTransform: 'uppercase' },
  arrow: { width: 42, alignItems: 'center', justifyContent: 'center' },
});
