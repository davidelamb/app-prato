import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TeamLogo } from '../components/TeamLogo';
import { preseasonStandings, provisionalPratoSchedule } from '../data/season-2026-27';
import { colors, radii } from '../theme';
import { AppContent, MatchCompetition, SeasonMatch, Standing, StandingScope } from '../types';
import { completeStandingRows, numberValue, standingRows, standingScopes } from '../utils/standings';

type StatsView = 'calendar' | 'standings';
type CalendarFilter = 'Tutte' | MatchCompetition;

const STATS_VIEW_STORAGE_KEY = 'app-prato:stats-view';

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
  const [viewHydrated, setViewHydrated] = useState(false);
  const [filter, setFilter] = useState<CalendarFilter>('Tutte');
  const [standingScope, setStandingScope] = useState<StandingScope>('overall');

  useEffect(() => {
    AsyncStorage.getItem(STATS_VIEW_STORAGE_KEY)
      .then((savedView) => {
        if (savedView === 'calendar' || savedView === 'standings') setView(savedView);
      })
      .finally(() => setViewHydrated(true));
  }, []);

  useEffect(() => {
    if (viewHydrated) void AsyncStorage.setItem(STATS_VIEW_STORAGE_KEY, view);
  }, [view, viewHydrated]);

  const standings = completeStandingRows(standingRows(content, standingScope), preseasonStandings);
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {standingScopes.map((item) => <Pressable key={item.value} onPress={() => setStandingScope(item.value)} style={[styles.filter, standingScope === item.value && styles.filterActive]}><Text style={[styles.filterText, standingScope === item.value && styles.filterTextActive]}>{item.label}</Text></Pressable>)}
      </ScrollView>
      {standings.length ? <StandingsList standings={standings} scope={standingScope} /> : <View style={styles.empty}><MaterialCommunityIcons name="table-alert" size={32} color={colors.muted} /><Text style={styles.emptyText}>Classifica in caricamento.</Text></View>}
    </View>}
  </View>;
}

function MatchRow({ match }: { match: SeasonMatch }) {
  const date = visibleValue(match.dateLabel);
  const time = visibleValue(match.time);
  const hasScore = match.homeScore !== undefined && match.awayScore !== undefined;
  const competition = match.competition ?? 'Campionato';
  const round = match.roundLabel ?? (match.matchday ? `${match.matchday}ª giornata` : '');
  return <View style={styles.matchCard}>
    <View style={styles.matchBody}>
      <View style={styles.matchTop}><Text style={styles.competitionName}>{competition}</Text>{round ? <Text style={styles.round}>{round}</Text> : null}</View>
      {date || time || match.venue ? <Text style={styles.matchMeta}>{[date, time, match.venue].filter(Boolean).join(' · ')}</Text> : null}
      <View style={styles.teamRow}><TeamLogo name={match.home} size={22} style={{ borderRadius: 6 }} /><Text numberOfLines={1} style={[styles.teamName, /^(AC )?Prato$/i.test(match.home) && styles.pratoTeam]}>{match.home}</Text>{hasScore ? <Text style={styles.score}>{match.homeScore}</Text> : null}</View>
      <View style={styles.teamDivider} />
      <View style={styles.teamRow}><TeamLogo name={match.away} size={22} style={{ borderRadius: 6 }} /><Text numberOfLines={1} style={[styles.teamName, /^(AC )?Prato$/i.test(match.away) && styles.pratoTeam]}>{match.away}</Text>{hasScore ? <Text style={styles.score}>{match.awayScore}</Text> : null}</View>
    </View>
  </View>;
}

function StandingsList({ standings, scope }: { standings: Standing[]; scope: StandingScope }) {
  const label = standingScopes.find((item) => item.value === scope)?.label ?? 'Generale';
  const ordered = [...standings].sort((a, b) => a.rank - b.rank);
  const showForm = scope === 'form';

  return (
    <View style={styles.standingsCard}>
      <Text style={styles.standingsTitle}>Serie D Girone E · {label}</Text>
      <View style={styles.standingsBody}>
        {ordered.map((row) => (
          <StandingCard key={row.club} row={row} showForm={showForm} />
        ))}
      </View>
    </View>
  );
}

function StandingCard({ row, showForm }: { row: Standing; showForm: boolean }) {
  const isPrato = /^(AC )?Prato$/i.test(row.club);
  return (
    <View style={[styles.card, isPrato && styles.pratoCard]}>
      <View style={styles.cardMain}>
        <Text style={[styles.cardPos, isPrato && styles.pratoPosText]}>{row.rank}</Text>
        <TeamLogo name={row.club} size={28} style={styles.cardLogo} />
        <Text numberOfLines={1} style={[styles.cardClub, isPrato && styles.pratoText]}>{row.club}</Text>
        <Text style={[styles.cardPoints, isPrato && styles.pratoPointsText]}>{row.points}</Text>
        <Text style={styles.cardPtsLabel}>PT</Text>
      </View>
      <View style={styles.cardStats}>
        <Stat label="G" value={String(row.played)} />
        <Stat label="V" value={String(numberValue(row.wins))} accent={numberValue(row.wins) > 0 ? 'positive' : undefined} />
        <Stat label="N" value={String(numberValue(row.draws))} />
        <Stat label="P" value={String(numberValue(row.losses))} accent={numberValue(row.losses) > 0 ? 'negative' : undefined} />
        <Stat label="GF" value={String(numberValue(row.goalsFor))} />
        <Stat label="GS" value={String(numberValue(row.goalsAgainst))} />
        <Stat label="DR" value={String(numberValue(row.goalDifference))} accent={numberValue(row.goalDifference) > 0 ? 'positive' : numberValue(row.goalDifference) < 0 ? 'negative' : undefined} />
      </View>
      {showForm && (row.form ?? []).length > 0 ? (
        <View style={styles.cardForm}>
          <Text style={styles.formLabel}>Ultime 5</Text>
          <View style={styles.formRow}>
            {(row.form ?? []).slice(-5).map((result, index) => (
              <View key={`${row.club}-${index}`} style={[styles.formBadge, result === 'W' ? styles.formWin : result === 'D' ? styles.formDraw : styles.formLoss]}>
                <Text style={styles.formText}>{result === 'W' ? 'V' : result === 'D' ? 'N' : 'P'}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'positive' | 'negative' }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[styles.statLabel, accent === 'positive' && styles.statPositive, accent === 'negative' && styles.statNegative]}>{label}</Text>
    </View>
  );
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
  filters: { gap: 8, paddingRight: 10 },
  filter: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 15, borderRadius: 20, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  filterActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  filterText: { color: colors.inkSoft, fontSize: 11, fontWeight: '900' },
  filterTextActive: { color: colors.paper },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: colors.ink, fontSize: 24, fontWeight: '900' },
  sectionCount: { minWidth: 30, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 15, overflow: 'hidden', color: colors.paper, backgroundColor: colors.accentStrong, textAlign: 'center', fontSize: 11, fontWeight: '900' },
  matchList: { gap: 9 },
  matchCard: { minHeight: 112, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: radii.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
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

  // Mobile-first standings cards
  standingsCard: { width: '100%', borderRadius: radii.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  standingsTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', padding: 14, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  standingsBody: { gap: 1, backgroundColor: colors.lineSoft },
  card: { gap: 10, padding: 12, backgroundColor: colors.paper },
  pratoCard: { backgroundColor: colors.surfaceRaised, borderLeftWidth: 3, borderLeftColor: colors.accentStrong },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardPos: { width: 28, fontSize: 15, fontWeight: '900', color: colors.muted, textAlign: 'center' },
  pratoPosText: { color: colors.accentStrong },
  cardLogo: { width: 28, height: 28, borderRadius: 8 },
  cardClub: { flex: 1, fontSize: 14, fontWeight: '800', color: colors.ink },
  pratoText: { color: colors.accentStrong, fontWeight: '900' },
  cardPoints: { fontSize: 22, fontWeight: '900', color: colors.ink, minWidth: 28, textAlign: 'right' },
  pratoPointsText: { color: colors.accentStrong },
  cardPtsLabel: { fontSize: 10, fontWeight: '800', color: colors.muted, textTransform: 'uppercase' },
  cardStats: { flexDirection: 'row', gap: 0, paddingLeft: 38 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 13, fontWeight: '800', color: colors.ink },
  statLabel: { fontSize: 9, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  statPositive: { color: colors.success },
  statNegative: { color: colors.live },
  cardForm: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 38 },
  formLabel: { fontSize: 9, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  formRow: { flexDirection: 'row', gap: 4 },
  formBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  formWin: { backgroundColor: colors.success },
  formDraw: { backgroundColor: colors.mutedDark },
  formLoss: { backgroundColor: colors.live },
  formText: { color: colors.paper, fontSize: 9, fontWeight: '900' },
});