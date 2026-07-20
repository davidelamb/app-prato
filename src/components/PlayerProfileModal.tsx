import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '../theme';
import { Player } from '../types';

function Stat({ value, label }: { value: string | number; label: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function Detail({ icon, label, value }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; label: string; value?: string }) {
  if (!value) return null;
  return <View style={styles.detail}><View style={styles.detailIcon}><MaterialCommunityIcons name={icon} size={18} color={colors.accent} /></View><View><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View></View>;
}

export function PlayerProfileModal({ player, onClose }: { player: Player | null; onClose: () => void }) {
  return (
    <Modal visible={!!player} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        {player ? (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.hero}>
              <LinearGradient colors={['#123A5B', '#071827', '#06111F']} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.watermark}>{player.number ?? 'AC'}</Text>
              {player.imageUrl ? <Image source={{ uri: player.imageUrl }} resizeMode="cover" style={styles.heroImage} /> : <View style={styles.heroPlaceholder}><MaterialCommunityIcons name="account" size={110} color={colors.mutedDark} /></View>}
              <Pressable accessibilityLabel="Chiudi profilo" onPress={onClose} style={styles.close}><MaterialCommunityIcons name="close" size={23} color={colors.paper} /></Pressable>
              <View style={styles.heroText}>
                <Text style={styles.role}>{player.role}</Text>
                <Text style={styles.name}>{player.name}</Text>
                <Text style={styles.subline}>{player.number ? `Maglia #${player.number}` : 'AC Prato'}{player.nationality ? ` · ${player.nationality}` : ''}</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <Stat value={player.appearances} label="Presenze" />
              <Stat value={player.goals} label="Gol" />
              <Stat value={player.assists ?? 0} label="Assist" />
              <Stat value={player.minutes ?? 0} label="Minuti" />
            </View>

            {player.bio ? <View style={styles.section}><Text style={styles.sectionTitle}>Profilo</Text><Text style={styles.bio}>{player.bio}</Text></View> : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informazioni</Text>
              <View style={styles.detailsGrid}>
                <Detail icon="cake-variant-outline" label="Età" value={player.age ? `${player.age} anni` : undefined} />
                <Detail icon="calendar-outline" label="Data di nascita" value={player.birthDate} />
                <Detail icon="map-marker-outline" label="Luogo di nascita" value={player.birthplace} />
                <Detail icon="human-male-height" label="Altezza" value={player.height} />
                <Detail icon="shoe-cleat" label="Piede" value={player.foot} />
                <Detail icon="file-sign" label="Contratto" value={player.contractUntil ? `Fino al ${player.contractUntil}` : undefined} />
              </View>
            </View>

            <View style={styles.marketCard}>
              <View><Text style={styles.marketLabel}>Valore indicativo</Text><Text style={styles.marketValue}>{player.marketValue ?? 'Non disponibile'}</Text></View>
              <MaterialCommunityIcons name="chart-line" size={30} color={colors.accent} />
            </View>
            <Text style={styles.sourceNote}>Dati e immagini del prototipo possono provenire da fonti pubbliche esterne e dovranno essere sostituiti con materiale autorizzato prima della pubblicazione.</Text>
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingBottom: 40 },
  hero: { height: 430, overflow: 'hidden', justifyContent: 'flex-end' },
  watermark: { position: 'absolute', right: -4, top: 34, color: 'rgba(255,255,255,0.055)', fontSize: 190, lineHeight: 210, fontWeight: '900' },
  heroImage: { position: 'absolute', top: 26, alignSelf: 'center', width: 310, height: 330, borderRadius: radii.xl },
  heroPlaceholder: { position: 'absolute', top: 42, alignSelf: 'center', width: 280, height: 300, alignItems: 'center', justifyContent: 'center' },
  close: { position: 'absolute', right: 18, top: 16, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(4,17,29,0.7)', alignItems: 'center', justifyContent: 'center' },
  heroText: { paddingHorizontal: 22, paddingBottom: 24, paddingTop: 58, backgroundColor: 'rgba(3,13,23,0.62)' },
  role: { color: colors.accent, fontSize: 12, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' },
  name: { color: colors.paper, fontSize: 32, lineHeight: 36, fontWeight: '900', marginTop: 6 },
  subline: { color: colors.inkSoft, fontSize: 14, marginTop: 7 },
  statsGrid: { flexDirection: 'row', marginHorizontal: 16, paddingVertical: 18, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineSoft },
  stat: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.lineSoft },
  statValue: { color: colors.ink, fontSize: 22, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 10, textTransform: 'uppercase', marginTop: 3 },
  section: { marginHorizontal: 18, marginTop: 26 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  bio: { color: colors.inkSoft, fontSize: 15, lineHeight: 23, marginTop: 10 },
  detailsGrid: { gap: 10, marginTop: 12 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineSoft },
  detailIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  detailLabel: { color: colors.muted, fontSize: 11, textTransform: 'uppercase' },
  detailValue: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 2 },
  marketCard: { margin: 18, marginTop: 26, padding: 18, borderRadius: radii.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.line },
  marketLabel: { color: colors.muted, fontSize: 11, textTransform: 'uppercase' },
  marketValue: { color: colors.accentSoft, fontSize: 24, fontWeight: '900', marginTop: 3 },
  sourceNote: { color: colors.mutedDark, fontSize: 11, lineHeight: 16, marginHorizontal: 20 },
});
