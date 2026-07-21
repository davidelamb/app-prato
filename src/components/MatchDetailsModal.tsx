import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '../theme';
import { SeasonMatch } from '../types';
import { TeamBadge } from './TeamBadge';

const visibleValue = (value: string | undefined) => value && value !== 'Data da definire' && value !== '—' ? value : '';

export function MatchDetailsModal({ match, onClose }: { match: SeasonMatch | null; onClose: () => void }) {
  if (!match) return null;
  const hasScore = match.homeScore !== undefined && match.awayScore !== undefined;
  const round = match.roundLabel ?? (match.matchday ? `${match.matchday}ª giornata` : 'Partita');
  const date = visibleValue(match.dateLabel);
  const time = visibleValue(match.time);

  return <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Chiudi dettaglio partita" onPress={onClose} style={styles.closeButton}><MaterialCommunityIcons name="chevron-left" size={31} color={colors.ink} /></Pressable>
          <Text style={styles.topTitle}>Dettaglio partita</Text>
          <View style={styles.topSpacer} />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroTop}><Text style={styles.competition}>{match.competition ?? 'Campionato'}</Text><Text style={styles.status}>{hasScore ? 'FINALE' : 'IN PROGRAMMA'}</Text></View>
          <Text style={styles.round}>{round}</Text>
          <View style={styles.scoreboard}>
            <Team name={match.home} align="left" />
            <View style={styles.scoreBox}>{hasScore ? <><Text style={styles.score}>{match.homeScore}</Text><Text style={styles.dash}>–</Text><Text style={styles.score}>{match.awayScore}</Text></> : <MaterialCommunityIcons name="calendar-clock" size={34} color={colors.yellow} />}</View>
            <Team name={match.away} align="right" />
          </View>
        </View>

        <View style={styles.details}>
          <Detail icon="calendar-month-outline" label="Data" value={date || 'Da definire'} />
          <Detail icon="clock-outline" label="Ora" value={time || 'Da definire'} />
          <Detail icon="stadium-outline" label="Stadio" value={match.venue || 'Da definire'} />
          <Detail icon="trophy-outline" label="Competizione" value={match.competition ?? 'Campionato'} />
        </View>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

function Team({ name, align }: { name: string; align: 'left' | 'right' }) {
  const isPrato = /^(AC )?Prato$/i.test(name);
  return <View style={[styles.team, align === 'right' && styles.teamRight]}><TeamBadge name={name} size={58} /><Text numberOfLines={2} style={[styles.teamName, align === 'right' && styles.teamNameRight, isPrato && styles.pratoName]}>{name}</Text></View>;
}

function Detail({ icon, label, value }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; label: string; value: string }) {
  return <View style={styles.detailRow}><View style={styles.detailIcon}><MaterialCommunityIcons name={icon} size={21} color={colors.accentStrong} /></View><View style={styles.detailBody}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvasRaised },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 18, paddingBottom: 40 },
  topBar: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  topTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  topSpacer: { width: 44 },
  hero: { overflow: 'hidden', marginTop: 14, padding: 20, borderRadius: radii.lg, backgroundColor: colors.navy },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  competition: { flex: 1, color: colors.paper, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  status: { color: colors.yellow, fontSize: 10, fontWeight: '900' },
  round: { color: colors.mutedDark, fontSize: 11, fontWeight: '800', marginTop: 5 },
  scoreboard: { minHeight: 190, flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  team: { flex: 1, alignItems: 'flex-start' },
  teamRight: { alignItems: 'flex-end' },
  teamName: { color: colors.paper, fontSize: 14, lineHeight: 19, fontWeight: '900', marginTop: 9 },
  teamNameRight: { textAlign: 'right' },
  pratoName: { color: colors.yellow },
  scoreBox: { minWidth: 112, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 8 },
  score: { color: colors.paper, fontSize: 42, fontWeight: '900' },
  dash: { color: colors.mutedDark, fontSize: 28, fontWeight: '800' },
  details: { gap: 10, marginTop: 16 },
  detailRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 13, padding: 13, borderRadius: radii.md, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  detailIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: colors.surfaceSoft },
  detailBody: { flex: 1 },
  detailLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  detailValue: { color: colors.ink, fontSize: 15, fontWeight: '900', marginTop: 3 },
});
