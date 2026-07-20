import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '../theme';
import { Fixture, LiveEvent } from '../types';

const icons: Record<LiveEvent['type'], React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  kickoff: 'play', halftime: 'pause', second_half: 'play', goal: 'soccer', fulltime: 'flag-checkered',
};

export function LivePanel({ fixture, compact = false }: { fixture: Fixture; compact?: boolean }) {
  const phase = fixture.livePhase === 'halftime' ? 'INTERVALLO' : fixture.livePhase === 'finished' ? 'FINALE' : fixture.livePhase === 'second_half' ? '2° TEMPO' : fixture.livePhase === 'first_half' ? '1° TEMPO' : fixture.dateLabel;
  const events = fixture.liveEvents ?? [];
  return (
    <View style={styles.wrap}>
      <LinearGradient colors={['#153F61', '#0B2338', '#071827']} style={[styles.scoreCard, compact && styles.scoreCompact]}>
        <View style={styles.topRow}><Text style={styles.competition}>{fixture.competition}</Text><View style={[styles.livePill, fixture.status !== 'live' && styles.neutralPill]}><View style={[styles.liveDot, fixture.status !== 'live' && styles.neutralDot]} /><Text style={styles.liveText}>{phase}</Text></View></View>
        <Text style={styles.matchday}>{fixture.matchday}</Text>
        <View style={styles.scoreRow}>
          <View style={styles.teamBlock}><View style={styles.teamMark}><Text style={styles.teamMarkText}>{fixture.home.slice(0, 1)}</Text></View><Text numberOfLines={2} style={styles.team}>{fixture.home}</Text></View>
          <View style={styles.centerScore}><Text style={[styles.score, compact && styles.scoreCompactText]}>{fixture.homeScore ?? 0}<Text style={styles.dash}> : </Text>{fixture.awayScore ?? 0}</Text><Text style={styles.venue}>{fixture.venue}</Text></View>
          <View style={[styles.teamBlock, styles.teamBlockAway]}><View style={styles.opponentMark}><Text style={styles.opponentMarkText}>{fixture.away.slice(0, 1)}</Text></View><Text numberOfLines={2} style={[styles.team, styles.away]}>{fixture.away}</Text></View>
        </View>
      </LinearGradient>
      {!compact ? <View style={styles.timeline}>
        <View style={styles.timelineHeading}><Text style={styles.timelineTitle}>Cronaca</Text><Text style={styles.timelineCount}>{events.length} eventi</Text></View>
        {events.length ? events.map((event) => (
          <View key={event.id} style={styles.event}>
            <View style={[styles.icon, event.type === 'goal' && styles.goalIcon]}><MaterialCommunityIcons name={icons[event.type]} size={19} color={event.type === 'goal' ? colors.canvas : colors.accent} /></View>
            <View style={styles.eventBody}><Text style={styles.eventTitle}>{event.label}</Text>{event.scorer ? <Text style={styles.scorer}>{event.scorer}</Text> : null}{event.score ? <Text style={styles.eventScore}>{event.score}</Text> : null}</View>
            <Text style={styles.minute}>{event.minute ? `${event.minute}'` : ''}</Text>
          </View>
        )) : <View style={styles.empty}><MaterialCommunityIcons name="broadcast-off" size={28} color={colors.mutedDark} /><Text style={styles.emptyText}>La cronaca inizierà con il calcio d'inizio.</Text></View>}
      </View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  scoreCard: { padding: 20, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.line },
  scoreCompact: { padding: 17 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  competition: { flex: 1, color: colors.accentSoft, fontWeight: '900', textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 },
  matchday: { color: colors.muted, marginTop: 5, fontSize: 12 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: colors.liveSoft },
  neutralPill: { backgroundColor: colors.surfaceSoft },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.live },
  neutralDot: { backgroundColor: colors.accent },
  liveText: { color: colors.paper, fontSize: 10, fontWeight: '900' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
  teamBlock: { flex: 1, alignItems: 'flex-start' },
  teamBlockAway: { alignItems: 'flex-end' },
  teamMark: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentStrong },
  teamMarkText: { color: colors.paper, fontSize: 18, fontWeight: '900' },
  opponentMark: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.line },
  opponentMarkText: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  team: { color: colors.paper, fontWeight: '900', fontSize: 14, marginTop: 8 },
  away: { textAlign: 'right' },
  centerScore: { alignItems: 'center', paddingHorizontal: 8 },
  score: { color: colors.paper, fontSize: 38, fontWeight: '900', letterSpacing: -1 },
  scoreCompactText: { fontSize: 32 },
  dash: { color: colors.muted },
  venue: { color: colors.muted, fontSize: 10, marginTop: 5, maxWidth: 105, textAlign: 'center' },
  timeline: { gap: 10 },
  timelineHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  timelineTitle: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  timelineCount: { color: colors.muted, fontSize: 12 },
  event: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radii.md, borderWidth: 1, borderColor: colors.lineSoft, backgroundColor: colors.surface },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  goalIcon: { backgroundColor: colors.success },
  eventBody: { flex: 1 },
  eventTitle: { color: colors.ink, fontWeight: '900' },
  scorer: { color: colors.inkSoft, marginTop: 3 },
  eventScore: { color: colors.success, fontWeight: '900', marginTop: 3 },
  minute: { color: colors.accent, fontWeight: '900' },
  empty: { alignItems: 'center', padding: 28, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineSoft },
  emptyText: { color: colors.muted, marginTop: 8, textAlign: 'center' },
});
