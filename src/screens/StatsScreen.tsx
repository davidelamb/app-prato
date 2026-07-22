import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { TeamLogo } from '../components/TeamLogo';
import { getSimulatedStandings, isStandingsEmpty, SIMULATED_LABEL } from '../data/simulated-standings';
import { colors, radii } from '../theme';
import { AppContent, MatchCompetition, SeasonMatch, Standing, StandingScope } from '../types';
import { normalizeStandingRow, standingRows } from '../utils/standings';

type StatsView = 'schedule' | 'standings';

const competitionLabels: Record<MatchCompetition | 'Tutte', string> = {
  Tutte: 'Tutte',
  Campionato: 'Campionato',
  'Coppa Italia': 'Coppa Italia',
  Amichevole: 'Amichevole',
};

const scopeLabels: Record<StandingScope, string> = {
  overall: 'Generale',
  home: 'Casa',
  away: 'Trasferta',
  form: 'Forma',
};

const calendarCompetitionFilters: Array<MatchCompetition | 'Tutte'> = ['Tutte', 'Campionato', 'Coppa Italia', 'Amichevole'];
const scopeFilters: StandingScope[] = ['overall', 'home', 'away', 'form'];

const isPrato = (club: string) => /\bprato\b/i.test(club);

function dateValue(label: string): number {
  const d = new Date(`${label} 2026`);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function formIcon(value: 'W' | 'D' | 'L') {
  if (value === 'W') return { label: 'V', color: colors.success, bg: colors.successSoft };
  if (value === 'D') return { label: 'N', color: colors.warning, bg: colors.yellowSoft };
  return { label: 'P', color: colors.live, bg: colors.liveSoft };
}

export function StatsScreen({ content, wide }: { content: AppContent; wide: boolean }) {
  const [view, setView] = useState<StatsView>('schedule');
  const [calFilter, setCalFilter] = useState<MatchCompetition | 'Tutte'>('Tutte');
  const [scope, setScope] = useState<StandingScope>('overall');
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  const schedule = useMemo(() => {
    const items = content.schedule ?? [];
    const filtered = calFilter === 'Tutte' ? items : items.filter((m) => (m.competition ?? 'Campionato') === calFilter);
    return [...filtered].sort((a, b) => {
      const d = dateValue(a.dateLabel) - dateValue(b.dateLabel);
      if (d !== 0) return d;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
  }, [content.schedule, calFilter]);

  const displayStandings = useMemo(() => {
    const rows = standingRows(content, scope);
    // Se ci sono dati reali (almeno una riga con partite giocate) usali, altrimenti simulati
    if (!isStandingsEmpty(rows)) return { rows: rows.map(normalizeStandingRow), simulated: false };
    return { rows: getSimulatedStandings(scope), simulated: true };
  }, [content, scope]);

  return (
    <View>
      {/* View switcher */}
      <View style={styles.viewTabs}>
        <Pressable
          onPress={() => setView('schedule')}
          style={[styles.viewTab, view === 'schedule' && styles.viewTabActive]}
        >
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={18}
            color={view === 'schedule' ? colors.accentStrong : colors.muted}
          />
          <Text style={[styles.viewTabText, view === 'schedule' && styles.viewTabTextActive]}>Calendario</Text>
        </Pressable>
        <Pressable
          onPress={() => setView('standings')}
          style={[styles.viewTab, view === 'standings' && styles.viewTabActive]}
        >
          <MaterialCommunityIcons
            name="trophy-outline"
            size={18}
            color={view === 'standings' ? colors.accentStrong : colors.muted}
          />
          <Text style={[styles.viewTabText, view === 'standings' && styles.viewTabTextActive]}>Classifica</Text>
        </Pressable>
      </View>

      {view === 'schedule' ? (
        <CalendarView
          schedule={schedule}
          calFilter={calFilter}
          onCalFilter={setCalFilter}
          wide={wide}
          isMobile={isMobile}
        />
      ) : (
        <StandingsView
          standings={displayStandings.rows}
          simulated={displayStandings.simulated}
          scope={scope}
          onScope={setScope}
          wide={wide}
          isMobile={isMobile}
        />
      )}
    </View>
  );
}

function CalendarView({
  schedule,
  calFilter,
  onCalFilter,
  wide,
  isMobile,
}: {
  schedule: SeasonMatch[];
  calFilter: MatchCompetition | 'Tutte';
  onCalFilter: (f: MatchCompetition | 'Tutte') => void;
  wide: boolean;
  isMobile: boolean;
}) {
  const bodySize = wide ? 14 : 13;
  const mutedSize = wide ? 12 : 11;
  const logoSize = isMobile ? 28 : 32;

  return (
    <View>
      {/* Filtri competizione */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {calendarCompetitionFilters.map((f) => {
          const active = calFilter === f;
          return (
            <Pressable
              key={f}
              onPress={() => onCalFilter(f)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {competitionLabels[f]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {schedule.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={36} color={colors.mutedDark} />
          <Text style={styles.emptyText}>Nessuna partita in calendario</Text>
        </View>
      ) : (
        <View style={styles.calendarList}>
          {schedule.map((match) => {
            const comp = match.competition ?? 'Campionato';
            const compColor = comp === 'Coppa Italia' ? colors.yellow : comp === 'Amichevole' ? colors.success : colors.accent;
            const compBg = comp === 'Coppa Italia' ? colors.yellowSoft : comp === 'Amichevole' ? colors.successSoft : colors.accentSoft;
            const hasResult = match.homeScore != null && match.awayScore != null;
            const isHomePrato = /\bprato\b/i.test(match.home);
            const isAwayPrato = /\bprato\b/i.test(match.away);
            return (
              <View key={match.id} style={[styles.calCard, wide && styles.calCardWide]}>
                {/* Bordo accent sinistro per competizione */}
                <View style={[styles.calCardAccent, { backgroundColor: compColor }]} />

                <View style={styles.calCardInner}>
                  {/* Intestazione: competizione + turno/descrizione */}
                  <View style={styles.calHeader}>
                    <View style={[styles.calCompBadge, { backgroundColor: compBg, borderColor: compColor }]}>
                      <Text style={[styles.calCompText, { color: compColor, fontSize: mutedSize - 1 }]}>{comp}</Text>
                    </View>
                    <Text style={[styles.calRound, { fontSize: mutedSize }]}>
                      {match.roundLabel || (match.matchday ? `${match.matchday}ª giornata` : '')}
                    </Text>
                  </View>

                  {/* Data e ora */}
                  <View style={styles.calDateTime}>
                    <MaterialCommunityIcons name="calendar-month" size={isMobile ? 15 : 16} color={colors.muted} />
                    <Text style={[styles.calDate, { fontSize: mutedSize }]}>{match.dateLabel || '—'}</Text>
                    {match.time ? (
                      <>
                        <View style={styles.calDateTimeDot} />
                        <MaterialCommunityIcons name="clock-outline" size={isMobile ? 15 : 16} color={colors.muted} />
                        <Text style={[styles.calTime, { fontSize: mutedSize }]}>{match.time}</Text>
                      </>
                    ) : null}
                  </View>

                  {/* Partita */}
                  <View style={styles.calMatchSection}>
                    {/* Squadra casa */}
                    <View style={styles.calTeam}>
                      <TeamLogo name={match.home} size={logoSize} />
                      <Text
                        style={[
                          styles.calTeamName,
                          isHomePrato && styles.calTeamPrato,
                          { fontSize: bodySize },
                        ]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {match.home}
                      </Text>
                    </View>

                    {/* Risultato / VS */}
                    <View style={styles.calResult}>
                      {hasResult ? (
                        <View style={styles.calScoreBox}>
                          <Text style={[styles.calScoreValue, { fontSize: bodySize + 4, color: colors.ink }]}>
                            {match.homeScore}
                          </Text>
                          <Text style={[styles.calScoreDivider, { fontSize: bodySize }]}>:</Text>
                          <Text style={[styles.calScoreValue, { fontSize: bodySize + 4, color: colors.ink }]}>
                            {match.awayScore}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.calVsBox}>
                          <Text style={[styles.calVsText, { fontSize: mutedSize + 1 }]}>VS</Text>
                        </View>
                      )}
                    </View>

                    {/* Squadra trasferta */}
                    <View style={styles.calTeam}>
                      <Text
                        style={[
                          styles.calTeamName,
                          isAwayPrato && styles.calTeamPrato,
                          { fontSize: bodySize, textAlign: 'right' },
                        ]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {match.away}
                      </Text>
                      <TeamLogo name={match.away} size={logoSize} />
                    </View>
                  </View>

                  {/* Stadio e info extra */}
                  {match.venue ? (
                    <View style={styles.calVenue}>
                      <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.mutedDark} />
                      <Text style={[styles.calVenueText, { fontSize: mutedSize - 1 }]} numberOfLines={1}>
                        {match.venue}
                      </Text>
                      {match.leg ? (
                        <>
                          <View style={styles.calDateTimeDot} />
                          <MaterialCommunityIcons name="swap-horizontal" size={12} color={colors.mutedDark} />
                          <Text style={[styles.calVenueText, { fontSize: mutedSize - 1 }]}>{match.leg}</Text>
                        </>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function StandingsView({
  standings,
  simulated,
  scope,
  onScope,
  wide,
  isMobile,
}: {
  standings: Standing[];
  simulated: boolean;
  scope: StandingScope;
  onScope: (s: StandingScope) => void;
  wide: boolean;
  isMobile: boolean;
}) {
  const labelSize = wide ? 13 : 11;
  const bodySize = wide ? 14 : 13;
  const highlightName = wide ? 15 : 14;

  return (
    <View>
      {/* Filtri scope */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {scopeFilters.map((s) => {
          const active = scope === s;
          return (
            <Pressable
              key={s}
              onPress={() => onScope(s)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {scopeLabels[s]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {simulated && (
        <View style={styles.simulatedBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.warning} />
          <Text style={styles.simulatedText}>{SIMULATED_LABEL}</Text>
        </View>
      )}

      {/* Vista Forma: solo posizione, squadra, forma — niente PT/punteggi */}
      {scope === 'form' ? (
        <View style={styles.standingList}>
          {standings.map((row) => {
            const prato = isPrato(row.club);
            return (
              <View key={row.club} style={[styles.standingCard, prato && styles.standingCardPrato]}>
                <View style={styles.formRow}>
                  <Text style={[styles.rankBadge, prato && styles.rankBadgePrato, { fontSize: bodySize }]}>
                    {row.rank}
                  </Text>
                <TeamLogo name={row.club} size={isMobile ? 22 : 26} />
                  <Text
                    style={[styles.standingClub, prato && styles.standingClubPrato, { fontSize: highlightName, flex: 1 }]}
                    numberOfLines={1}
                  >
                    {row.club}
                  </Text>
                  <View style={styles.formIndicators}>
                    {(row.form ?? []).map((f, i) => {
                      const fi = formIcon(f);
                      return (
                        <View key={i} style={[styles.formDot, { backgroundColor: fi.bg, borderColor: fi.color }]}>
                          <Text style={[styles.formDotLabel, { color: fi.color }]}>{fi.label}</Text>
                        </View>
                      );
                    })}
                    {(row.form ?? []).length === 0 && (
                      <Text style={[styles.noFormText, { fontSize: mutedSize }]}>—</Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        /* Vista Generale / Casa / Trasferta: card completa con statistiche */
        <View style={styles.standingList}>
          {/* Header etichette */}
          {!isMobile && (
            <View style={styles.standingHeader}>
              <Text style={[styles.headerCell, styles.headerRank]}>#</Text>
              <Text style={[styles.headerCell, { flex: 2 }]}>Squadra</Text>
              <Text style={[styles.headerCell, { width: 28 }]}>G</Text>
              <Text style={[styles.headerCell, { width: 22 }]}>V</Text>
              <Text style={[styles.headerCell, { width: 22 }]}>N</Text>
              <Text style={[styles.headerCell, { width: 22 }]}>P</Text>
              <Text style={[styles.headerCell, { width: 28 }]}>GF</Text>
              <Text style={[styles.headerCell, { width: 28 }]}>GS</Text>
              <Text style={[styles.headerCell, { width: 30 }]}>DR</Text>
              <Text style={[styles.headerCell, styles.headerPts]}>PT</Text>
              <View style={{ width: isMobile ? 0 : 60 }} />
            </View>
          )}

          {standings.map((row) => {
            const prato = isPrato(row.club);
            return (
              <View key={row.club} style={[styles.standingCard, prato && styles.standingCardPrato]}>
                {/* Riga principale: posizione + stemma + nome + punti */}
                <View style={styles.standingMainRow}>
                  <Text style={[styles.rankBadge, prato && styles.rankBadgePrato, { fontSize: bodySize }]}>
                    {row.rank}
                  </Text>
                  <TeamLogo name={row.club} size={isMobile ? 22 : 26} />
                  <Text
                    style={[styles.standingClub, prato && styles.standingClubPrato, { fontSize: highlightName, flex: 1 }]}
                    numberOfLines={1}
                  >
                    {row.club}
                  </Text>
                  <View style={styles.pointsBadge}>
                    <Text style={[styles.pointsValue, { fontSize: bodySize + 2 }]}>{row.points + (row.penalty ?? 0)}</Text>
                    <Text style={[styles.pointsLabel, { fontSize: mutedSize }]}>PT</Text>
                  </View>
                </View>

                {/* Riga secondaria: statistiche con etichette (G, V, N, P, GF, GS, DR) */}
                <View style={styles.standingStatsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { fontSize: labelSize }]}>G</Text>
                    <Text style={[styles.statValue, { fontSize: bodySize }]}>{row.played}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { fontSize: labelSize }]}>V</Text>
                    <Text style={[styles.statValue, { fontSize: bodySize }]}>{row.wins ?? 0}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { fontSize: labelSize }]}>N</Text>
                    <Text style={[styles.statValue, { fontSize: bodySize }]}>{row.draws ?? 0}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { fontSize: labelSize }]}>P</Text>
                    <Text style={[styles.statValue, { fontSize: bodySize }]}>{row.losses ?? 0}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { fontSize: labelSize }]}>GF</Text>
                    <Text style={[styles.statValue, { fontSize: bodySize }]}>{row.goalsFor ?? 0}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { fontSize: labelSize }]}>GS</Text>
                    <Text style={[styles.statValue, { fontSize: bodySize }]}>{row.goalsAgainst ?? 0}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { fontSize: labelSize }]}>DR</Text>
                    <Text style={[styles.statValueDr, { fontSize: bodySize }, (row.goalDifference ?? 0) > 0 && styles.statPositive, (row.goalDifference ?? 0) < 0 && styles.statNegative]}>
                      {row.goalDifference != null ? (row.goalDifference > 0 ? `+${row.goalDifference}` : `${row.goalDifference}`) : '0'}
                    </Text>
                  </View>
                </View>

              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const mutedSize = 11;

const styles = StyleSheet.create({
  viewTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.pill,
    padding: 4,
    marginBottom: 16,
  },
  viewTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  viewTabActive: {
    backgroundColor: colors.paper,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  viewTabText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.muted,
  },
  viewTabTextActive: {
    color: colors.accentStrong,
  },

  // Filtri
  filterScroll: {
    marginBottom: 12,
  },
  filterContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  filterChipTextActive: {
    color: colors.paper,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '600',
  },

  // Calendario
  calendarList: {
    gap: 10,
  },
  calCard: {
    backgroundColor: colors.paper,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 0,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  calCardWide: {
    // inner padding via calCardInner
  },
  calCardAccent: {
    width: 4,
    alignSelf: 'stretch',
    flexShrink: 0,
  },
  calCardInner: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  calComp: {
    color: colors.accent,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calCompBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  calCompText: {
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  calRound: {
    color: colors.muted,
    fontWeight: '700',
    flexShrink: 0,
  },
  calDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  calDateTimeDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.mutedDark,
    marginHorizontal: 2,
  },
  calDate: {
    color: colors.muted,
    fontWeight: '600',
  },
  calTime: {
    color: colors.muted,
    fontWeight: '700',
  },
  calMatchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
    gap: 6,
  },
  calTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  calTeamName: {
    color: colors.ink,
    fontWeight: '800',
    flexShrink: 1,
  },
  calTeamPrato: {
    color: colors.accentStrong,
  },
  calResult: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  calScoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.xs,
    gap: 4,
  },
  calScoreValue: {
    fontWeight: '900',
    minWidth: 16,
    textAlign: 'center',
  },
  calScoreDivider: {
    color: colors.muted,
    fontWeight: '700',
  },
  calVsBox: {
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  calVsText: {
    color: colors.mutedDark,
    fontWeight: '800',
  },
  calMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  calScore: {
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.xs,
    marginHorizontal: 8,
  },
  calScoreText: {
    color: colors.ink,
    fontWeight: '900',
    letterSpacing: 1,
  },
  calVs: {
    paddingHorizontal: 10,
  },
  calVenue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
    flexWrap: 'wrap',
  },
  calVenueText: {
    color: colors.mutedDark,
    fontWeight: '600',
    flexShrink: 1,
  },

  // Banner simulazione
  simulatedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.yellowSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.xs,
    marginBottom: 12,
  },
  simulatedText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
    flex: 1,
  },

  // Classifica — header (desktop)
  standingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.muted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerRank: {
    width: 32,
  },
  headerPts: {
    width: 36,
  },

  // Classifica — lista
  standingList: {
    gap: 8,
  },

  // Card squadra
  standingCard: {
    backgroundColor: colors.paper,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 12,
    gap: 8,
  },
  standingCardPrato: {
    backgroundColor: '#F4FAFF',
    borderColor: colors.accent,
    borderWidth: 1.5,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  // Riga principale: posizione + stemma + nome + PT
  standingMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSoft,
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: '900',
    color: colors.muted,
    overflow: 'hidden',
  },
  rankBadgePrato: {
    backgroundColor: colors.accentStrong,
    color: colors.paper,
  },
  standingClub: {
    color: colors.ink,
    fontWeight: '800',
  },
  standingClubPrato: {
    color: colors.accentStrong,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.xs,
  },
  pointsValue: {
    color: colors.ink,
    fontWeight: '900',
  },
  pointsLabel: {
    color: colors.muted,
    fontWeight: '800',
  },

  // Riga statistiche
  standingStatsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 10,
    paddingLeft: 4,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 28,
    gap: 1,
  },
  statLabel: {
    color: colors.mutedDark,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statValue: {
    color: colors.ink,
    fontWeight: '800',
  },
  statValueDr: {
    color: colors.ink,
    fontWeight: '800',
  },
  statPositive: {
    color: colors.success,
  },
  statNegative: {
    color: colors.live,
  },

  // Forma (V/N/P) — per tutte le viste
  standingFormRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 4,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formIndicators: {
    flexDirection: 'row',
    gap: 5,
  },
  formDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formDotLabel: {
    fontSize: 10,
    fontWeight: '900',
  },
  noFormText: {
    color: colors.mutedDark,
    fontWeight: '600',
  },

  // Typography helpers
  mutedText: {
    color: colors.muted,
    fontWeight: '600',
    fontSize: mutedSize,
  },
});
