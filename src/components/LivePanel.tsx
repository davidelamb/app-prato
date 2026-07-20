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
      <LinearGradient colors={[colors.navy, '#0D2D50', '#145B8B']} style={[styles.scoreCard, compact && styles.scoreCompact]}>
        <View style={styles.blueRule} />
        <View style={styles.topRow}><View><Text style={styles.competition}>{fixture.competition}</Text><Text style={styles.matchday}>{fixture.matchday}</Text></View><View style={[styles.livePill, fixture.status !== 'live' && styles.neutralPill]}><View style={[styles.liveDot, fixture.status !== 'live' && styles.neutralDot]} /><Text style={styles.liveText}>{phase}</Text></View></View>
        <View style={styles.scoreRow}>
          <View style={styles.teamBlock}><View style={styles.teamMark}><Text style={styles.teamMarkText}>{fixture.home.slice(0, 1)}</Text></View><Text numberOfLines={2} style={styles.team}>{fixture.home}</Text></View>
          <View style={styles.centerScore}><Text style={styles.statusLabel}>{fixture.status === 'live' ? 'LIVE' : 'MATCH'}</Text><Text style={[styles.score, compact && styles.scoreCompactText]}>{fixture.homeScore ?? 0}<Text style={styles.dash}> - </Text>{fixture.awayScore ?? 0}</Text><Text style={styles.venue}>{fixture.venue}</Text></View>
          <View style={[styles.teamBlock, styles.teamBlockAway]}><View style={styles.opponentMark}><Text style={styles.opponentMarkText}>{fixture.away.slice(0, 1)}</Text></View><Text numberOfLines={2} style={[styles.team, styles.away]}>{fixture.away}</Text></View>
        </View>
      </LinearGradient>
      {!compact ? <View style={styles.timeline}>
        <View style={styles.timelineHeading}><View><Text style={styles.timelineEyebrow}>DIRETTA</Text><Text style={styles.timelineTitle}>Cronaca della partita</Text></View><Text style={styles.timelineCount}>{events.length} eventi</Text></View>
        {events.length ? events.map((event) => (
          <View key={event.id} style={styles.event}>
            <View style={[styles.icon, event.type === 'goal' && styles.goalIcon]}><MaterialCommunityIcons name={icons[event.type]} size={19} color={event.type === 'goal' ? colors.paper : colors.accentStrong} /></View>
            <View style={styles.eventBody}><Text style={styles.eventTitle}>{event.label}</Text>{event.scorer ? <Text style={styles.scorer}>{event.scorer}</Text> : null}{event.score ? <Text style={styles.eventScore}>{event.score}</Text> : null}</View>
            <Text style={styles.minute}>{event.minute ? `${event.minute}'` : ''}</Text>
          </View>
        )) : <View style={styles.empty}><MaterialCommunityIcons name="broadcast-off" size={28} color={colors.mutedDark} /><Text style={styles.emptyText}>La cronaca inizierà con il calcio d'inizio.</Text></View>}
      </View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 18 },
  scoreCard: { overflow: 'hidden', padding: 22, borderRadius: radii.lg, shadowColor: colors.shadow, shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  blueRule: { position: 'absolute', left: 0, right: 0, top: 0, height: 4, backgroundColor: colors.accent },
  scoreCompact: { padding: 18 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  competition: { color: colors.paper, fontWeight: '900', textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2 },
  matchday: { color: colors.accentSoft, marginTop: 5, fontSize: 11 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.xs, backgroundColor: colors.live },
  neutralPill: { backgroundColor: colors.accentStrong },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.paper },
  neutralDot: { backgroundColor: colors.paper },
  liveText: { color: colors.paper, fontSize: 10, fontWeight: '900' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginTop: 26 },
  teamBlock: { flex: 1, alignItems: 'flex-start' }, teamBlockAway: { alignItems: 'flex-end' },
  teamMark: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }, teamMarkText: { color: colors.navy, fontSize: 19, fontWeight: '900' },
  opponentMark: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper }, opponentMarkText: { color: colors.navy, fontSize: 19, fontWeight: '900' },
  team: { color: colors.paper, fontWeight: '900', fontSize: 14, marginTop: 9 }, away: { textAlign: 'right' },
  centerScore: { alignItems: 'center', paddingHorizontal: 8 }, statusLabel: { color: colors.accentSoft, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  score: { color: colors.paper, fontSize: 42, fontWeight: '900', letterSpacing: -1.5, marginTop: 2 }, scoreCompactText: { fontSize: 34 }, dash: { color: colors.accent },
  venue: { color: colors.accentSoft, fontSize: 10, marginTop: 5, maxWidth: 115, textAlign: 'center' },
  timeline: { gap: 10 }, timelineHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 5 }, timelineEyebrow: { color: colors.accentStrong, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, timelineTitle: { color: colors.ink, fontSize: 22, fontWeight: '900', marginTop: 3 }, timelineCount: { color: colors.muted, fontSize: 12 },
  event: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: radii.md, borderLeftWidth: 4, borderLeftColor: colors.accent, backgroundColor: colors.surface, shadowColor: colors.shadow, shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft }, goalIcon: { backgroundColor: colors.success }, eventBody: { flex: 1 }, eventTitle: { color: colors.ink, fontWeight: '900' }, scorer: { color: colors.inkSoft, marginTop: 3 }, eventScore: { color: colors.success, fontWeight: '900', marginTop: 3 }, minute: { color: colors.accentStrong, fontWeight: '900' },
  empty: { alignItems: 'center', padding: 28, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineSoft }, emptyText: { color: colors.muted, marginTop: 8, textAlign: 'center' },
});
