import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { preseasonStandings, provisionalPratoSchedule } from '../../data/season-2026-27';
import { colors } from '../../theme';
import { AppContent, MatchCompetition, SeasonMatch, Standing } from '../../types';
import { Button, Field, adminStyles } from './Primitives';

const competitions: MatchCompetition[] = ['Campionato', 'Coppa Italia', 'Amichevole'];
const number = (value: string | number | undefined) => Number(value) || 0;
const cleanDate = (value: string) => value === 'Data da definire' ? '' : value;
const cleanTime = (value: string) => value === '—' ? '' : value;
const newMatch = (): SeasonMatch => ({ id: '', competition: 'Campionato', roundLabel: '', dateLabel: '', time: '', home: 'AC Prato', away: '', venue: '', sortOrder: Date.now() });

function normalizeStanding(row: Standing, index: number): Standing {
  const goalsFor = number(row.goalsFor);
  const goalsAgainst = number(row.goalsAgainst);
  return {
    ...row,
    rank: row.rank || index + 1,
    played: number(row.played),
    wins: number(row.wins),
    draws: number(row.draws),
    losses: number(row.losses),
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    points: number(row.points),
    form: row.form ?? [],
  };
}

function normalizeMatch(match: SeasonMatch, index: number): SeasonMatch {
  return {
    ...match,
    id: match.id || `calendar-${Date.now()}-${index}`,
    competition: match.competition ?? 'Campionato',
    roundLabel: match.roundLabel ?? (match.matchday ? `${match.matchday}ª giornata` : ''),
    dateLabel: cleanDate(match.dateLabel ?? ''),
    time: cleanTime(match.time ?? ''),
    venue: match.venue ?? '',
    sortOrder: match.sortOrder ?? index,
  };
}

function dateKey(match: SeasonMatch): number {
  const date = match.dateLabel.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
  if (date) return Date.UTC(Number(date[3]), Number(date[2]) - 1, Number(date[1]));
  return 9_000_000_000_000 + (match.sortOrder ?? 0);
}

function competitionFrom(value: string): MatchCompetition | null {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes('amichev')) return 'Amichevole';
  if (normalized.includes('coppa')) return 'Coppa Italia';
  if (normalized.includes('campionato') || normalized.includes('serie d')) return 'Campionato';
  return null;
}

export function CompetitionAdmin({ content, onChange }: { content: AppContent; onChange: (next: AppContent) => Promise<void> }) {
  const initialSchedule = useMemo<SeasonMatch[]>(() => (content.schedule?.length ? content.schedule : provisionalPratoSchedule).map(normalizeMatch), [content.schedule]);
  const initialStandings = useMemo<Standing[]>(() => (content.standings.length >= 18 ? content.standings : preseasonStandings).map((row, index) => normalizeStanding(row, index)), [content.standings]);
  const [schedule, setSchedule] = useState<SeasonMatch[]>(initialSchedule);
  const [draft, setDraft] = useState<SeasonMatch>(newMatch());
  const [standings, setStandings] = useState<Standing[]>(initialStandings);
  const [scheduleImport, setScheduleImport] = useState('');
  const [standingsImport, setStandingsImport] = useState('');

  const updateDraft = <K extends keyof SeasonMatch>(key: K, value: SeasonMatch[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const updateMatch = (id: string, patch: Partial<SeasonMatch>) => setSchedule((current) => current.map((match) => match.id === id ? { ...match, ...patch } : match));
  const updateStanding = (club: string, patch: Partial<Standing>) => setStandings((current) => current.map((row) => row.club === club ? normalizeStanding({ ...row, ...patch }, row.rank - 1) : row));

  const addMatch = () => {
    if (!draft.home.trim() || !draft.away.trim()) return Alert.alert('Squadre mancanti', 'Inserisci squadra di casa e squadra ospite.');
    const item = normalizeMatch({ ...draft, id: `calendar-${Date.now()}`, home: draft.home.trim(), away: draft.away.trim() }, schedule.length);
    setSchedule((current) => [...current, item]);
    setDraft(newMatch());
  };

  const saveSchedule = () => {
    const sorted = schedule
      .map((match, index) => normalizeMatch(match, index))
      .sort((a, b) => dateKey(a) - dateKey(b))
      .map((match, index) => ({ ...match, sortOrder: index }));
    setSchedule(sorted);
    void onChange({ ...content, schedule: sorted });
  };

  const saveStandings = () => {
    const sorted = [...standings]
      .map((row, index) => normalizeStanding(row, index))
      .sort((a, b) => b.points - a.points || number(b.goalDifference) - number(a.goalDifference) || number(b.goalsFor) - number(a.goalsFor) || a.club.localeCompare(b.club, 'it'))
      .map((row, index) => ({ ...row, rank: index + 1 }));
    setStandings(sorted);
    void onChange({ ...content, standings: sorted });
  };

  const importSchedule = () => {
    const rows = scheduleImport.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const parsed: SeasonMatch[] = [];
    rows.forEach((line, index) => {
      const cells = line.split(/\t|;/).map((cell) => cell.trim());
      const competition = competitionFrom(cells[0] ?? '');
      if (competition) {
        if (cells.length < 6) return;
        const match: SeasonMatch = {
          id: `calendar-import-${Date.now()}-${index}`,
          competition,
          roundLabel: cells[1] ?? '',
          dateLabel: cells[2] ?? '',
          time: cells[3] ?? '',
          home: cells[4] ?? '',
          away: cells[5] ?? '',
          venue: cells[6] ?? '',
          sortOrder: index,
        };
        if (cells[7] !== '' && cells[7] !== undefined) match.homeScore = number(cells[7]);
        if (cells[8] !== '' && cells[8] !== undefined) match.awayScore = number(cells[8]);
        if (match.home && match.away) parsed.push(match);
        return;
      }

      if (cells.length < 5) return;
      const matchday = number(cells[0]) || index + 1;
      const match: SeasonMatch = {
        id: `calendar-import-${Date.now()}-${index}`,
        matchday,
        leg: matchday <= 17 ? 'Andata' : 'Ritorno',
        competition: 'Campionato',
        roundLabel: `${matchday}ª giornata`,
        dateLabel: cells[1],
        time: cells[2],
        home: cells[3],
        away: cells[4],
        venue: '',
        sortOrder: index,
      };
      if (cells[5] !== '' && cells[5] !== undefined) match.homeScore = number(cells[5]);
      if (cells[6] !== '' && cells[6] !== undefined) match.awayScore = number(cells[6]);
      parsed.push(match);
    });
    if (!parsed.length) return Alert.alert('Formato non riconosciuto', 'Usa: competizione;turno;data;ora;casa;trasferta;stadio;gol casa;gol ospite.');
    setSchedule(parsed);
    setScheduleImport('');
  };

  const importStandings = () => {
    const rows = standingsImport.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const parsed = rows.map((line, index) => {
      const cells = line.split(/\t|;/).map((cell) => cell.trim());
      if (cells.length < 9) return null;
      const goalsFor = number(cells[6]);
      const goalsAgainst = number(cells[7]);
      return normalizeStanding({ rank: number(cells[0]) || index + 1, club: cells[1], played: number(cells[2]), wins: number(cells[3]), draws: number(cells[4]), losses: number(cells[5]), goalsFor, goalsAgainst, goalDifference: goalsFor - goalsAgainst, points: number(cells[8]), form: [] }, index);
    }).filter((row): row is Standing => !!row && !!row.club);
    if (!parsed.length) return Alert.alert('Formato non riconosciuto', 'Usa una riga per squadra: posizione;squadra;G;V;N;P;GF;GS;PT.');
    setStandings(parsed);
    setStandingsImport('');
  };

  return <View style={{ gap: 14 }}>
    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Aggiungi partita</Text>
      <CompetitionChoices value={draft.competition ?? 'Campionato'} onChange={(competition) => updateDraft('competition', competition)} />
      <View style={adminStyles.row}><Field label="Turno o descrizione" value={draft.roundLabel ?? ''} onChangeText={(value) => updateDraft('roundLabel', value)} placeholder="1ª giornata / Sedicesimi / Test" /><Field label="Data" value={draft.dateLabel} onChangeText={(value) => updateDraft('dateLabel', value)} placeholder="06/09/2026" /><Field label="Ora" value={draft.time} onChangeText={(value) => updateDraft('time', value)} placeholder="15:00" /></View>
      <View style={adminStyles.row}><Field label="Casa" value={draft.home} onChangeText={(value) => updateDraft('home', value)} /><Field label="Trasferta" value={draft.away} onChangeText={(value) => updateDraft('away', value)} /><Field label="Stadio" value={draft.venue ?? ''} onChangeText={(value) => updateDraft('venue', value)} /></View>
      <Button label="Aggiungi al calendario" icon="calendar-plus" onPress={addMatch} />
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Importa dati</Text>
      <Field label="Calendario" value={scheduleImport} onChangeText={setScheduleImport} multiline placeholder="Coppa Italia;Turno preliminare;30/08/2026;16:00;AC Prato;Sangiovannese;Lungobisenzio;;" />
      <Button label="Importa calendario" icon="calendar-import" secondary onPress={importSchedule} />
      <Field label="Classifica" value={standingsImport} onChangeText={setStandingsImport} multiline placeholder="1;AC Prato;1;1;0;0;2;0;3" />
      <Button label="Importa classifica" icon="table-arrow-down" secondary onPress={importStandings} />
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Calendario</Text>
      <View style={adminStyles.list}>{schedule.map((match) => <View key={match.id} style={adminStyles.listRow}>
        <View style={{ width: 54, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: match.competition === 'Coppa Italia' ? colors.navy : match.competition === 'Amichevole' ? colors.success : colors.accentStrong }}><Text style={{ color: colors.paper, fontSize: 9, fontWeight: '900' }}>{match.competition === 'Coppa Italia' ? 'COPPA' : match.competition === 'Amichevole' ? 'AMIC' : 'CAMP'}</Text></View>
        <View style={adminStyles.listBody}>
          <Text style={adminStyles.listTitle}>{match.home} – {match.away}</Text>
          <CompetitionChoices value={match.competition ?? 'Campionato'} onChange={(competition) => updateMatch(match.id, { competition })} compact />
          <View style={adminStyles.row}><Field label="Turno" value={match.roundLabel ?? ''} onChangeText={(value) => updateMatch(match.id, { roundLabel: value })} /><Field label="Data" value={match.dateLabel} onChangeText={(value) => updateMatch(match.id, { dateLabel: value })} /><Field label="Ora" value={match.time} onChangeText={(value) => updateMatch(match.id, { time: value })} /></View>
          <View style={adminStyles.row}><Field label="Casa" value={match.home} onChangeText={(value) => updateMatch(match.id, { home: value })} /><Field label="Trasferta" value={match.away} onChangeText={(value) => updateMatch(match.id, { away: value })} /><Field label="Stadio" value={match.venue ?? ''} onChangeText={(value) => updateMatch(match.id, { venue: value })} /></View>
          <View style={adminStyles.row}><Field label="Gol casa" value={match.homeScore === undefined ? '' : String(match.homeScore)} onChangeText={(value) => updateMatch(match.id, { homeScore: value === '' ? undefined : number(value) })} keyboardType="numeric" /><Field label="Gol ospite" value={match.awayScore === undefined ? '' : String(match.awayScore)} onChangeText={(value) => updateMatch(match.id, { awayScore: value === '' ? undefined : number(value) })} keyboardType="numeric" /></View>
        </View>
        <Pressable onPress={() => setSchedule((current) => current.filter((item) => item.id !== match.id))}><MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.live} /></Pressable>
      </View>)}</View>
      <Button label="Salva calendario" icon="content-save-outline" onPress={saveSchedule} />
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Classifica</Text>
      <View style={adminStyles.list}>{standings.map((row) => <View key={row.club} style={adminStyles.listRow}>
        <View style={{ width: 32, alignItems: 'center' }}><Text style={{ color: colors.accentStrong, fontWeight: '900' }}>{row.rank}</Text></View>
        <View style={adminStyles.listBody}>
          <Text style={adminStyles.listTitle}>{row.club}</Text>
          <View style={adminStyles.row}>
            <Field label="G" value={String(row.played)} onChangeText={(value) => updateStanding(row.club, { played: number(value) })} keyboardType="numeric" />
            <Field label="V" value={String(number(row.wins))} onChangeText={(value) => updateStanding(row.club, { wins: number(value) })} keyboardType="numeric" />
            <Field label="N" value={String(number(row.draws))} onChangeText={(value) => updateStanding(row.club, { draws: number(value) })} keyboardType="numeric" />
            <Field label="P" value={String(number(row.losses))} onChangeText={(value) => updateStanding(row.club, { losses: number(value) })} keyboardType="numeric" />
            <Field label="GF" value={String(number(row.goalsFor))} onChangeText={(value) => updateStanding(row.club, { goalsFor: number(value) })} keyboardType="numeric" />
            <Field label="GS" value={String(number(row.goalsAgainst))} onChangeText={(value) => updateStanding(row.club, { goalsAgainst: number(value) })} keyboardType="numeric" />
            <Field label="PT" value={String(row.points)} onChangeText={(value) => updateStanding(row.club, { points: number(value) })} keyboardType="numeric" />
          </View>
        </View>
      </View>)}</View>
      <Button label="Salva classifica" icon="content-save-outline" onPress={saveStandings} />
    </View>
  </View>;
}

function CompetitionChoices({ value, onChange, compact = false }: { value: MatchCompetition; onChange: (value: MatchCompetition) => void; compact?: boolean }) {
  return <View style={[adminStyles.choices, compact && { marginTop: 8 }]}>{competitions.map((competition) => <Pressable key={competition} onPress={() => onChange(competition)} style={[adminStyles.choice, compact && { paddingVertical: 7 }, value === competition && adminStyles.choiceActive]}><Text style={[adminStyles.choiceText, value === competition && adminStyles.choiceTextActive]}>{competition === 'Amichevole' ? 'Amichevole' : competition}</Text></Pressable>)}</View>;
}
