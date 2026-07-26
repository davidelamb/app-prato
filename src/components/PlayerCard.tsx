import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useEffect, useState } from 'react';

import { NationalityBadge } from './NationalityBadge';
import { colors, radii } from '../theme';
import { Player } from '../types';
import { nationalityList } from '../utils/nationality';
import { playerImageStyle } from '../utils/player-image';

export function PlayerCard({ player, onPress, style }: { player: Player; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [player.imageUrl]);

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
      <View style={styles.photoWrap}>
        {player.imageUrl && !imageFailed ? (
          <Image
            source={{ uri: player.imageUrl }}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
            style={[styles.photo, playerImageStyle(player)]}
          />
        ) : (
          <View style={styles.placeholder}><MaterialCommunityIcons name="account" size={52} color={colors.mutedDark} /></View>
        )}
        <View style={styles.numberBadge}><Text style={styles.numberText}>{player.number ? `#${player.number}` : 'AC'}</Text></View>
      </View>

      <View style={styles.info}>
        <Text style={styles.role}>{player.role}</Text>
        <View style={styles.nameRow}>
          <Text numberOfLines={2} style={styles.name}>{player.name}</Text>
          <NationalityBadge value={player.nationality} compact />
        </View>
        <Text numberOfLines={1} style={styles.meta}>{nationalityList(player.nationality).join(' / ') || 'Italia'}{player.age ? ` · ${player.age} anni` : ''}</Text>
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
  card: { height: 146, flexDirection: 'row', alignItems: 'stretch', overflow: 'hidden', borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  pressed: { opacity: 0.88 },
  photoWrap: { width: 122, height: 146, overflow: 'hidden', backgroundColor: colors.surfaceSoft },
  photo: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  numberBadge: { position: 'absolute', left: 9, bottom: 9, minWidth: 42, paddingHorizontal: 9, paddingVertical: 6, borderRadius: radii.sm, backgroundColor: colors.navy },
  numberText: { color: colors.paper, fontSize: 11, fontWeight: '900', textAlign: 'center' },
  info: { flex: 1, paddingVertical: 15, paddingLeft: 15, paddingRight: 4 },
  role: { color: colors.accentStrong, fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 5 },
  name: { flex: 1, minWidth: 0, color: colors.ink, fontSize: 19, lineHeight: 22, fontWeight: '900' },
  meta: { color: colors.muted, fontSize: 11, marginTop: 5 },
  statsRow: { flexDirection: 'row', gap: 20, marginTop: 14 },
  stat: { minWidth: 34 },
  statValue: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  statLabel: { color: colors.mutedDark, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', marginTop: 1 },
  arrow: { width: 40, alignItems: 'center', justifyContent: 'center' },
});
