import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useEffect, useState } from 'react';

import { NationalityBadge } from './NationalityBadge';
import { colors, radii } from '../theme';
import { Player } from '../types';
import { nationalityList } from '../utils/nationality';
import { playerImageStyle } from '../utils/player-image';
import { displayPlayerName } from '../utils/player-name';

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
        <View style={styles.nameRow}>
          <Text numberOfLines={2} style={styles.name}>{displayPlayerName(player.name)}</Text>
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
  card: { height: 112, flexDirection: 'row', alignItems: 'stretch', overflow: 'hidden', borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  pressed: { opacity: 0.88 },
  photoWrap: { width: 94, height: 112, overflow: 'hidden', backgroundColor: colors.surfaceSoft },
  photo: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  numberBadge: { position: 'absolute', left: 7, bottom: 7, minWidth: 38, paddingHorizontal: 7, paddingVertical: 5, borderRadius: radii.sm, backgroundColor: colors.navy },
  numberText: { color: colors.paper, fontSize: 10, fontWeight: '900', textAlign: 'center' },
  info: { flex: 1, paddingVertical: 10, paddingLeft: 12, paddingRight: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  name: { flex: 1, minWidth: 0, color: colors.ink, fontSize: 17, lineHeight: 19, fontWeight: '900' },
  meta: { color: colors.muted, fontSize: 10, marginTop: 3 },
  statsRow: { flexDirection: 'row', gap: 15, marginTop: 8 },
  stat: { minWidth: 30 },
  statValue: { color: colors.ink, fontSize: 14, fontWeight: '900' },
  statLabel: { color: colors.mutedDark, fontSize: 8, fontWeight: '800', textTransform: 'uppercase', marginTop: 1 },
  arrow: { width: 31, alignItems: 'center', justifyContent: 'center' },
});
