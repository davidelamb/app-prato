import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, radii } from '../theme';
import { Player } from '../types';

export function PlayerCard({ player, onPress, style }: { player: Player; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
      <View style={styles.photoWrap}>
        {player.imageUrl ? (
          <Image source={{ uri: player.imageUrl }} resizeMode="cover" style={styles.photo} />
        ) : (
          <View style={styles.placeholder}><MaterialCommunityIcons name="account" size={52} color={colors.mutedDark} /></View>
        )}
        <View style={styles.numberBadge}><Text style={styles.numberText}>{player.number ? `#${player.number}` : 'AC'}</Text></View>
      </View>

      <View style={styles.info}>
        <Text style={styles.role}>{player.role}</Text>
        <Text numberOfLines={1} style={styles.name}>{player.name}</Text>
        <Text numberOfLines={1} style={styles.meta}>{player.nationality ?? 'Italia'}{player.age ? ` · ${player.age} anni` : ''}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statValue}>{player.appearances}</Text><Text style={styles.statLabel}>Pres.</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{player.goals}</Text><Text style={styles.statLabel}>Gol</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{player.assists ?? 0}</Text><Text style={styles.statLabel}>Assist</Text></View>
        </View>
      </View>
      <View style={styles.arrow}><MaterialCommunityIcons name="chevron-right" size={24} color={colors.accentStrong} /></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 146, flexDirection: 'row', alignItems: 'stretch', overflow: 'hidden', borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  pressed: { opacity: 0.88 },
  photoWrap: { width: 122, minHeight: 146, overflow: 'hidden', backgroundColor: colors.surfaceSoft },
  photo: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  numberBadge: { position: 'absolute', left: 9, bottom: 9, minWidth: 42, paddingHorizontal: 9, paddingVertical: 6, borderRadius: radii.sm, backgroundColor: colors.navy },
  numberText: { color: colors.paper, fontSize: 11, fontWeight: '900', textAlign: 'center' },
  info: { flex: 1, paddingVertical: 15, paddingLeft: 15, paddingRight: 4 },
  role: { color: colors.accentStrong, fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  name: { color: colors.ink, fontSize: 19, lineHeight: 23, fontWeight: '900', marginTop: 5 },
  meta: { color: colors.muted, fontSize: 11, marginTop: 5 },
  statsRow: { flexDirection: 'row', gap: 20, marginTop: 14 },
  stat: { minWidth: 34 },
  statValue: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  statLabel: { color: colors.mutedDark, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', marginTop: 1 },
  arrow: { width: 40, alignItems: 'center', justifyContent: 'center' },
});
