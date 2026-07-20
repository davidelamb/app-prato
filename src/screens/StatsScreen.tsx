import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { preseasonStandings, provisionalPratoSchedule } from '../data/season-2026-27';
import { colors, radii } from '../theme';
import { AppContent, SeasonMatch, Standing } from '../types';

type StatsView = 'calendar' | 'standings';
const number = (value: number | undefined) => Number(value) || 0;
const visibleValue = (value: string) => value && value !== 'Data da definire' && value !== '—' ? value : '';

export function StatsScreen({ content }: { content: AppContent; wide: boolean }) {
  const [view, setView] = useState<StatsView>('calendar');
  const schedule = content.schedule?.length ? content.schedule : provisionalPratoSchedule;
  const standings = content.standings.length >= 18 ? content.standings : preseasonStandings;
  const firstLeg = useMemo(() => schedule.filter((match) => match.leg === 'Andata'), [schedule]);
  const secondLeg = useMemo(() => schedule.filter((match) => match.leg === 'Ritorno'), [schedule]);

  return <View style={styles.stack}>
    <View>
      <Text style={styles.eyebrow}>SERIE D · GIRONE E</Text>
      <Text style={styles.title}>Stagione 2026/27</Text>
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

    {view === 'calendar' ? <View style={styles.calendarStack}>
      <ScheduleSection title="Girone di andata" matches={firstLeg} />
      <ScheduleSection title="Girone di ritorno" matches={secondLeg} />
    </View> : <StandingsTable standings={standings} />}
  </View>;
}

function ScheduleSection({ title, matches }: { title: string; matches: SeasonMatch[] }) {
  return <View style={styles.scheduleSection}>
    <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionCount}>{matches.length}</Text></View>
    <View style={styles.matchList}>{matches.map((match) => <MatchRow key={match.id} match={match} />)}</View>
  </View>;
}

function MatchRow({ match }: { match: SeasonMatch }) {
  const date = visibleValue(match.dateLabel);
  const time = visibleValue(match.time);
  const hasScore = match.homeScore !== undefined && match.awayScore !== undefined;
  return <View style={styles.matchCard}>
    <View style={styles.matchdayBadge}><Text style={styles.matchdayNumber}>{match.matchday}</Text></View>
    <View style={styles.matchBody}>
      {date || time ? <Text style={styles.matchMeta}>{[date, time].filter(Boolean).join(' · ')}</Text> : null}
      <View style={styles.teamRow}>
        <Text numberOfLines={1} style={[styles.teamName, match.home === 'AC Prato' && styles.pratoTeam]}>{match.home}</Text>
        {hasScore ? <Text style={styles.score}>{match.homeScore}</Text> : null}
      </View>
      <View style={styles.teamDivider} />
      <View style={styles.teamRow}>
        <Text numberOfLines={1} style={[styles.teamName, match.away === 'AC Prato' && styles.pratoTeam]}>{match.away}</Text>
        {hasScore ? <Text style={styles.score}>{match.awayScore}</Text> : null}
      </View>
    </View>
  </View>;
}

function StandingsTable({ standings }: { standings: Standing[] }) {
  const ordered = [...standings].sort((a, b) => a.rank - b.rank);
  return <View style={styles.tableCard}>
    <Text style={styles.tableTitle}>Serie D Girone E</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableScroll}>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Cell text="#" style={styles.posCell} header />
          <Cell text="Squadra" style={styles.clubCell} header align="left" />
          <Cell text="G" header /><Cell text="V" header /><Cell text="N" header /><Cell text="P" header />
          <Cell text="GF" header /><Cell text="GS" header /><Cell text="DR" header /><Cell text="PT" header strong />
        </View>
        {ordered.map((row) => <StandingRow key={row.club} row={row} />)}
      </View>
    </ScrollView>
  </View>;
}

function StandingRow({ row }: { row: Standing }) {
  const isPrato = row.club === 'AC Prato';
  return <View style={[styles.tableRow, isPrato && styles.pratoRow]}>
    <Cell text={String(row.rank)} style={styles.posCell} strong={isPrato} />
    <View style={[styles.cell, styles.clubCell]}><Text numberOfLines={1} style={[styles.cellText, styles.clubText, isPrato && styles.pratoText]}>{row.club}</Text></View>
    <Cell text={String(row.played)} /><Cell text={String(number(row.wins))} /><Cell text={String(number(row.draws))} /><Cell text={String(number(row.losses))} />
    <Cell text={String(number(row.goalsFor))} /><Cell text={String(number(row.goalsAgainst))} /><Cell text={String(number(row.goalDifference))} /><Cell text={String(row.points)} strong />
  </View>;
}

function Cell({ text, style, header = false, strong = false, align = 'center' }: { text: string; style?: object; header?: boolean; strong?: boolean; align?: 'left' | 'center' }) {
  return <View style={[styles.cell, style]}><Text style={[styles.cellText, align === 'left' && styles.cellLeft, header && styles.headerText, strong && styles.strongText]}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  stack: { gap: 18 },
  eyebrow: { color: colors.yellow, fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 37, lineHeight: 42, fontWeight: '900', marginTop: 4 },
  segmented: { flexDirection: 'row', padding: 5, borderRadius: radii.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, gap: 5 },
  segment: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radii.md },
  segmentActive: { backgroundColor: colors.accentStrong },
  segmentText: { color: colors.accentStrong, fontSize: 12, fontWeight: '900' },
  segmentTextActive: { color: colors.paper },
  calendarStack: { gap: 24 },
  scheduleSection: { gap: 11 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: colors.ink, fontSize: 24, fontWeight: '900' },
  sectionCount: { minWidth: 30, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 15, overflow: 'hidden', color: colors.paper, backgroundColor: colors.accentStrong, textAlign: 'center', fontSize: 11, fontWeight: '900' },
  matchList: { gap: 9 },
  matchCard: { minHeight: 96, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: radii.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  matchdayBadge: { width: 48, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: colors.accentStrong },
  matchdayNumber: { color: colors.paper, fontSize: 22, fontWeight: '900' },
  matchBody: { flex: 1, minWidth: 0 },
  matchMeta: { color: colors.muted, fontSize: 10, fontWeight: '800', marginBottom: 7, textTransform: 'uppercase' },
  teamRow: { minHeight: 26, flexDirection: 'row', alignItems: 'center', gap: 10 },
  teamName: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '800' },
  pratoTeam: { color: colors.accentStrong, fontWeight: '900' },
  score: { minWidth: 24, color: colors.ink, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  teamDivider: { height: 1, backgroundColor: colors.lineSoft, marginVertical: 3 },
  tableCard: { overflow: 'hidden', borderRadius: radii.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  tableTitle: { color: colors.ink, fontSize: 24, fontWeight: '900', padding: 18, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  tableScroll: { paddingBottom: 2 },
  table: { minWidth: 760 },
  tableHeader: { flexDirection: 'row', minHeight: 44, alignItems: 'center', backgroundColor: colors.navy },
  tableRow: { flexDirection: 'row', minHeight: 49, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  pratoRow: { backgroundColor: colors.surfaceRaised },
  cell: { width: 52, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  posCell: { width: 44 },
  clubCell: { width: 250, alignItems: 'flex-start' },
  cellText: { color: colors.inkSoft, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  cellLeft: { textAlign: 'left' },
  headerText: { color: colors.paper, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  strongText: { color: colors.ink, fontWeight: '900' },
  clubText: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  pratoText: { color: colors.accentStrong, fontWeight: '900' },
});
