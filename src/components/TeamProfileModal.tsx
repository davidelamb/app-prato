import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Linking, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '../theme';
import { Team } from '../types';
import { TeamLogo } from './TeamLogo';

export function TeamProfileModal({ team, onClose }: { team: Team | null; onClose: () => void }) {
  const players = [...(team?.players ?? [])].sort((a, b) => (a.number ?? Number.MAX_SAFE_INTEGER) - (b.number ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name, 'it'));
  return <Modal visible={!!team} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <SafeAreaView style={styles.safe}>{team ? <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <Pressable accessibilityLabel="Chiudi scheda squadra" onPress={onClose} style={styles.close}><MaterialCommunityIcons name="close" size={24} color={colors.ink} /></Pressable>
      </View>
      <View style={styles.hero}>
        <TeamLogo name={team.name} size={92} style={styles.logo} />
        <Text style={styles.title}>{team.name}</Text>
        {team.stadium ? <View style={styles.metaRow}><MaterialCommunityIcons name="stadium-outline" size={17} color={colors.muted} /><Text style={styles.meta}>{team.stadium}</Text></View> : null}
        {team.coach ? <View style={styles.metaRow}><MaterialCommunityIcons name="account-tie-outline" size={17} color={colors.muted} /><Text style={styles.meta}>Allenatore: {team.coach}</Text></View> : null}
      </View>
      <View style={styles.panel}>
        <Text style={styles.eyebrow}>ROSA</Text>
        {players.length ? players.map((player) => <View key={player.id} style={styles.playerRow}>
          <View style={styles.avatar}>
            {player.imageUrl ? <Image source={{ uri: player.imageUrl }} style={styles.avatarImage} resizeMode="cover" /> : <MaterialCommunityIcons name="account-outline" size={22} color={colors.muted} />}
          </View>
          <Text style={styles.number}>{player.number ?? '—'}</Text>
          <View style={styles.playerBody}><Text style={styles.playerName}>{player.name}</Text><Text style={styles.playerMeta}>{[player.role, player.nationality].filter(Boolean).join(' · ')}</Text></View>
        </View>) : <View style={styles.empty}><MaterialCommunityIcons name="account-group-outline" size={34} color={colors.mutedDark} /><Text style={styles.emptyText}>Rosa non ancora disponibile</Text></View>}
      </View>
      {team.sourceUrl ? <Pressable onPress={() => void Linking.openURL(team.sourceUrl!)} style={styles.source}><MaterialCommunityIcons name="open-in-new" size={19} color={colors.accentStrong} /><Text style={styles.sourceText}>Apri la fonte della squadra</Text></Pressable> : null}
    </ScrollView> : null}</SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvasRaised },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 18, paddingBottom: 48, gap: 16 },
  top: { flexDirection: 'row', justifyContent: 'flex-end' },
  close: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  hero: { alignItems: 'center', padding: 24, borderRadius: radii.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  logo: { marginBottom: 13 },
  title: { color: colors.ink, fontSize: 29, lineHeight: 34, fontWeight: '900', textAlign: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 9 },
  meta: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  panel: { padding: 18, borderRadius: radii.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  eyebrow: { color: colors.accentStrong, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  playerRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  avatar: { width: 38, height: 38, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  avatarImage: { width: '100%', height: '100%' },
  number: { width: 28, color: colors.accentStrong, textAlign: 'center', fontWeight: '900' },
  playerBody: { flex: 1 },
  playerName: { color: colors.ink, fontWeight: '900' },
  playerMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  empty: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { color: colors.muted, fontWeight: '800', marginTop: 9 },
  source: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radii.md, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  sourceText: { color: colors.accentStrong, fontWeight: '900' },
});
