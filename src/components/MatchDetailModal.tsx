import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '../theme';
import { LiveEvent, MatchLineup, Player, SeasonMatch } from '../types';
import { sortLiveEvents } from '../utils/live-match';
import { displayTeamName } from '../utils/team-names';
import { TeamLogo } from './TeamLogo';

const eventIcon = (type: LiveEvent['type']): React.ComponentProps<typeof MaterialCommunityIcons>['name'] => {
  if (type === 'goal') return 'soccer';
  if (type === 'substitution') return 'swap-horizontal';
  if (type === 'yellow_card' || type === 'red_card') return 'card';
  return 'circle-medium';
};

const eventColor = (type: LiveEvent['type']) => {
  if (type === 'goal') return colors.success;
  if (type === 'yellow_card') return colors.yellow;
  if (type === 'red_card') return colors.live;
  return colors.accentStrong;
};

const statusLabel = (status: SeasonMatch['status']) => {
  if (status === 'final') return 'Partita conclusa';
  if (status === 'live') return 'In corso';
  return 'Da disputare';
};

export function MatchDetailModal({ match, players, onClose }: { match: SeasonMatch | null; players?: Player[]; onClose: () => void }) {
  const hasResult = match?.homeScore != null && match?.awayScore != null;
  const events = match?.liveEvents?.length ? sortLiveEvents(match.liveEvents) : [];
  const playerName = (playerId: string) => players?.find((p) => p.id === playerId)?.name ?? playerId;
  const lineupBlock = (label: string, lineup?: MatchLineup) => {
    if (!lineup || (!lineup.starters.length && !lineup.substitutes.length)) return null;
    return (
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{label}{lineup.formation ? ` · ${lineup.formation}` : ''}</Text>
        {lineup.starters.length ? (
          <View style={{ gap: 4 }}>
            <Text style={styles.lineupSubhead}>Titolari</Text>
            {lineup.starters.map((item) => <Text key={item.playerId} style={styles.rowText}>{playerName(item.playerId)}</Text>)}
          </View>
        ) : null}
        {lineup.substitutes.length ? (
          <View style={{ gap: 4, marginTop: 8 }}>
            <Text style={styles.lineupSubhead}>Panchina</Text>
            {lineup.substitutes.map((item) => <Text key={item.playerId} style={styles.rowText}>{playerName(item.playerId)}</Text>)}
          </View>
        ) : null}
      </View>
    );
  };

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
          <Text style={styles.teamName} numberOfLines={2}>{displayTeamName(match.home)}</Text>
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
          <Text style={styles.teamName} numberOfLines={2}>{displayTeamName(match.away)}</Text>
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

      {events.length ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Tabellino</Text>
          <View style={{ gap: 10 }}>
            {events.filter((event) => event.type !== 'kickoff' && event.type !== 'halftime' && event.type !== 'second_half' && event.type !== 'fulltime').map((event) => (
              <View key={event.id} style={styles.eventRow}>
                <MaterialCommunityIcons name={eventIcon(event.type)} size={18} color={eventColor(event.type)} />
                <Text style={styles.eventMinute}>{event.minuteLabel ?? ''}</Text>
                <Text style={styles.rowText}>{event.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {lineupBlock(match.home, match.homeLineup)}
      {lineupBlock(match.away, match.awayLineup)}
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
  panelTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  lineupSubhead: { color: colors.muted, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eventMinute: { color: colors.muted, fontSize: 12, fontWeight: '900', minWidth: 34 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { color: colors.ink, fontSize: 14, fontWeight: '700', flex: 1 },
});
