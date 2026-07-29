import { StyleSheet, Text, View } from 'react-native';
import { PlayerCard } from '../components/PlayerCard';
import { colors } from '../theme';
import { AppContent, Player, PlayerRole } from '../types';
import { displayPlayerName } from '../utils/player-name';

const roles: PlayerRole[] = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante'];
export function RosterScreen({ content, wide, onPlayer }: { content: AppContent; wide: boolean; onPlayer: (item: Player) => void }) {
  const players = [...content.players].sort((a, b) => {
    const roleOrder = roles.indexOf(a.role) - roles.indexOf(b.role);
    return roleOrder || displayPlayerName(a.name).localeCompare(displayPlayerName(b.name), 'it');
  });

  return (
    <View style={styles.stack}>
      <View>
        <Text style={styles.eyebrow}>CLUB</Text>
        <Text style={styles.title}>AC Prato 1908</Text>
        <Text style={styles.copy}>Rosa, protagonisti e identità biancazzurra.</Text>
      </View>
      <View style={styles.heading}>
        <Text style={styles.rosterTitle}>Rosa</Text>
        <Text style={styles.count}>{players.length}</Text>
      </View>
      <View style={[styles.grid, wide && styles.gridWide]}>
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} onPress={() => onPlayer(player)} style={wide ? styles.half : undefined} />
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  stack: { gap: 14 },
  eyebrow: { color: colors.yellow, fontSize: 11, fontWeight: '900' },
  title: { color: colors.ink, fontSize: 37, fontWeight: '900', marginTop: 4 },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 8 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  rosterTitle: { color: colors.ink, fontSize: 21, fontWeight: '900' },
  count: { minWidth: 26, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 13, color: colors.paper, backgroundColor: colors.accentStrong, textAlign: 'center', fontSize: 10, fontWeight: '900', overflow: 'hidden' },
  grid: { gap: 8 },
  gridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  half: { width: '49%' },
});
