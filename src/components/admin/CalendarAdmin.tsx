import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { colors } from '../../theme';
import { AppContent, MatchCompetition, SeasonMatch } from '../../types';
import { synchronizeSchedule } from '../../utils/match-sync';
import { Button, Field, adminStyles } from './Primitives';

const competitions: MatchCompetition[] = ['Campionato', 'Coppa Italia', 'Amichevole'];
const number = (value: string | number | undefined) => Number(value) || 0;
const cleanDate = (value: string) => value === 'Data da definire' ? '' : value;
const cleanTime = (value: string) => value === '—' ? '' : value;
const newMatch = (): SeasonMatch => ({ id: '', competition: 'Campionato', roundLabel: '', dateLabel: '', time: '', home: 'AC Prato', away: '', venue: '', sortOrder: Date.now() });

function scoreInput(value: string): number | undefined | null {
  if (value === '') return undefined;
  if (!/^\d+$/.test(value)) return null;
  const score = Number(value);
  return Number.isSafeInteger(score) ? score : null;
}

function normalizeMatch(match: SeasonMatch, index: number): SeasonMatch {
  const hasResult = Number.isInteger(match.homeScore) && Number.isInteger(match.awayScore);
  const competition = match.competition ?? 'Campionato';
  const roundLabel = match.roundLabel ?? (match.matchday ? `${match.matchday}ª giornata` : '');
  const inferredMatchday = competition === 'Campionato'
    ? (Number(match.matchday) || Number(String(roundLabel).match(/\d+/)?.[0]) || undefined)
    : match.matchday;
  return { ...match, id: match.id || `calendar-${Date.now()}-${index}`, competition, matchday: inferredMatchday, roundLabel, dateLabel: cleanDate(match.dateLabel ?? ''), time: cleanTime(match.time ?? ''), venue: match.venue ?? '', sortOrder: match.sortOrder ?? index, status: match.status === 'live' ? 'live' : hasResult ? 'final' : 'scheduled' };
}

function dateKey(match: SeasonMatch): number {
  const date = String(match.dateLabel).match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  if (date) return Date.UTC(Number(date[3]), Number(date[2]) - 1, Number(date[1]));
  return 9_000_000_000_000 + (match.sortOrder ?? 0);
}

function competitionFrom(value: string): MatchCompetition | null {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes('coppa')) return 'Coppa Italia';
  if (normalized.includes('amichevol')) return 'Amichevole';
  if (normalized.includes('campionato') || normalized.includes('serie d')) return 'Campionato';
  return null;
}

export function CalendarAdmin({ content, onChange }: { content: AppContent; onChange: (next: AppContent) => Promise<void> }) {
  const initialSchedule = useMemo<SeasonMatch[]>(
    () => (content.schedule ?? [])
      .filter((m) => (m.competition ?? 'Campionato') === 'Campionato' || m.competition === 'Coppa Italia' || m.competition === 'Amichevole')
      .map(normalizeMatch),
    [content.schedule],
  );
  const [schedule, setSchedule] = useState<SeasonMatch[]>(initialSchedule);
  const [draft, setDraft] = useState<SeasonMatch>(newMatch());
  const [scheduleImport, setScheduleImport] = useState('');
  const [importPreview, setImportPreview] = useState<SeasonMatch[] | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'csv' | 'json'>('csv');
  const [listCompetition, setListCompetition] = useState<MatchCompetition>('Campionato');
  const [selectedMatchday, setSelectedMatchday] = useState(1);

  const visibleSchedule = useMemo(
    () => schedule.filter((match) => {
      const competition = match.competition ?? 'Campionato';
      if (competition !== listCompetition) return false;
      return listCompetition !== 'Campionato' || match.matchday === selectedMatchday;
    }),
    [listCompetition, schedule, selectedMatchday],
  );

  const updateDraft = <K extends keyof SeasonMatch>(key: K, value: SeasonMatch[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const updateMatch = (id: string, patch: Partial<SeasonMatch>) => setSchedule((current) => current.map((match) => match.id === id ? { ...match, ...patch } : match));

  const addMatch = () => {
    if (!draft.home.trim() || !draft.away.trim()) return Alert.alert('Squadre mancanti', 'Inserisci squadra di casa e squadra ospite.');
    if (draft.competition === 'Campionato' && (!Number.isInteger(draft.matchday) || Number(draft.matchday) < 1 || Number(draft.matchday) > 34)) {
      return Alert.alert('Giornata mancante', 'Per il Campionato inserisci una giornata da 1 a 34.');
    }
    setSchedule((current) => [...current, normalizeMatch({ ...draft, id: `calendar-${Date.now()}`, home: draft.home.trim(), away: draft.away.trim() }, current.length)]);
    if (draft.competition === 'Campionato' && draft.matchday) setSelectedMatchday(draft.matchday);
    setListCompetition(draft.competition ?? 'Campionato');
    setDraft(newMatch());
  };

  const saveSchedule = () => {
    const sorted = schedule.map(normalizeMatch).sort((a, b) => dateKey(a) - dateKey(b)).map((match, index) => ({ ...match, sortOrder: index }));
    const invalid = sorted.some((match) => (match.homeScore === undefined) !== (match.awayScore === undefined)
      || (match.homeScore !== undefined && (!Number.isInteger(match.homeScore) || match.homeScore < 0))
      || (match.awayScore !== undefined && (!Number.isInteger(match.awayScore) || match.awayScore < 0)));
    if (invalid) return Alert.alert('Risultato non valido', 'Inserisci due numeri interi non negativi oppure lascia entrambi i campi vuoti.');
    setSchedule(sorted);
    const activeIds = new Set(sorted.map((match) => match.id));
    const deletedScheduleMatchIds = [
      ...(content.deletedScheduleMatchIds ?? []),
      ...(content.schedule ?? []).filter((match) => !activeIds.has(match.id)).map((match) => match.id),
    ].filter((matchId, index, ids) => ids.indexOf(matchId) === index && !activeIds.has(matchId));
    void onChange(synchronizeSchedule({ ...content, deletedScheduleMatchIds }, sorted));
  };

  const setMatchScore = (id: string, side: 'homeScore' | 'awayScore', value: string) => {
    const score = scoreInput(value);
    if (score !== null) updateMatch(id, { [side]: score });
  };

  const previewCsv = () => {
    const errors: string[] = [];
    const rows = scheduleImport.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!rows.length) { setImportErrors(['Nessuna riga trovata.']); setImportPreview(null); return; }
    const parsed: SeasonMatch[] = [];
    rows.forEach((line, index) => {
      const cells = line.split(/\t|;/).map((cell) => cell.trim());
      const competition = competitionFrom(cells[0] ?? '');
      if (competition) {
        if (cells.length < 6) { errors.push(`Riga ${index + 1}: colonne insufficienti (minimo 6 per competizione esplicita).`); return; }
        const match: SeasonMatch = { id: `prev-${index}`, competition, roundLabel: cells[1] ?? '', dateLabel: cells[2] ?? '', time: cells[3] ?? '', home: cells[4] ?? '', away: cells[5] ?? '', venue: cells[6] ?? '', sortOrder: index };
        if (cells[7] !== '' && cells[7] !== undefined) match.homeScore = number(cells[7]);
        if (cells[8] !== '' && cells[8] !== undefined) match.awayScore = number(cells[8]);
        if (match.home && match.away) parsed.push(match);
        else errors.push(`Riga ${index + 1}: casa o trasferta vuoti.`);
        return;
      }
      errors.push(`Riga ${index + 1}: specifica "Campionato", "Coppa Italia" o "Amichevole" come prima colonna.`);
    });
    setImportErrors(errors);
    setImportPreview(parsed.length ? parsed : null);
    if (!parsed.length && !errors.length) setImportErrors(['Nessuna partita valida trovata.']);
  };

  const previewJson = () => {
    try {
      const data = JSON.parse(scheduleImport);
      const arr: unknown[] = Array.isArray(data) ? data : (data?.matches ?? data?.schedule ?? data?.data ?? []);
      if (!Array.isArray(arr) || !arr.length) { setImportErrors(['JSON non è un array o è vuoto.']); setImportPreview(null); return; }
      const errors: string[] = [];
      const parsed: SeasonMatch[] = [];
      (arr as Array<Record<string, unknown>>).forEach((obj, index) => {
        if (typeof obj !== 'object' || !obj) { errors.push(`Elemento ${index + 1}: non è un oggetto valido.`); return; }
        const comp = competitionFrom(String(obj.competition ?? obj.comp ?? ''));
        const home = String(obj.home ?? obj.casa ?? '');
        const away = String(obj.away ?? obj.trasferta ?? '');
        if (!home || !away) { errors.push(`Elemento ${index + 1}: casa o trasferta mancanti.`); return; }
        if (comp !== 'Coppa Italia' && comp !== 'Campionato' && comp !== 'Amichevole') {
          errors.push(`Elemento ${index + 1}: specifica "competition": "Campionato", "Coppa Italia" o "Amichevole".`);
          return;
        }
        const match: SeasonMatch = {
          id: String(obj.id ?? `prev-${index}`),
          matchday: number(String(obj.matchday ?? obj.giornata ?? '')),
          competition: comp ?? 'Campionato',
          roundLabel: String(obj.roundLabel ?? obj.turno ?? ''),
          dateLabel: String(obj.dateLabel ?? obj.data ?? ''),
          time: String(obj.time ?? obj.ora ?? ''),
          home,
          away,
          venue: String(obj.venue ?? obj.stadio ?? ''),
          sortOrder: index,
        };
        if (obj.homeScore !== undefined) match.homeScore = number(obj.homeScore as string | number);
        if (obj.awayScore !== undefined) match.awayScore = number(obj.awayScore as string | number);
        parsed.push(match);
      });
      setImportErrors(errors);
      setImportPreview(parsed.length ? parsed : null);
    } catch {
      setImportErrors(['JSON non valido. Controlla la sintassi.']);
      setImportPreview(null);
    }
  };

  const previewImport = () => {
    if (importMode === 'json') previewJson();
    else previewCsv();
  };

  const confirmImport = () => {
    if (!importPreview?.length) return;
    setSchedule(importPreview.map((m, i) => normalizeMatch({ ...m, id: `calendar-import-${Date.now()}-${i}`, sortOrder: i }, i)));
    setImportPreview(null);
    setImportErrors([]);
    setScheduleImport('');
  };

  return <View style={{ gap: 14 }}>
    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Aggiungi partita</Text>
      <CompetitionChoices value={draft.competition ?? 'Campionato'} onChange={(competition) => updateDraft('competition', competition)} />
      <View style={adminStyles.row}><Field label="Giornata" value={draft.matchday ? String(draft.matchday) : ''} onChangeText={(v) => updateDraft('matchday', v ? Number(v) : undefined)} keyboardType="numeric" /><Field label="Turno o descrizione" value={draft.roundLabel ?? ''} onChangeText={(v) => updateDraft('roundLabel', v)} placeholder="1ª giornata / Sedicesimi" /><Field label="Data" value={draft.dateLabel} onChangeText={(v) => updateDraft('dateLabel', v)} placeholder="06/09/2026" /><Field label="Ora" value={draft.time} onChangeText={(v) => updateDraft('time', v)} placeholder="15:00" /></View>
      <View style={adminStyles.row}><Field label="Casa" value={draft.home} onChangeText={(v) => updateDraft('home', v)} /><Field label="Trasferta" value={draft.away} onChangeText={(v) => updateDraft('away', v)} /><Field label="Stadio" value={draft.venue ?? ''} onChangeText={(v) => updateDraft('venue', v)} /></View>
      <View style={adminStyles.row}><Field label="Gol casa" value={draft.homeScore === undefined ? '' : String(draft.homeScore)} onChangeText={(v) => { const score = scoreInput(v); if (score !== null) updateDraft('homeScore', score); }} keyboardType="numeric" /><Field label="Gol ospite" value={draft.awayScore === undefined ? '' : String(draft.awayScore)} onChangeText={(v) => { const score = scoreInput(v); if (score !== null) updateDraft('awayScore', score); }} keyboardType="numeric" /></View>
      <Button label="Aggiungi al calendario" icon="calendar-plus" onPress={addMatch} />
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Importa calendario</Text>
      <Text style={adminStyles.copy}>Importa partite di Campionato, Coppa Italia o Amichevole via CSV (competizione;turno;data;ora;casa;trasferta;stadio;golC;golO) o JSON.</Text>
      <View style={adminStyles.choices}>
        <Pressable onPress={() => setImportMode('csv')} style={[adminStyles.choice, importMode === 'csv' && adminStyles.choiceActive]}><Text style={[adminStyles.choiceText, importMode === 'csv' && adminStyles.choiceTextActive]}>CSV / Testo</Text></Pressable>
        <Pressable onPress={() => setImportMode('json')} style={[adminStyles.choice, importMode === 'json' && adminStyles.choiceActive]}><Text style={[adminStyles.choiceText, importMode === 'json' && adminStyles.choiceTextActive]}>JSON</Text></Pressable>
      </View>
      <Field label="Dati" value={scheduleImport} onChangeText={setScheduleImport} multiline placeholder={importMode === 'csv' ? 'Campionato;1ª giornata;06/09/2026;15:00;AC Prato;Vis Artena;...' : '[{"competition":"Coppa Italia","home":"AC Prato","away":"Vis Artena","dateLabel":"04/09/2026"}]'} />
      <Button label="Anteprima import" icon="eye-outline" secondary onPress={previewImport} />
      {importErrors.length > 0 ? <View style={{ marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: colors.liveSoft }}>{importErrors.map((err, i) => <Text key={i} style={{ color: colors.live, fontSize: 12, fontFamily: 'monospace' }}>⚠️ {err}</Text>)}</View> : null}
      {importPreview ? <View style={{ marginTop: 10 }}>
        <Text style={[adminStyles.listTitle, { marginBottom: 6 }]}>{importPreview.length} partite in anteprima</Text>
        <View style={{ maxHeight: 200, gap: 6 }}>{importPreview.map((m, i) => <View key={i} style={{ flexDirection: 'row', gap: 8, padding: 6, borderBottomWidth: 1, borderColor: colors.line }}><Text style={{ flex: 1, fontSize: 11 }}>{m.home} – {m.away}</Text><Text style={{ fontSize: 11, color: colors.muted }}>{m.roundLabel} | {m.dateLabel}</Text></View>)}</View>
        <Button label="Conferma e importa" icon="check-circle-outline" onPress={confirmImport} />
      </View> : null}
    </View>

    <View style={adminStyles.panel}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={adminStyles.title}>Calendario competizioni</Text><Text style={{ fontSize: 11, color: colors.muted }}>{schedule.length} partite totali</Text></View>
      <Text style={adminStyles.copy}>Tutte le partite sono modificabili. I risultati di campionato aggiornano automaticamente la classifica.</Text>
      <CompetitionChoices value={listCompetition} onChange={setListCompetition} />
      {listCompetition === 'Campionato' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Pressable accessibilityLabel="Giornata precedente" disabled={selectedMatchday <= 1} onPress={() => setSelectedMatchday((day) => Math.max(1, day - 1))} style={adminStyles.choice}>
            <MaterialCommunityIcons name="chevron-left" size={20} color={selectedMatchday <= 1 ? colors.muted : colors.accentStrong} />
          </Pressable>
          <Text style={adminStyles.listTitle}>{selectedMatchday}ª giornata</Text>
          <Pressable accessibilityLabel="Giornata successiva" disabled={selectedMatchday >= 34} onPress={() => setSelectedMatchday((day) => Math.min(34, day + 1))} style={adminStyles.choice}>
            <MaterialCommunityIcons name="chevron-right" size={20} color={selectedMatchday >= 34 ? colors.muted : colors.accentStrong} />
          </Pressable>
        </View>
      ) : null}
      <Text style={adminStyles.listMeta}>{visibleSchedule.length} partite visualizzate</Text>
      <View style={adminStyles.list}>{visibleSchedule.map((match) => <View key={match.id} style={adminStyles.listRow}>
        <View style={{ width: 54, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: match.competition === 'Coppa Italia' ? colors.navy : colors.accentStrong }}><Text style={{ color: colors.paper, fontSize: 9, fontWeight: '900' }}>{match.competition === 'Coppa Italia' ? 'COPPA' : 'CAMP'}</Text></View>
        <View style={adminStyles.listBody}>
          <Text style={adminStyles.listTitle}>{match.home} – {match.away}</Text>
          <Text style={adminStyles.listMeta}>{match.roundLabel}{match.venue ? ` · ${match.venue}` : ''}{match.dateLabel ? ` · ${match.dateLabel}` : ''}{match.time ? ` · ${match.time}` : ''}{match.homeScore !== undefined ? ` (${match.homeScore}-${match.awayScore})` : ''}</Text>
          <CompetitionChoices value={match.competition ?? 'Campionato'} onChange={(c) => updateMatch(match.id, { competition: c })} compact />
          <View style={adminStyles.row}><Field label="Giornata" value={match.matchday ? String(match.matchday) : ''} onChangeText={(v) => updateMatch(match.id, { matchday: v ? Number(v) : undefined })} keyboardType="numeric" /><Field label="Turno" value={match.roundLabel ?? ''} onChangeText={(v) => updateMatch(match.id, { roundLabel: v })} /><Field label="Data" value={match.dateLabel} onChangeText={(v) => updateMatch(match.id, { dateLabel: v })} /><Field label="Ora" value={match.time} onChangeText={(v) => updateMatch(match.id, { time: v })} /></View>
          <View style={adminStyles.row}><Field label="Casa" value={match.home} onChangeText={(v) => updateMatch(match.id, { home: v })} /><Field label="Trasferta" value={match.away} onChangeText={(v) => updateMatch(match.id, { away: v })} /><Field label="Stadio" value={match.venue ?? ''} onChangeText={(v) => updateMatch(match.id, { venue: v })} /></View>
          <View style={adminStyles.row}><Field label="Gol casa" value={match.homeScore === undefined ? '' : String(match.homeScore)} onChangeText={(v) => setMatchScore(match.id, 'homeScore', v)} keyboardType="numeric" /><Field label="Gol ospite" value={match.awayScore === undefined ? '' : String(match.awayScore)} onChangeText={(v) => setMatchScore(match.id, 'awayScore', v)} keyboardType="numeric" /></View>
        </View>
        <Pressable onPress={() => setSchedule((c) => c.filter((item) => item.id !== match.id))}><MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.live} /></Pressable>
      </View>)}</View>
      <Button label="Salva calendario" icon="content-save-outline" onPress={saveSchedule} />
    </View>
  </View>;
}

function CompetitionChoices({ value, onChange, compact = false }: { value: MatchCompetition; onChange: (value: MatchCompetition) => void; compact?: boolean }) {
  return <View style={[adminStyles.choices, compact && { marginTop: 8 }]}>{competitions.map((c) => <Pressable key={c} onPress={() => onChange(c)} style={[adminStyles.choice, compact && { paddingVertical: 7 }, value === c && adminStyles.choiceActive]}><Text style={[adminStyles.choiceText, value === c && adminStyles.choiceTextActive]}>{c}</Text></Pressable>)}</View>;
}
