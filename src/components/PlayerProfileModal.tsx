import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '../theme';
import { Player } from '../types';
import { playerImageStyle } from '../utils/player-image';

function Stat({ value, label }: { value: string | number; label: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function Detail({ icon, label, value }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.detail}>
      <View style={styles.detailIcon}><MaterialCommunityIcons name={icon} size={19} color={colors.accentStrong} /></View>
      <View style={styles.detailBody}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>
    </View>
  );
}

export function PlayerProfileModal({ player, onClose }: { player: Player | null; onClose: () => void }) {
  return (
    <Modal visible={!!player} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        {player ? (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.topBar}>
              <Pressable onPress={onClose} style={styles.back}><MaterialCommunityIcons name="chevron-left" size={30} color={colors.ink} /></Pressable>
              <View style={styles.topBrand}><Image source={require('../../assets/ac-prato-crest.png')} resizeMode="cover" style={styles.topLogo} /><Text style={styles.topTitle}>APPrato</Text></View>
              <View style={styles.topSpacer} />
            </View>

            <View style={styles.hero}>
              <View style={styles.heroImageWrap}>
                {player.imageUrl ? <Image source={{ uri: player.imageUrl }} resizeMode="cover" style={[styles.heroImage, playerImageStyle(player)]} /> : <View style={styles.heroPlaceholder}><Image source={require('../../assets/ac-prato-crest.png')} resizeMode="cover" style={styles.heroPlaceholderLogo} /></View>}
                <View style={styles.numberBadge}><Text style={styles.numberText}>{player.number ? `#${player.number}` : 'AC'}</Text></View>
              </View>
              <View style={styles.heroBody}>
                <Text style={styles.role}>{player.role}</Text>
                <Text style={styles.name}>{player.name}</Text>
                <Text style={styles.subline}>{player.nationality ?? 'Italia'}{player.age ? ` · ${player.age} anni` : ''}</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <Stat value={player.appearances} label="Presenze" />
              <Stat value={player.goals} label="Gol" />
              <Stat value={player.assists ?? 0} label="Assist" />
              <Stat value={player.minutes ?? 0} label="Minuti" />
            </View>

            {player.bio ? <View style={styles.sectionCard}><Text style={styles.sectionEyebrow}>PROFILO</Text><Text style={styles.sectionTitle}>Il giocatore</Text><Text style={styles.bio}>{player.bio}</Text></View> : null}

            <View style={styles.sectionCard}>
              <Text style={styles.sectionEyebrow}>DATI PERSONALI</Text>
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
              <View><Text style={styles.marketLabel}>VALORE INDICATIVO</Text><Text style={styles.marketValue}>{player.marketValue ?? 'Non disponibile'}</Text></View>
              <View style={styles.marketIcon}><MaterialCommunityIcons name="chart-line" size={28} color={colors.accentStrong} /></View>
            </View>
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvasRaised },
  content: { paddingBottom: 44 },
  topBar: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, backgroundColor: colors.paper, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  topBrand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  topLogo: { width: 38, height: 38, borderRadius: 11 },
  topTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  topSpacer: { width: 42 },
  hero: { margin: 16, overflow: 'hidden', borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  heroImageWrap: { height: 360, overflow: 'hidden', backgroundColor: colors.surfaceSoft },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderLogo: { width: 120, height: 120, borderRadius: 34, opacity: 0.7 },
  numberBadge: { position: 'absolute', left: 16, bottom: 16, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.sm, backgroundColor: colors.navy },
  numberText: { color: colors.paper, fontSize: 14, fontWeight: '900' },
  heroBody: { padding: 20 },
  role: { color: colors.accentStrong, fontSize: 11, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
  name: { color: colors.ink, fontSize: 31, lineHeight: 36, fontWeight: '900', letterSpacing: -0.6, marginTop: 5 },
  subline: { color: colors.muted, fontSize: 14, marginTop: 7 },
  statsGrid: { flexDirection: 'row', marginHorizontal: 16, overflow: 'hidden', borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 17, borderRightWidth: 1, borderRightColor: colors.lineSoft },
  statValue: { color: colors.ink, fontSize: 21, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', marginTop: 3 },
  sectionCard: { marginHorizontal: 16, marginTop: 16, padding: 18, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  sectionEyebrow: { color: colors.yellow, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  sectionTitle: { color: colors.ink, fontSize: 22, fontWeight: '900', marginTop: 4 },
  bio: { color: colors.inkSoft, fontSize: 15, lineHeight: 23, marginTop: 10 },
  detailsGrid: { gap: 10, marginTop: 14 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: radii.md, backgroundColor: colors.canvasRaised, borderWidth: 1, borderColor: colors.lineSoft },
  detailIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  detailBody: { flex: 1 },
  detailLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  detailValue: { color: colors.ink, fontSize: 15, fontWeight: '900', marginTop: 2 },
  marketCard: { margin: 16, padding: 18, borderRadius: radii.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.yellowSoft, borderWidth: 1, borderColor: colors.yellow },
  marketLabel: { color: colors.accentStrong, fontSize: 10, fontWeight: '900', letterSpacing: 0.9 },
  marketValue: { color: colors.ink, fontSize: 24, fontWeight: '900', marginTop: 4 },
  marketIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
});
