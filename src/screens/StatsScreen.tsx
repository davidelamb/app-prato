import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { preseasonStandings, provisionalPratoSchedule } from '../data/season-2026-27';
import { colors, radii } from '../theme';
import { AppContent, MatchCompetition, SeasonMatch, Standing, StandingScope, StandingsView } from '../types';
import { completeStandingRows, formStandingRows, numberValue, standingRows, standingScopes } from '../utils/standings';

type StatsView = 'calendar' | 'standings';
type CalendarFilter = 'Tutte' | MatchCompetition;

const filters: Array<{ value: CalendarFilter; label: string }> = [
  { value: 'Tutte', label: 'Tutte' },
  { value: 'Campionato', label: 'Campionato' },
  { value: 'Coppa Italia', label: 'Coppa Italia' },
  { value: 'Amichevole', label: 'Amichevoli' },
];

const visibleValue = (value: string) => value && value !== 'Data da definire' && value !== '—' ? value : '';

function normalizedMatch(match: SeasonMatch, index: number): SeasonMatch {
  return {
    ...match,
    competition: match.competition ?? 'Campionato',
    roundLabel: match.roundLabel ?? (match.matchday ? `${match.matchday}ª giornata` : ''),
    venue: match.venue ?? '',
    sortOrder: match.sortOrder ?? index,
  };
}

function calendarKey(match: SeasonMatch): number {
  const date = match.dateLabel.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  if (date) return Date.UTC(Number(date[3]), Number(date[2]) - 1, Number(date[1]));
  return 9_000_000_000_000 + (match.sortOrder ?? 0);
}

export function StatsScreen({ content }: { content: AppContent; wide: boolean }) {
  const [view, setView] = useState<StatsView>('calendar');
  const [filter, setFilter] = useState<CalendarFilter>('Tutte');
  const [standingsView, setStandingsView] = useState<StandingsView>('standings');
  const [standingScope, setStandingScope] = useState<StandingScope>('overall');

  const standings = standingsView === 'form'
    ? formStandingRows(content.schedule ?? provisionalPratoSchedule, preseasonStandings, standingScope)
    : completeStandingRows(standingRows(content, standingScope), preseasonStandings);
  const schedule = useMemo(() => {
    const source = content.schedule?.length ? content.schedule : provisionalPratoSchedule;
    return source.map(normalizedMatch).sort((a, b) => calendarKey(a) - calendarKey(b));
  }, [content.schedule]);
  const visibleSchedule = useMemo(
    () => filter === 'Tutte' ? schedule : schedule.filter((match) => match.competition === filter),
    [filter, schedule],
  );

  return <View style={styles.stack}>
    <View><Text style={styles.eyebrow}>AC PRATO</Text><Text style={styles.title}>Stagione 2026/27</Text></View>

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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((item) => <Pressable key={item.value} onPress={() => setFilter(item.value)} style={[styles.filter, filter === item.value && styles.filterActive]}><Text style={[styles.filterText, filter === item.value && styles.filterTextActive]}>{item.label}</Text></Pressable>)}
      </ScrollView>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Partite</Text><Text style={styles.sectionCount}>{visibleSchedule.length}</Text></View>
      <View style={styles.matchList}>{visibleSchedule.map((match) => <MatchRow key={match.id} match={match} />)}</View>
      {!visibleSchedule.length ? <View style={styles.empty}><MaterialCommunityIcons name="calendar-blank-outline" size={32} color={colors.muted} /><Text style={styles.emptyText}>Nessuna partita in questa categoria.</Text></View> : null}
    </View> : <View style={styles.standingsStack}>
      <View style={styles.standingsMode}>
        <Pressable onPress={() => setStandingsView('standings')} style={[styles.standingsModeButton, standingsView === 'standings' && styles.standingsModeActive]}>
          <MaterialCommunityIcons name="format-list-numbered" size={18} color={standingsView === 'standings' ? colors.paper : colors.accentStrong} />
          <Text style={[styles.standingsModeText, standingsView === 'standings' && styles.standingsModeTextActive]}>Classifica</Text>
        </Pressable>
        <Pressable onPress={() => setStandingsView('form')} style={[styles.standingsModeButton, standingsView === 'form' && styles.standingsModeActive]}>
          <MaterialCommunityIcons name="chart-timeline-variant" size={18} color={standingsView === 'form' ? colors.paper : colors.accentStrong} />
          <Text style={[styles.standingsModeText, standingsView === 'form' && styles.standingsModeTextActive]}>Forma</Text>
        </Pressable>
      </View>
      <View style={styles.scopeTabs}>
        {standingScopes.map((item) => <Pressable key={item.value} onPress={() => setStandingScope(item.value)} style={[styles.filter, styles.scopeTab, standingScope === item.value && styles.filterActive]}><Text style={[styles.filterText, standingScope === item.value && styles.filterTextActive]}>{item.label}</Text></Pressable>)}
      </View>
      {standings.length ? <StandingsTable standings={standings} scope={standingScope} view={standingsView} /> : <View style={styles.empty}><MaterialCommunityIcons name="table-alert" size={32} color={colors.muted} /><Text style={styles.emptyText}>Classifica in caricamento.</Text></View>}
    </View>}
  </View>;
}

function MatchRow({ match }: { match: SeasonMatch }) {
  const date = visibleValue(match.dateLabel);
  const time = visibleValue(match.time);
  const hasScore = match.homeScore !== undefined && match.awayScore !== undefined;
  const competition = match.competition ?? 'Campionato';
  const round = match.roundLabel ?? (match.matchday ? `${match.matchday}ª giornata` : '');
  const short = competition === 'Campionato' ? 'CAMP' : competition === 'Coppa Italia' ? 'COPPA' : 'AMIC';
  return <View style={styles.matchCard}>
    <View style={[styles.competitionBadge, competition === 'Coppa Italia' && styles.cupBadge, competition === 'Amichevole' && styles.friendlyBadge]}><Text style={styles.competitionShort}>{short}</Text></View>
    <View style={styles.matchBody}>
      <View style={styles.matchTop}><Text style={styles.competitionName}>{competition}</Text>{round ? <Text style={styles.round}>{round}</Text> : null}</View>
      {date || time || match.venue ? <Text style={styles.matchMeta}>{[date, time, match.venue].filter(Boolean).join(' · ')}</Text> : null}
      <View style={styles.teamRow}><Text numberOfLines={1} style={[styles.teamName, /^(AC )?Prato$/i.test(match.home) && styles.pratoTeam]}>{match.home}</Text>{hasScore ? <Text style={styles.score}>{match.homeScore}</Text> : null}</View>
      <View style={styles.teamDivider} />
      <View style={styles.teamRow}><Text numberOfLines={1} style={[styles.teamName, /^(AC )?Prato$/i.test(match.away) && styles.pratoTeam]}>{match.away}</Text>{hasScore ? <Text style={styles.score}>{match.awayScore}</Text> : null}</View>
    </View>
  </View>;
}

function StandingsTable({ standings, scope, view }: { standings: Standing[]; scope: StandingScope; view: StandingsView }) {
  const label = standingScopes.find((item) => item.value === scope)?.label ?? 'Totale';
  const ordered = [...standings].sort((a, b) => a.rank - b.rank);
  const showForm = view === 'form';
  return <View style={styles.tableCard}>
    <View style={styles.tableHeading}>
      <View><Text style={styles.tableEyebrow}>SERIE D · GIRONE E</Text><Text style={styles.tableTitle}>{showForm ? 'Forma' : 'Classifica'} · {label}</Text></View>
      {showForm ? <View style={styles.legend}><FormLegend label="V" style={styles.formWin} /><FormLegend label="N" style={styles.formDraw} /><FormLegend label="P" style={styles.formLoss} /></View> : null}
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator style={styles.tableViewport} contentContainerStyle={styles.tableScroll}>
      <View style={[styles.table, showForm && styles.formTable]}>
        <View style={styles.tableHeader}>
          <Cell text="#" style={styles.posCell} header />
          <Cell text="Squadra" style={styles.clubCell} header align="left" />
          <Cell text="G" header /><Cell text="V" header /><Cell text="N" header /><Cell text="P" header />
          <Cell text="GF" header /><Cell text="GS" header /><Cell text="DR" header /><Cell text="PT" header strong />
          {showForm ? <Cell text="Forma" style={styles.formCell} header /> : null}
        </View>
        {ordered.map((row) => <StandingRow key={row.club} row={row} showForm={showForm} />)}
      </View>
    </ScrollView>
  </View>;
}

function FormLegend({ label, style }: { label: string; style: object }) {
  return <View style={[styles.legendDot, style]}><Text style={styles.legendLetter}>{label}</Text></View>;
}

function StandingRow({ row, showForm }: { row: Standing; showForm: boolean }) {
  const isPrato = /^(AC )?Prato$/i.test(row.club);
  return <View style={[styles.tableRow, isPrato && styles.pratoRow]}>
    <Cell text={String(row.rank)} style={styles.posCell} strong={isPrato} />
    <View style={[styles.cell, styles.clubCell]}><Text numberOfLines={1} style={[styles.cellText, styles.clubText, isPrato && styles.pratoText]}>{row.club}</Text></View>
    <Cell text={String(row.played)} /><Cell text={String(numberValue(row.wins))} /><Cell text={String(numberValue(row.draws))} /><Cell text={String(numberValue(row.losses))} />
    <Cell text={String(numberValue(row.goalsFor))} /><Cell text={String(numberValue(row.goalsAgainst))} /><Cell text={String(numberValue(row.goalDifference))} /><Cell text={String(row.points)} strong />
    {showForm ? <View style={[styles.cell, styles.formCell]}><View style={styles.formRow}>{(row.form ?? []).slice(-5).map((result, index) => <View key={`${row.club}-${index}`} style={[styles.formBadge, result === 'W' ? styles.formWin : result === 'D' ? styles.formDraw : styles.formLoss]}><Text style={styles.formText}>{result === 'W' ? 'V' : result === 'D' ? 'N' : 'P'}</Text></View>)}</View></View> : null}
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
  calendarStack: { gap: 14 },
  standingsStack: { width: '100%', gap: 12 },
  standingsMode: { flexDirection: 'row', minHeight: 46, padding: 4, gap: 4, borderRadius: radii.md, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  standingsModeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: radii.sm },
  standingsModeActive: { backgroundColor: colors.accentStrong },
  standingsModeText: { color: colors.accentStrong, fontSize: 12, fontWeight: '900' },
  standingsModeTextActive: { color: colors.paper },
  scopeTabs: { flexDirection: 'row', gap: 8 },
  scopeTab: { flex: 1 },
  filters: { gap: 8, paddingRight: 10 },
  filter: { minHeight: 38, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, borderRadius: radii.sm, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  filterActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  filterText: { color: colors.inkSoft, fontSize: 11, fontWeight: '900' },
  filterTextActive: { color: colors.paper },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: colors.ink, fontSize: 24, fontWeight: '900' },
  sectionCount: { minWidth: 30, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 15, overflow: 'hidden', color: colors.paper, backgroundColor: colors.accentStrong, textAlign: 'center', fontSize: 11, fontWeight: '900' },
  matchList: { gap: 9 },
  matchCard: { minHeight: 112, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: radii.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  competitionBadge: { width: 54, height: 62, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: colors.accentStrong },
  cupBadge: { backgroundColor: colors.navy },
  friendlyBadge: { backgroundColor: colors.success },
  competitionShort: { color: colors.paper, fontSize: 9, fontWeight: '900' },
  matchBody: { flex: 1, minWidth: 0 },
  matchTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  competitionName: { color: colors.accentStrong, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  round: { flexShrink: 1, color: colors.muted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  matchMeta: { color: colors.muted, fontSize: 10, fontWeight: '800', marginVertical: 6, textTransform: 'uppercase' },
  teamRow: { minHeight: 26, flexDirection: 'row', alignItems: 'center', gap: 10 },
  teamName: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '800' },
  pratoTeam: { color: colors.accentStrong, fontWeight: '900' },
  score: { minWidth: 24, color: colors.ink, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  teamDivider: { height: 1, backgroundColor: colors.lineSoft, marginVertical: 3 },
  empty: { alignItems: 'center', gap: 8, padding: 30, borderRadius: radii.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  emptyText: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  tableCard: { width: '100%', overflow: 'hidden', borderRadius: radii.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  tableHeading: { minHeight: 82, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  tableEyebrow: { color: colors.accentStrong, fontSize: 9, fontWeight: '900' },
  tableTitle: { color: colors.ink, fontSize: 20, fontWeight: '900', marginTop: 4 },
  legend: { flexDirection: 'row', gap: 5 },
  legendDot: { width: 23, height: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  legendLetter: { color: colors.paper, fontSize: 9, fontWeight: '900' },
  tableViewport: { width: '100%' },
  tableScroll: { flexGrow: 1, paddingBottom: 2 },
  table: { minWidth: 760 },
  formTable: { minWidth: 940 },
  tableHeader: { flexDirection: 'row', minHeight: 44, alignItems: 'center', backgroundColor: colors.navy },
  tableRow: { flexDirection: 'row', minHeight: 49, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  pratoRow: { backgroundColor: colors.surfaceRaised },
  cell: { width: 52, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  posCell: { width: 44 },
  clubCell: { width: 250, alignItems: 'flex-start' },
  formCell: { width: 180 },
  cellText: { color: colors.inkSoft, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  cellLeft: { textAlign: 'left' },
  headerText: { color: colors.paper, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  strongText: { color: colors.ink, fontWeight: '900' },
  clubText: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  pratoText: { color: colors.accentStrong, fontWeight: '900' },
  formRow: { flexDirection: 'row', gap: 5 },
  formBadge: { width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  formWin: { backgroundColor: colors.success },
  formDraw: { backgroundColor: colors.mutedDark },
  formLoss: { backgroundColor: colors.live },
  formText: { color: colors.paper, fontSize: 10, fontWeight: '900' },
});
