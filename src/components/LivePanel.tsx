import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '../theme';
import { Fixture, LiveEvent } from '../types';
import { TeamBadge } from './TeamBadge';

const icons: Record<LiveEvent['type'], React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  kickoff: 'information-outline',
  halftime: 'pause',
  second_half: 'play',
  goal: 'soccer',
  chance: 'alert-circle-outline',
  yellow_card: 'card-outline',
  substitution: 'swap-horizontal',
  fulltime: 'flag-checkered',
};

const eventColors: Partial<Record<LiveEvent['type'], string>> = {
  goal: colors.success,
  chance: colors.accentStrong,
  yellow_card: colors.yellow,
  substitution: colors.accent,
};

function phaseLabel(fixture: Fixture) {
  if (fixture.livePhase === 'halftime') return 'INTERVALLO';
  if (fixture.livePhase === 'finished' || fixture.status === 'final') return 'FINALE';
  if (fixture.livePhase === 'second_half') return '2° TEMPO';
  if (fixture.livePhase === 'first_half') return fixture.minute ? `${fixture.minute}'` : '1° TEMPO';
  return fixture.dateLabel;
}

export function LivePanel({ fixture, compact = false }: { fixture: Fixture; compact?: boolean }) {
  const events = [...(fixture.liveEvents ?? [])].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
  const isLive = fixture.status === 'live';

  if (compact) {
    return (
      <View style={styles.compactCard}>
        <View style={styles.compactTop}>
          <View style={styles.liveLabelRow}>
            <View style={[styles.liveDot, !isLive && styles.liveDotNeutral]} />
            <Text style={styles.liveLabel}>{isLive ? 'LIVE' : 'MATCH'}</Text>
          </View>
          <Text style={styles.compactCompetition}>{fixture.competition}</Text>
        </View>
        <Text style={styles.compactEyebrow}>{isLive ? 'Diretta partita' : fixture.matchday}</Text>
        <Text style={styles.compactScore}>{fixture.home} {fixture.homeScore ?? 0}-{fixture.awayScore ?? 0} {fixture.away}</Text>
        <Text style={styles.compactMeta}>{phaseLabel(fixture)} · {fixture.venue}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.scoreShell}>
        <View style={styles.scoreHeader}>
          <View>
            <Text style={styles.competition}>{fixture.competition}</Text>
            <Text style={styles.matchday}>{fixture.matchday}</Text>
          </View>
          <View style={[styles.phasePill, !isLive && styles.phasePillNeutral]}>
            <View style={[styles.phaseDot, !isLive && styles.phaseDotNeutral]} />
            <Text style={styles.phaseText}>{phaseLabel(fixture)}</Text>
          </View>
        </View>

        <View style={styles.scoreBoard}>
          <View style={styles.teamBlock}>
            <TeamBadge name={fixture.home} size={54} />
            <Text numberOfLines={2} style={styles.teamName}>{fixture.home}</Text>
          </View>
          <View style={styles.centerScore}>
            <Text style={styles.score}>{fixture.homeScore ?? 0}</Text>
            <Text style={styles.scoreDash}>–</Text>
            <Text style={styles.score}>{fixture.awayScore ?? 0}</Text>
          </View>
          <View style={[styles.teamBlock, styles.teamBlockRight]}>
            <TeamBadge name={fixture.away} size={54} />
            <Text numberOfLines={2} style={[styles.teamName, styles.teamNameRight]}>{fixture.away}</Text>
          </View>
        </View>
        <Text style={styles.venue}>{fixture.venue}</Text>
      </View>

      <View style={styles.timelineCard}>
        <View style={styles.timelineHeader}>
          <View style={styles.timelineHeading}>
            <Text style={styles.timelineEyebrow}>DIRETTA</Text>
            <Text style={styles.timelineTitle}>Cronaca minuto per minuto</Text>
          </View>
          <Text style={styles.timelineCount}>{events.length} eventi</Text>
        </View>

        {events.length ? events.map((event) => (
          <View key={event.id} style={styles.eventRow}>
            <View style={styles.minuteBox}><Text style={styles.minute}>{event.minute ? `${event.minute}'` : '—'}</Text></View>
            <View style={[styles.iconBox, event.type === 'goal' && styles.goalIconBox, event.type === 'yellow_card' && styles.cardIconBox]}>
              <MaterialCommunityIcons name={icons[event.type]} size={22} color={eventColors[event.type] ?? colors.accentStrong} />
            </View>
            <View style={styles.eventBody}>
              <Text style={styles.eventTitle}>{event.label}</Text>
              {event.scorer ? <Text style={styles.eventCopy}>{event.scorer}</Text> : null}
              {event.score ? <Text style={styles.scorePill}>{event.score}</Text> : null}
            </View>
          </View>
        )) : (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="broadcast-off" size={34} color={colors.mutedDark} />
            <Text style={styles.emptyTitle}>Cronaca non ancora iniziata</Text>
            <Text style={styles.emptyCopy}>Gli eventi compariranno qui durante la partita.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  compactCard: { padding: 20, borderRadius: radii.lg, backgroundColor: colors.accentStrong, borderWidth: 1, borderColor: colors.accentStrong },
  compactTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  liveLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.live },
  liveDotNeutral: { backgroundColor: colors.yellow },
  liveLabel: { color: colors.yellow, fontSize: 13, fontWeight: '900', letterSpacing: 1.1 },
  compactCompetition: { color: '#CFE8F7', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  compactEyebrow: { color: colors.paper, fontSize: 18, fontWeight: '900', marginTop: 18 },
  compactScore: { color: colors.paper, fontSize: 29, lineHeight: 35, fontWeight: '900', letterSpacing: -0.5, marginTop: 9 },
  compactMeta: { color: '#D5E7F2', fontSize: 15, fontWeight: '800', marginTop: 10 },
  scoreShell: { overflow: 'hidden', borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  scoreHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: 18, backgroundColor: colors.navy },
  competition: { color: colors.paper, fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  matchday: { color: '#AFC6D7', fontSize: 11, marginTop: 4 },
  phasePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: radii.pill, backgroundColor: '#263D4F' },
  phasePillNeutral: { backgroundColor: '#31495B' },
  phaseDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.live },
  phaseDotNeutral: { backgroundColor: colors.yellow },
  phaseText: { color: colors.paper, fontSize: 10, fontWeight: '900' },
  scoreBoard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 24 },
  teamBlock: { flex: 1, alignItems: 'flex-start' },
  teamBlockRight: { alignItems: 'flex-end' },
  teamName: { color: colors.ink, fontSize: 14, lineHeight: 18, fontWeight: '900', marginTop: 8 },
  teamNameRight: { textAlign: 'right' },
  centerScore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 8 },
  score: { color: colors.ink, fontSize: 40, fontWeight: '900' },
  scoreDash: { color: colors.mutedDark, fontSize: 28, fontWeight: '700' },
  venue: { color: colors.muted, textAlign: 'center', fontSize: 11, paddingVertical: 18 },
  timelineCard: { padding: 16, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  timelineHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 },
  timelineHeading: { flex: 1, minWidth: 0 },
  timelineEyebrow: { color: colors.yellow, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  timelineTitle: { color: colors.ink, fontSize: 23, lineHeight: 28, fontWeight: '900', marginTop: 4 },
  timelineCount: { width: 48, color: colors.muted, fontSize: 10, lineHeight: 14, textAlign: 'right' },
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  minuteBox: { width: 58, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm, backgroundColor: colors.yellowSoft },
  minute: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  goalIconBox: { backgroundColor: colors.successSoft },
  cardIconBox: { backgroundColor: colors.yellowSoft },
  eventBody: { flex: 1, paddingTop: 2 },
  eventTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  eventCopy: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 4 },
  scorePill: { alignSelf: 'flex-start', color: colors.paper, fontSize: 13, fontWeight: '900', marginTop: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.sm, overflow: 'hidden', backgroundColor: colors.accentStrong },
  empty: { alignItems: 'center', paddingVertical: 34 },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', marginTop: 10 },
  emptyCopy: { color: colors.muted, textAlign: 'center', marginTop: 5 },
});
