import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '../theme';
import { SeasonMatch } from '../types';
import { TeamLogo } from './TeamLogo';

const statusLabel = (status: SeasonMatch['status']) => {
  if (status === 'final') return 'Partita conclusa';
  if (status === 'live') return 'In corso';
  return 'Da disputare';
};

export function MatchDetailModal({ match, onClose }: { match: SeasonMatch | null; onClose: () => void }) {
  const hasResult = match?.homeScore != null && match?.awayScore != null;
  return <Modal visible={!!match} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <SafeAreaView style={styles.safe}>{match ? <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <Pressable accessibilityLabel="Chiudi tabellino" onPress={onClose} style={styles.close}><MaterialCommunityIcons name="close" size={24} color={colors.ink} /></Pressable>
      </View>

      <View style={styles.eyebrowRow}>
        <Text style={styles.eyebrow}>{(match.competition ?? 'Campionato').toUpperCase()}</Text>
        {match.roundLabel ? <Text style={styles.eyebrowDim}>· {match.roundLabel}</Text> : null}
      </View>

      <View style={styles.hero}>
        <View style={styles.teamColumn}>
          <TeamLogo name={match.home} size={64} />
          <Text style={styles.teamName} numberOfLines={2}>{match.home}</Text>
        </View>

        <View style={styles.scoreColumn}>
          {hasResult ? (
            <Text style={styles.score}>{match.homeScore} - {match.awayScore}</Text>
          ) : (
            <Text style={styles.vs}>VS</Text>
          )}
          {match.time ? <Text style={styles.time}>{match.time}</Text> : null}
        </View>

        <View style={styles.teamColumn}>
          <TeamLogo name={match.away} size={64} />
          <Text style={styles.teamName} numberOfLines={2}>{match.away}</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.row}>
          <MaterialCommunityIcons name="flag-checkered" size={18} color={colors.muted} />
          <Text style={styles.rowText}>{statusLabel(match.status)}</Text>
        </View>
        {match.dateLabel ? (
          <View style={styles.row}>
            <MaterialCommunityIcons name="calendar-outline" size={18} color={colors.muted} />
            <Text style={styles.rowText}>{match.dateLabel}{match.time ? ` · ${match.time}` : ''}</Text>
          </View>
        ) : null}
        {match.venue ? (
          <View style={styles.row}>
            <MaterialCommunityIcons name="stadium-outline" size={18} color={colors.muted} />
            <Text style={styles.rowText}>{match.venue}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView> : null}</SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvasRaised },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 18, paddingBottom: 48, gap: 16 },
  top: { flexDirection: 'row', justifyContent: 'flex-end' },
  close: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  eyebrow: { color: colors.accentStrong, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  eyebrowDim: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  hero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: radii.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, gap: 8 },
  teamColumn: { flex: 1, alignItems: 'center', gap: 8 },
  teamName: { color: colors.ink, fontSize: 14, fontWeight: '900', textAlign: 'center' },
  scoreColumn: { alignItems: 'center', minWidth: 72 },
  score: { color: colors.ink, fontSize: 30, fontWeight: '900' },
  vs: { color: colors.muted, fontSize: 20, fontWeight: '900' },
  time: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 4 },
  panel: { padding: 18, borderRadius: radii.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { color: colors.ink, fontSize: 14, fontWeight: '700', flex: 1 },
});
