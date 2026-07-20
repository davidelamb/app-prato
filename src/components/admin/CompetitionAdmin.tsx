import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { preseasonStandings, provisionalPratoSchedule } from '../../data/season-2026-27';
import { colors } from '../../theme';
import { AppContent, MatchCompetition, SeasonMatch, Standing, StandingScope } from '../../types';
import { emptyStandingRows, normalizeStandingRow, numberValue, parseForm, setStandingRows, sortStandingRows, standingScopes } from '../../utils/standings';
import { Button, Field, adminStyles } from './Primitives';

const competitions: MatchCompetition[] = ['Campionato', 'Coppa Italia', 'Amichevole'];
const number = (value: string | number | undefined) => Number(value) || 0;
const cleanDate = (value: string) => value === 'Data da definire' ? '' : value;
const cleanTime = (value: string) => value === '—' ? '' : value;
const newMatch = (): SeasonMatch => ({ id: '', competition: 'Campionato', roundLabel: '', dateLabel: '', time: '', home: 'AC Prato', away: '', venue: '', sortOrder: Date.now() });

function normalizeMatch(match: SeasonMatch, index: number): SeasonMatch {
  return { ...match, id: match.id || `calendar-${Date.now()}-${index}`, competition: match.competition ?? 'Campionato', roundLabel: match.roundLabel ?? (match.matchday ? `${match.matchday}ª giornata` : ''), dateLabel: cleanDate(match.dateLabel ?? ''), time: cleanTime(match.time ?? ''), venue: match.venue ?? '', sortOrder: match.sortOrder ?? index };
}

function dateKey(match: SeasonMatch): number {
  const date = match.dateLabel.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
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
  const initialStandingTables = useMemo<Record<StandingScope, Standing[]>>(() => {
    const overall = (content.standings.length >= 18 ? content.standings : preseasonStandings).map(normalizeStandingRow);
    const empty = emptyStandingRows(overall);
    return {
      overall,
      home: content.homeStandings?.length === overall.length ? content.homeStandings.map(normalizeStandingRow) : empty,
      away: content.awayStandings?.length === overall.length ? content.awayStandings.map(normalizeStandingRow) : empty,
      form: content.formStandings?.length === overall.length ? content.formStandings.map(normalizeStandingRow) : empty,
    };
  }, [content.standings, content.homeStandings, content.awayStandings, content.formStandings]);

  const [schedule, setSchedule] = useState<SeasonMatch[]>(initialSchedule);
  const [draft, setDraft] = useState<SeasonMatch>(newMatch());
  const [standingScope, setStandingScope] = useState<StandingScope>('overall');
  const [standingTables, setStandingTables] = useState<Record<StandingScope, Standing[]>>(initialStandingTables);
  const [scheduleImport, setScheduleImport] = useState('');
  const [standingsImport, setStandingsImport] = useState('');
  const standings = standingTables[standingScope];
  const scopeLabel = standingScopes.find((item) => item.value === standingScope)?.label ?? 'Generale';

  const updateDraft = <K extends keyof SeasonMatch>(key: K, value: SeasonMatch[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const updateMatch = (id: string, patch: Partial<SeasonMatch>) => setSchedule((current) => current.map((match) => match.id === id ? { ...match, ...patch } : match));
  const updateStanding = (club: string, patch: Partial<Standing>) => setStandingTables((current) => ({ ...current, [standingScope]: current[standingScope].map((row, index) => row.club === club ? normalizeStandingRow({ ...row, ...patch }, index) : row) }));

  const addMatch = () => {
    if (!draft.home.trim() || !draft.away.trim()) return Alert.alert('Squadre mancanti', 'Inserisci squadra di casa e squadra ospite.');
    setSchedule((current) => [...current, normalizeMatch({ ...draft, id: `calendar-${Date.now()}`, home: draft.home.trim(), away: draft.away.trim() }, current.length)]);
    setDraft(newMatch());
  };

  const saveSchedule = () => {
    const sorted = schedule.map(normalizeMatch).sort((a, b) => dateKey(a) - dateKey(b)).map((match, index) => ({ ...match, sortOrder: index }));
    setSchedule(sorted);
    void onChange({ ...content, schedule: sorted });
  };

  const saveStandings = () => {
    const sorted = sortStandingRows(standings);
    setStandingTables((current) => ({ ...current, [standingScope]: sorted }));
    void onChange(setStandingRows(content, standingScope, sorted));
  };

  const importSchedule = () => {
    const rows = scheduleImport.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const parsed: SeasonMatch[] = [];
    rows.forEach((line, index) => {
      const cells = line.split(/\t|;/).map((cell) => cell.trim());
      const competition = competitionFrom(cells[0] ?? '');
      if (competition) {
        if (cells.length < 6) return;
        const match: SeasonMatch = { id: `calendar-import-${Date.now()}-${index}`, competition, roundLabel: cells[1] ?? '', dateLabel: cells[2] ?? '', time: cells[3] ?? '', home: cells[4] ?? '', away: cells[5] ?? '', venue: cells[6] ?? '', sortOrder: index };
        if (cells[7] !== '' && cells[7] !== undefined) match.homeScore = number(cells[7]);
        if (cells[8] !== '' && cells[8] !== undefined) match.awayScore = number(cells[8]);
        if (match.home && match.away) parsed.push(match);
        return;
      }
      if (cells.length < 5) return;
      const matchday = number(cells[0]) || index + 1;
      const match: SeasonMatch = { id: `calendar-import-${Date.now()}-${index}`, matchday, leg: matchday <= 17 ? 'Andata' : 'Ritorno', competition: 'Campionato', roundLabel: `${matchday}ª giornata`, dateLabel: cells[1], time: cells[2], home: cells[3], away: cells[4], venue: '', sortOrder: index };
      if (cells[5] !== '' && cells[5] !== undefined) match.homeScore = number(cells[5]);
      if (cells[6] !== '' && cells[6] !== undefined) match.awayScore = number(cells[6]);
      parsed.push(match);
    });
    if (!parsed.length) return Alert.alert('Formato non riconosciuto', 'Usa: competizione;turno;data;ora;casa;trasferta;stadio;gol casa;gol ospite.');
    setSchedule(parsed);
    setScheduleImport('');
  };

  const importStandings = () => {
    const parsed = standingsImport.split(/\r?\n/).map((line, index) => {
      const cells = line.trim().split(/\t|;/).map((cell) => cell.trim());
      if (cells.length < 9) return null;
      const goalsFor = number(cells[6]);
      const goalsAgainst = number(cells[7]);
      return normalizeStandingRow({ rank: number(cells[0]) || index + 1, club: cells[1], played: number(cells[2]), wins: number(cells[3]), draws: number(cells[4]), losses: number(cells[5]), goalsFor, goalsAgainst, goalDifference: goalsFor - goalsAgainst, points: number(cells[8]), form: parseForm(cells[9] ?? '') }, index);
    }).filter((row): row is Standing => !!row?.club);
    if (!parsed.length) return Alert.alert('Formato non riconosciuto', 'Usa: posizione;squadra;G;V;N;P;GF;GS;PT;ultime 5.');
    setStandingTables((current) => ({ ...current, [standingScope]: parsed }));
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
      <StandingChoices value={standingScope} onChange={setStandingScope} />
      <Field label={`Classifica ${scopeLabel}`} value={standingsImport} onChangeText={setStandingsImport} multiline placeholder="1;AC Prato;5;3;1;1;8;4;10;V,V,N,P,V" />
      <Button label={`Importa ${scopeLabel.toLowerCase()}`} icon="table-arrow-down" secondary onPress={importStandings} />
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Calendario</Text>
      <View style={adminStyles.list}>{schedule.map((match) => <View key={match.id} style={adminStyles.listRow}>
        <View style={{ width: 54, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: match.competition === 'Coppa Italia' ? colors.navy : match.competition === 'Amichevole' ? colors.success : colors.accentStrong }}><Text style={{ color: colors.paper, fontSize: 9, fontWeight: '900' }}>{match.competition === 'Coppa Italia' ? 'COPPA' : match.competition === 'Amichevole' ? 'AMIC' : 'CAMP'}</Text></View>
        <View style={adminStyles.listBody}><Text style={adminStyles.listTitle}>{match.home} – {match.away}</Text><CompetitionChoices value={match.competition ?? 'Campionato'} onChange={(competition) => updateMatch(match.id, { competition })} compact /><View style={adminStyles.row}><Field label="Turno" value={match.roundLabel ?? ''} onChangeText={(value) => updateMatch(match.id, { roundLabel: value })} /><Field label="Data" value={match.dateLabel} onChangeText={(value) => updateMatch(match.id, { dateLabel: value })} /><Field label="Ora" value={match.time} onChangeText={(value) => updateMatch(match.id, { time: value })} /></View><View style={adminStyles.row}><Field label="Casa" value={match.home} onChangeText={(value) => updateMatch(match.id, { home: value })} /><Field label="Trasferta" value={match.away} onChangeText={(value) => updateMatch(match.id, { away: value })} /><Field label="Stadio" value={match.venue ?? ''} onChangeText={(value) => updateMatch(match.id, { venue: value })} /></View><View style={adminStyles.row}><Field label="Gol casa" value={match.homeScore === undefined ? '' : String(match.homeScore)} onChangeText={(value) => updateMatch(match.id, { homeScore: value === '' ? undefined : number(value) })} keyboardType="numeric" /><Field label="Gol ospite" value={match.awayScore === undefined ? '' : String(match.awayScore)} onChangeText={(value) => updateMatch(match.id, { awayScore: value === '' ? undefined : number(value) })} keyboardType="numeric" /></View></View>
        <Pressable onPress={() => setSchedule((current) => current.filter((item) => item.id !== match.id))}><MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.live} /></Pressable>
      </View>)}</View>
      <Button label="Salva calendario" icon="content-save-outline" onPress={saveSchedule} />
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Classifica</Text>
      <StandingChoices value={standingScope} onChange={setStandingScope} />
      <View style={adminStyles.list}>{standings.map((row) => <View key={row.club} style={adminStyles.listRow}><View style={{ width: 32, alignItems: 'center' }}><Text style={{ color: colors.accentStrong, fontWeight: '900' }}>{row.rank}</Text></View><View style={adminStyles.listBody}><Text style={adminStyles.listTitle}>{row.club}</Text><View style={adminStyles.row}><Field label="G" value={String(row.played)} onChangeText={(value) => updateStanding(row.club, { played: number(value) })} keyboardType="numeric" /><Field label="V" value={String(numberValue(row.wins))} onChangeText={(value) => updateStanding(row.club, { wins: number(value) })} keyboardType="numeric" /><Field label="N" value={String(numberValue(row.draws))} onChangeText={(value) => updateStanding(row.club, { draws: number(value) })} keyboardType="numeric" /><Field label="P" value={String(numberValue(row.losses))} onChangeText={(value) => updateStanding(row.club, { losses: number(value) })} keyboardType="numeric" /><Field label="GF" value={String(numberValue(row.goalsFor))} onChangeText={(value) => updateStanding(row.club, { goalsFor: number(value) })} keyboardType="numeric" /><Field label="GS" value={String(numberValue(row.goalsAgainst))} onChangeText={(value) => updateStanding(row.club, { goalsAgainst: number(value) })} keyboardType="numeric" /><Field label="PT" value={String(row.points)} onChangeText={(value) => updateStanding(row.club, { points: number(value) })} keyboardType="numeric" />{standingScope === 'form' ? <Field label="Ultime 5" value={(row.form ?? []).map((item) => item === 'W' ? 'V' : item === 'D' ? 'N' : 'P').join(',')} onChangeText={(value) => updateStanding(row.club, { form: parseForm(value) })} /> : null}</View></View></View>)}</View>
      <Button label={`Salva classifica ${scopeLabel.toLowerCase()}`} icon="content-save-outline" onPress={saveStandings} />
    </View>
  </View>;
}

function CompetitionChoices({ value, onChange, compact = false }: { value: MatchCompetition; onChange: (value: MatchCompetition) => void; compact?: boolean }) {
  return <View style={[adminStyles.choices, compact && { marginTop: 8 }]}>{competitions.map((competition) => <Pressable key={competition} onPress={() => onChange(competition)} style={[adminStyles.choice, compact && { paddingVertical: 7 }, value === competition && adminStyles.choiceActive]}><Text style={[adminStyles.choiceText, value === competition && adminStyles.choiceTextActive]}>{competition}</Text></Pressable>)}</View>;
}

function StandingChoices({ value, onChange }: { value: StandingScope; onChange: (value: StandingScope) => void }) {
  return <View style={adminStyles.choices}>{standingScopes.map((scope) => <Pressable key={scope.value} onPress={() => onChange(scope.value)} style={[adminStyles.choice, value === scope.value && adminStyles.choiceActive]}><Text style={[adminStyles.choiceText, value === scope.value && adminStyles.choiceTextActive]}>{scope.label}</Text></Pressable>)}</View>;
}
