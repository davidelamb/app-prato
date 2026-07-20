import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  preseasonStandings,
  provisionalPratoSchedule,
  SeasonMatch,
  SeasonStanding,
  serieDTeams2026,
  transfermarktSeasonSource,
} from '../data/season-2026-27';
import { colors, radii } from '../theme';
import { AppContent } from '../types';

type StatsView = 'calendar' | 'standings';

export function StatsScreen({ content, wide }: { content: AppContent; wide: boolean }) {
  const [view, setView] = useState<StatsView>('calendar');
  const firstLeg = useMemo(() => provisionalPratoSchedule.filter((match) => match.leg === 'Andata'), []);
  const secondLeg = useMemo(() => provisionalPratoSchedule.filter((match) => match.leg === 'Ritorno'), []);
  const playedMatches = content.fixtures.filter((fixture) => fixture.status === 'final').length;

  const openSource = async () => {
    try {
      await Linking.openURL(transfermarktSeasonSource);
    } catch (error) {
      console.warn('Impossibile aprire Transfermarkt', error);
    }
  };

  return (
    <View style={styles.stack}>
      <View>
        <Text style={styles.eyebrow}>SERIE D · GIRONE E</Text>
        <Text style={styles.title}>Stagione 2026/27</Text>
        <Text style={styles.copy}>Calendario del Prato e classifica completa del girone.</Text>
      </View>

      <View style={[styles.metrics, wide && styles.metricsWide]}>
        <Metric icon="shield-outline" value={serieDTeams2026.length} label="Squadre" />
        <Metric icon="calendar-month-outline" value={provisionalPratoSchedule.length} label="Giornate Prato" />
        <Metric icon="soccer" value={playedMatches} label="Risultati inseriti" />
      </View>

      <View style={styles.notice}>
        <View style={styles.noticeIcon}>
          <MaterialCommunityIcons name="information-outline" size={23} color={colors.accentStrong} />
        </View>
        <View style={styles.noticeBody}>
          <Text style={styles.noticeTitle}>Dati pre-campionato</Text>
          <Text style={styles.noticeCopy}>
            Le 18 partecipanti sono quelle indicate da Transfermarkt per il 2026/27. Accoppiamenti e date del calendario sono provvisori e saranno sostituiti quando verrà pubblicato il calendario ufficiale LND.
          </Text>
          <Pressable onPress={() => void openSource()} style={styles.sourceButton}>
            <Text style={styles.sourceText}>Apri la fonte Transfermarkt</Text>
            <MaterialCommunityIcons name="open-in-new" size={16} color={colors.accentStrong} />
          </Pressable>
        </View>
      </View>

      <View style={styles.segmented}>
        <Pressable onPress={() => setView('calendar')} style={[styles.segment, view === 'calendar' && styles.segmentActive]}>
          <MaterialCommunityIcons name="calendar-month-outline" size={20} color={view === 'calendar' ? colors.paper : colors.accentStrong} />
          <Text style={[styles.segmentText, view === 'calendar' && styles.segmentTextActive]}>Calendario</Text>
        </Pressable>
        <Pressable onPress={() => setView('standings')} style={[styles.segment, view === 'standings' && styles.segmentActive]}>
          <MaterialCommunityIcons name="format-list-numbered" size={20} color={view === 'standings' ? colors.paper : colors.accentStrong} />
          <Text style={[styles.segmentText, view === 'standings' && styles.segmentTextActive]}>Classifica</Text>
        </Pressable>
      </View>

      {view === 'calendar' ? (
        <View style={styles.calendarStack}>
          <ScheduleSection title="Girone di andata" matches={firstLeg} />
          <ScheduleSection title="Girone di ritorno" matches={secondLeg} />
        </View>
      ) : (
        <StandingsTable standings={preseasonStandings} />
      )}
    </View>
  );
}

function Metric({ icon, value, label }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; value: number; label: string }) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricIcon}><MaterialCommunityIcons name={icon} size={23} color={colors.accentStrong} /></View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ScheduleSection({ title, matches }: { title: string; matches: SeasonMatch[] }) {
  return (
    <View style={styles.scheduleSection}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{matches.length} giornate</Text>
      </View>
      <View style={styles.matchList}>
        {matches.map((match) => <MatchRow key={match.id} match={match} />)}
      </View>
    </View>
  );
}

function MatchRow({ match }: { match: SeasonMatch }) {
  const homeIsPrato = match.home === 'AC Prato';
  const awayIsPrato = match.away === 'AC Prato';

  return (
    <View style={styles.matchCard}>
      <View style={styles.matchdayBadge}>
        <Text style={styles.matchdaySmall}>G</Text>
        <Text style={styles.matchdayNumber}>{match.matchday}</Text>
      </View>
      <View style={styles.matchBody}>
        <View style={styles.matchMetaRow}>
          <Text style={styles.matchLeg}>{match.leg}</Text>
          <Text style={styles.matchDate}>{match.dateLabel}</Text>
        </View>
        <View style={styles.teamRow}>
          <MaterialCommunityIcons name="shield-outline" size={19} color={homeIsPrato ? colors.accentStrong : colors.muted} />
          <Text numberOfLines={1} style={[styles.teamName, homeIsPrato && styles.pratoTeam]}>{match.home}</Text>
          <Text style={styles.homeAway}>CASA</Text>
        </View>
        <View style={styles.teamDivider} />
        <View style={styles.teamRow}>
          <MaterialCommunityIcons name="shield-outline" size={19} color={awayIsPrato ? colors.accentStrong : colors.muted} />
          <Text numberOfLines={1} style={[styles.teamName, awayIsPrato && styles.pratoTeam]}>{match.away}</Text>
          <Text style={styles.homeAway}>TRASFERTA</Text>
        </View>
      </View>
      <View style={styles.timeBadge}><Text style={styles.timeText}>{match.time}</Text></View>
    </View>
  );
}

function StandingsTable({ standings }: { standings: SeasonStanding[] }) {
  return (
    <View style={styles.tableCard}>
      <View style={styles.tableTitleRow}>
        <View>
          <Text style={styles.tableEyebrow}>CLASSIFICA INIZIALE</Text>
          <Text style={styles.tableTitle}>Serie D Girone E</Text>
        </View>
        <Text style={styles.alphabetical}>Ordine alfabetico</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableScroll}>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Cell text="#" style={styles.posCell} header />
            <Cell text="Squadra" style={styles.clubCell} header align="left" />
            <Cell text="G" header />
            <Cell text="V" header />
            <Cell text="N" header />
            <Cell text="P" header />
            <Cell text="GF" header />
            <Cell text="GS" header />
            <Cell text="DR" header />
            <Cell text="PT" header strong />
          </View>
          {standings.map((row) => <StandingRow key={row.club} row={row} />)}
        </View>
      </ScrollView>
      <Text style={styles.tableFootnote}>Tutti i valori partono da zero in attesa dell’inizio del campionato.</Text>
    </View>
  );
}

function StandingRow({ row }: { row: SeasonStanding }) {
  const isPrato = row.club === 'AC Prato';
  return (
    <View style={[styles.tableRow, isPrato && styles.pratoRow]}>
      <Cell text={String(row.rank)} style={styles.posCell} strong={isPrato} />
      <View style={[styles.cell, styles.clubCell, styles.clubIdentity]}>
        <View style={[styles.clubDot, isPrato && styles.clubDotPrato]} />
        <Text numberOfLines={1} style={[styles.cellText, styles.clubText, isPrato && styles.pratoText]}>{row.club}</Text>
      </View>
      <Cell text={String(row.played)} />
      <Cell text={String(row.wins)} />
      <Cell text={String(row.draws)} />
      <Cell text={String(row.losses)} />
      <Cell text={String(row.goalsFor)} />
      <Cell text={String(row.goalsAgainst)} />
      <Cell text={String(row.goalDifference)} />
      <Cell text={String(row.points)} strong />
    </View>
  );
}

function Cell({ text, style, header = false, strong = false, align = 'center' }: { text: string; style?: object; header?: boolean; strong?: boolean; align?: 'left' | 'center' }) {
  return (
    <View style={[styles.cell, style]}>
      <Text style={[styles.cellText, align === 'left' && styles.cellLeft, header && styles.headerText, strong && styles.strongText]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 18 },
  eyebrow: { color: colors.yellow, fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 37, lineHeight: 42, fontWeight: '900', marginTop: 4 },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 8 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricsWide: { flexWrap: 'nowrap' },
  metric: { flexGrow: 1, minWidth: 105, padding: 16, borderRadius: radii.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  metricIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised },
  metricValue: { color: colors.ink, fontSize: 25, fontWeight: '900', marginTop: 12 },
  metricLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  notice: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: radii.lg, backgroundColor: colors.yellowSoft, borderWidth: 1, borderColor: colors.yellow },
  noticeIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  noticeBody: { flex: 1 },
  noticeTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  noticeCopy: { color: colors.inkSoft, fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 5 },
  sourceButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 10 },
  sourceText: { color: colors.accentStrong, fontSize: 11, fontWeight: '900' },
  segmented: { flexDirection: 'row', padding: 5, borderRadius: radii.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, gap: 5 },
  segment: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radii.md },
  segmentActive: { backgroundColor: colors.accentStrong },
  segmentText: { color: colors.accentStrong, fontSize: 12, fontWeight: '900' },
  segmentTextActive: { color: colors.paper },
  calendarStack: { gap: 24 },
  scheduleSection: { gap: 11 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: colors.ink, fontSize: 24, fontWeight: '900' },
  sectionCount: { color: colors.accentStrong, fontSize: 11, fontWeight: '900' },
  matchList: { gap: 9 },
  matchCard: { minHeight: 116, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: radii.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  matchdayBadge: { width: 52, height: 68, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: colors.accentStrong },
  matchdaySmall: { color: colors.accentSoft, fontSize: 9, fontWeight: '900' },
  matchdayNumber: { color: colors.paper, fontSize: 24, fontWeight: '900', marginTop: 1 },
  matchBody: { flex: 1, minWidth: 0 },
  matchMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  matchLeg: { color: colors.accentStrong, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  matchDate: { color: colors.muted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  teamRow: { minHeight: 25, flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamName: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: '800' },
  pratoTeam: { color: colors.accentStrong, fontWeight: '900' },
  homeAway: { color: colors.muted, fontSize: 8, fontWeight: '900' },
  teamDivider: { height: 1, backgroundColor: colors.lineSoft, marginVertical: 4, marginLeft: 27 },
  timeBadge: { minWidth: 42, paddingHorizontal: 9, paddingVertical: 8, borderRadius: radii.sm, alignItems: 'center', backgroundColor: colors.surfaceRaised },
  timeText: { color: colors.accentStrong, fontSize: 12, fontWeight: '900' },
  tableCard: { overflow: 'hidden', borderRadius: radii.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  tableTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 17, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  tableEyebrow: { color: colors.yellow, fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  tableTitle: { color: colors.ink, fontSize: 22, fontWeight: '900', marginTop: 3 },
  alphabetical: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  tableScroll: { minWidth: 720 },
  table: { minWidth: 720, flex: 1 },
  tableHeader: { flexDirection: 'row', minHeight: 42, alignItems: 'center', backgroundColor: colors.navy },
  tableRow: { flexDirection: 'row', minHeight: 49, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  pratoRow: { backgroundColor: colors.surfaceRaised },
  cell: { width: 47, height: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  posCell: { width: 40 },
  clubCell: { width: 257 },
  cellText: { width: '100%', color: colors.muted, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  cellLeft: { textAlign: 'left' },
  headerText: { color: colors.paper, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  strongText: { color: colors.ink, fontWeight: '900' },
  clubIdentity: { flexDirection: 'row', justifyContent: 'flex-start', gap: 9, paddingHorizontal: 10 },
  clubDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.line },
  clubDotPrato: { backgroundColor: colors.accentStrong },
  clubText: { flex: 1, width: 'auto', textAlign: 'left', color: colors.ink, fontWeight: '800' },
  pratoText: { color: colors.accentStrong, fontWeight: '900' },
  tableFootnote: { color: colors.muted, fontSize: 10, lineHeight: 15, padding: 14 },
});
