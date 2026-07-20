import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '../theme';
import { Player } from '../types';

export function PlayerCard({ player }: { player: Player }) {
  return (
    <View style={styles.card}>
      {player.imageUrl ? (
        <Image source={{ uri: player.imageUrl }} style={styles.photo} />
      ) : (
        <View style={styles.placeholder}>
          <MaterialCommunityIcons name="account" size={34} color={colors.muted} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.number}>#{player.number} · {player.role}</Text>
        <Text style={styles.name}>{player.name}</Text>
        <Text style={styles.meta}>{player.age ? `${player.age} anni · ` : ''}{player.appearances} presenze · {player.goals} gol</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  photo: { width: 68, height: 68, borderRadius: 16, backgroundColor: colors.sky },
  placeholder: { width: 68, height: 68, borderRadius: 16, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  number: { color: colors.blue, fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
  name: { color: colors.ink, fontSize: 18, fontWeight: '900', marginTop: 2 },
  meta: { color: colors.muted, marginTop: 4 },
});
