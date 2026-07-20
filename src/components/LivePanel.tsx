import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '../theme';
import { Fixture, LiveEvent } from '../types';

const icons: Record<LiveEvent['type'], React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  kickoff: 'play-circle-outline',
  halftime: 'pause-circle-outline',
  second_half: 'play-circle-outline',
  goal: 'soccer',
  fulltime: 'stop-circle-outline',
};

export function LivePanel({ fixture }: { fixture: Fixture }) {
  const phase = fixture.livePhase === 'halftime' ? 'INTERVALLO' : fixture.livePhase === 'finished' ? 'FINALE' : fixture.livePhase === 'second_half' ? 'SECONDO TEMPO' : fixture.livePhase === 'first_half' ? 'PRIMO TEMPO' : fixture.dateLabel;
  return (
    <View style={styles.wrap}>
      <View style={styles.scoreCard}>
        <Text style={styles.competition}>{fixture.competition}</Text>
        <Text style={styles.matchday}>{fixture.matchday}</Text>
        <View style={styles.scoreRow}>
          <Text style={styles.team}>{fixture.home}</Text>
          <Text style={styles.score}>{fixture.homeScore ?? 0} - {fixture.awayScore ?? 0}</Text>
          <Text style={[styles.team, styles.away]}>{fixture.away}</Text>
        </View>
        <Text style={styles.phase}>{phase}</Text>
      </View>
      <View style={styles.timeline}>
        {(fixture.liveEvents ?? []).map((event) => (
          <View key={event.id} style={styles.event}>
            <View style={styles.icon}><MaterialCommunityIcons name={icons[event.type]} size={20} color={event.type === 'goal' ? colors.success : colors.blue} /></View>
            <View style={styles.eventBody}>
              <Text style={styles.eventTitle}>{event.label}</Text>
              {event.scorer ? <Text style={styles.scorer}>Marcatore: {event.scorer}</Text> : null}
              {event.score ? <Text style={styles.eventScore}>{event.score}</Text> : null}
            </View>
            <Text style={styles.minute}>{event.minute ? `${event.minute}'` : ''}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  scoreCard: { padding: 20, borderRadius: radii.lg, backgroundColor: colors.ink },
  competition: { color: colors.accent, fontWeight: '900', textTransform: 'uppercase', fontSize: 12 },
  matchday: { color: '#BFD0DF', marginTop: 4 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22 },
  team: { flex: 1, color: colors.paper, fontWeight: '900', fontSize: 17 },
  away: { textAlign: 'right' },
  score: { color: colors.paper, fontSize: 32, fontWeight: '900' },
  phase: { alignSelf: 'center', marginTop: 16, color: colors.ink, backgroundColor: colors.accent, paddingHorizontal: 14, paddingVertical: 7, borderRadius: radii.pill, fontWeight: '900', fontSize: 12 },
  timeline: { gap: 10 },
  event: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radii.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  eventBody: { flex: 1 },
  eventTitle: { color: colors.ink, fontWeight: '900' },
  scorer: { color: colors.inkSoft, marginTop: 2 },
  eventScore: { color: colors.success, fontWeight: '900', marginTop: 3 },
  minute: { color: colors.muted, fontWeight: '800' },
});
