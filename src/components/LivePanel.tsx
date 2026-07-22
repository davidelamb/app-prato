import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TeamLogo } from './TeamLogo';
import { colors, radii } from '../theme';
import { Fixture, LiveEvent, MatchLineup, Player } from '../types';
import { formatMatchClock, sortLiveEvents } from '../utils/live-match';

const icons: Record<LiveEvent['type'], React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  kickoff: 'information-outline',
  halftime: 'pause',
  second_half: 'play',
  goal: 'soccer',
  fulltime: 'flag-checkered',
};

function phaseLabel(fixture: Fixture, now: number) {
  if (fixture.livePhase === 'halftime') return 'INTERVALLO';
  if (fixture.livePhase === 'finished' || fixture.status === 'final') return 'FINALE';
  if (fixture.livePhase === 'second_half' || fixture.livePhase === 'first_half') return formatMatchClock(fixture, now);
  return fixture.dateLabel;
}

export function LivePanel({ fixture, players = [], compact = false }: { fixture: Fixture; players?: Player[]; compact?: boolean }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (fixture.livePhase !== 'first_half' && fixture.livePhase !== 'second_half') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [fixture.id, fixture.livePhase, fixture.phaseStartedAt]);
  const events = useMemo(() => sortLiveEvents(fixture.liveEvents ?? []), [fixture.liveEvents]);
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
        <View style={styles.compactTeamsRow}><TeamLogo name={fixture.home} size={28} style={{ borderRadius: 7 }} /><Text style={styles.compactScore}>{fixture.home} {fixture.homeScore ?? 0}–{fixture.awayScore ?? 0} {fixture.away}</Text><TeamLogo name={fixture.away} size={28} style={{ borderRadius: 7 }} /></View>
        <Text style={styles.compactMeta}>{phaseLabel(fixture, now)} · {fixture.venue}</Text>
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
            <Text style={styles.phaseText}>{phaseLabel(fixture, now)}</Text>
          </View>
        </View>

        <View style={styles.scoreBoard}>
          <View style={styles.teamBlock}>
            <TeamLogo name={fixture.home} size={54} />
            <Text numberOfLines={2} style={styles.teamName}>{fixture.home}</Text>
          </View>
          <View style={styles.centerScore}>
            <Text style={styles.score}>{fixture.homeScore ?? 0}</Text>
            <Text style={styles.scoreDash}>–</Text>
            <Text style={styles.score}>{fixture.awayScore ?? 0}</Text>
          </View>
          <View style={[styles.teamBlock, styles.teamBlockRight]}>
            <TeamLogo name={fixture.away} size={54} />
            <Text numberOfLines={2} style={[styles.teamName, styles.teamNameRight]}>{fixture.away}</Text>
          </View>
        </View>
        <Text style={styles.venue}>{fixture.venue}</Text>
      </View>

      {fixture.homeLineup || fixture.awayLineup ? <View style={styles.lineupsCard}>
        <Text style={styles.timelineEyebrow}>FORMAZIONI UFFICIALI</Text>
        {fixture.homeLineup ? <LineupBlock team={fixture.home} lineup={fixture.homeLineup} players={players} /> : null}
        {fixture.awayLineup ? <LineupBlock team={fixture.away} lineup={fixture.awayLineup} players={players} /> : null}
      </View> : null}

      <View style={styles.timelineCard}>
        <View style={styles.timelineHeader}>
          <View style={styles.timelineTitleBlock}>
            <Text style={styles.timelineEyebrow}>DIRETTA</Text>
            <Text style={styles.timelineTitle}>Cronaca minuto per minuto</Text>
          </View>
          <Text style={styles.timelineCount}>{events.length} eventi</Text>
        </View>

        {events.length ? events.map((event) => (
          <View key={event.id} style={styles.eventRow}>
            <View style={styles.minuteBox}><Text style={styles.minute}>{event.minuteLabel ?? (event.minute !== undefined ? `${event.minute}'` : '—')}</Text></View>
            <View style={[styles.iconBox, event.type === 'goal' && styles.goalIconBox]}>
              <MaterialCommunityIcons name={icons[event.type]} size={22} color={event.type === 'goal' ? colors.success : colors.accentStrong} />
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

function LineupBlock({ team, lineup, players }: { team: string; lineup: MatchLineup; players: Player[] }) {
  const byId = new Map(players.map((player) => [player.id, player]));
  const row = (item: MatchLineup['starters'][number]) => {
    const player = byId.get(item.playerId);
    if (!player) return null;
    return <View key={item.playerId} style={styles.lineupPlayer}>
      <Text style={styles.lineupNumber}>{player.number ?? '—'}</Text>
      <Text style={styles.lineupName}>{player.name}</Text>
      <Text style={styles.lineupRole}>{player.role}</Text>
    </View>;
  };
  return <View style={styles.lineupBlock}>
    <View style={styles.lineupHeader}><TeamLogo name={team} size={34} /><Text style={styles.lineupTeam}>{team}</Text>{lineup.formation ? <Text style={styles.formation}>{lineup.formation}</Text> : null}</View>
    <Text style={styles.lineupLabel}>Titolari</Text>
    {[...lineup.starters].sort((a, b) => (a.positionOrder ?? 0) - (b.positionOrder ?? 0)).map(row)}
    <Text style={styles.lineupLabel}>Panchina</Text>
    {lineup.substitutes.length ? [...lineup.substitutes].sort((a, b) => (a.positionOrder ?? 0) - (b.positionOrder ?? 0)).map(row) : <Text style={styles.lineupEmpty}>Nessuna riserva comunicata</Text>}
  </View>;
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
  compactTeamsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 9 },
  compactScore: { color: colors.paper, fontSize: 29, lineHeight: 35, fontWeight: '900', letterSpacing: -0.5, flex: 1, textAlign: 'center' },
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
  teamBadge: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  opponentBadge: { backgroundColor: colors.navy },
  teamBadgeText: { color: colors.paper, fontSize: 22, fontWeight: '900' },
  teamName: { color: colors.ink, fontSize: 14, lineHeight: 18, fontWeight: '900', marginTop: 8 },
  teamNameRight: { textAlign: 'right' },
  centerScore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 8 },
  score: { color: colors.ink, fontSize: 40, fontWeight: '900' },
  scoreDash: { color: colors.mutedDark, fontSize: 28, fontWeight: '700' },
  venue: { color: colors.muted, textAlign: 'center', fontSize: 11, paddingVertical: 18 },
  lineupsCard: { padding: 18, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, gap: 16 },
  lineupBlock: { gap: 7, paddingTop: 4 },
  lineupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  lineupTeam: { flex: 1, color: colors.ink, fontSize: 18, fontWeight: '900' },
  formation: { color: colors.accentStrong, fontWeight: '900', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, backgroundColor: colors.accentSoft },
  lineupLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginTop: 7, textTransform: 'uppercase' },
  lineupPlayer: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  lineupNumber: { width: 28, color: colors.accentStrong, fontWeight: '900', textAlign: 'center' },
  lineupName: { flex: 1, color: colors.ink, fontWeight: '800' },
  lineupRole: { color: colors.muted, fontSize: 11 },
  lineupEmpty: { color: colors.muted, fontSize: 12 },
  timelineCard: { padding: 18, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  timelineHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  timelineEyebrow: { color: colors.yellow, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  timelineTitle: { color: colors.ink, fontSize: 23, lineHeight: 28, fontWeight: '900', marginTop: 4 },
  timelineTitleBlock: { flex: 1, minWidth: 0 },
  timelineCount: { color: colors.muted, fontSize: 11, flexShrink: 0 },
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  minuteBox: { width: 58, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm, backgroundColor: colors.yellowSoft },
  minute: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  goalIconBox: { backgroundColor: colors.successSoft },
  eventBody: { flex: 1, paddingTop: 2 },
  eventTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  eventCopy: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 4 },
  scorePill: { alignSelf: 'flex-start', color: colors.paper, fontSize: 13, fontWeight: '900', marginTop: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.sm, overflow: 'hidden', backgroundColor: colors.accentStrong },
  empty: { alignItems: 'center', paddingVertical: 34 },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', marginTop: 10 },
  emptyCopy: { color: colors.muted, textAlign: 'center', marginTop: 5 },
});
