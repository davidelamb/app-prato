import { StyleSheet, Text, View } from 'react-native';
import { PlayerCard } from '../components/PlayerCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors } from '../theme';
import { AppContent, Player, PlayerRole } from '../types';

const roles: PlayerRole[] = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante'];
export function RosterScreen({ content, wide, onPlayer }: { content: AppContent; wide: boolean; onPlayer: (item: Player) => void }) {
  return <View style={styles.stack}><ScreenHeader eyebrow="CLUB" title="AC Prato 1908" copy="Rosa, protagonisti e identità biancazzurra." wide={wide} />{roles.map((role) => { const players = content.players.filter((item) => item.role === role); if (!players.length) return null; const title = role === 'Portiere' ? 'Portieri' : role === 'Difensore' ? 'Difensori' : role === 'Centrocampista' ? 'Centrocampisti' : 'Attaccanti'; return <View key={role} style={styles.section}><View style={styles.heading}><Text style={styles.role}>{title}</Text><Text style={styles.count}>{players.length}</Text></View><View style={[styles.grid, wide && styles.gridWide]}>{players.map((player) => <PlayerCard key={player.id} player={player} onPress={() => onPlayer(player)} style={wide ? styles.half : undefined} />)}</View></View>; })}</View>;
}
const styles = StyleSheet.create({ stack: { gap: 16 }, section: { gap: 10 }, heading: { flexDirection: 'row', alignItems: 'center', gap: 8 }, role: { color: colors.ink, fontSize: 22, fontWeight: '900' }, count: { minWidth: 28, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 14, color: colors.paper, backgroundColor: colors.accentStrong, textAlign: 'center', fontSize: 11, fontWeight: '900', overflow: 'hidden' }, grid: { gap: 10 }, gridWide: { flexDirection: 'row', flexWrap: 'wrap' }, half: { width: '49%' } });
