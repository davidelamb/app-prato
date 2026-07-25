import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { colors } from '../../theme';
import { AppContent, FixtureStatus, SeasonMatch } from '../../types';
import { synchronizeGroupMatches } from '../../utils/match-sync';
import { calculateStandingSets } from '../../utils/standings';
import { canonicalTeamName, normalizeTeamName } from '../../utils/team-names';
import { Button, Field, adminStyles } from './Primitives';

const isPrato = (name: string) => /\bprato\b/i.test(name);

function normalizeMatch(match: SeasonMatch, index: number): SeasonMatch {
  const matchday = Math.max(1, Math.trunc(Number(match.matchday) || 1));
  const hasResult = Number.isInteger(match.homeScore) && Number.isInteger(match.awayScore);
  return {
    ...match,
    id: match.id || `group-${Date.now()}-${index}`,
    competition: 'Campionato',
    matchday,
    leg: match.leg ?? (matchday <= 17 ? 'Andata' : 'Ritorno'),
    roundLabel: match.roundLabel || `${matchday}ª giornata`,
    home: canonicalTeamName(match.home),
    away: canonicalTeamName(match.away),
    dateLabel: match.dateLabel ?? '',
    time: match.time ?? '',
    venue: match.venue ?? '',
    sortOrder: match.sortOrder ?? index,
    status: match.status === 'live' ? 'live' : hasResult ? 'final' : (match.status ?? 'scheduled'),
  };
}

function validScore(value: number | undefined): boolean {
  return value === undefined || (Number.isInteger(value) && value >= 0);
}

function updateScore(value: string): number | undefined | null {
  if (value === '') return undefined;
  if (!/^\d+$/.test(value)) return null;
  const score = Number(value);
  return Number.isSafeInteger(score) ? score : null;
}

const statusLabels: Record<FixtureStatus, string> = { scheduled: 'Programmata', live: 'In corso', final: 'Conclusa' };
const statusOptions: FixtureStatus[] = ['scheduled', 'live', 'final'];

type ImportMode = 'replace' | 'merge';

// Formato richiesto: giornata;data;ora;casa;trasferta;stadio;golCasa;golOspite
function parseSeasonCsv(text: string): { rows: SeasonMatch[]; errors: string[] } {
  const errors: string[] = [];
  const rows: SeasonMatch[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  lines.forEach((line, index) => {
    const cells = line.split(';').map((c) => c.trim());
    if (cells.length < 6) { errors.push(`Riga ${index + 1}: servono almeno 6 colonne (giornata;data;ora;casa;trasferta;stadio).`); return; }
    const [giornataRaw, dateLabel, time, home, away, venue, golCasaRaw, golOspiteRaw] = cells;
    const matchday = Number(giornataRaw);
    if (!Number.isInteger(matchday) || matchday < 1 || matchday > 34) { errors.push(`Riga ${index + 1}: giornata "${giornataRaw}" non valida (1-34).`); return; }
    if (!home || !away) { errors.push(`Riga ${index + 1}: casa o trasferta mancanti.`); return; }
    if (normalizeTeamName(home) === normalizeTeamName(away)) { errors.push(`Riga ${index + 1}: una squadra non può giocare contro se stessa.`); return; }
    let homeScore: number | undefined;
    let awayScore: number | undefined;
    if (golCasaRaw || golOspiteRaw) {
      if (!golCasaRaw || !golOspiteRaw) { errors.push(`Riga ${index + 1}: entrambi i gol vanno compilati, oppure lasciati entrambi vuoti.`); return; }
      homeScore = Number(golCasaRaw);
      awayScore = Number(golOspiteRaw);
      if (!Number.isInteger(homeScore) || homeScore < 0 || !Number.isInteger(awayScore) || awayScore < 0) { errors.push(`Riga ${index + 1}: i gol devono essere numeri interi non negativi.`); return; }
    }
    rows.push(normalizeMatch({
      id: `group-import-${index}`,
      matchday,
      competition: 'Campionato',
      roundLabel: `${matchday}ª giornata`,
      dateLabel: dateLabel ?? '',
      time: time ?? '',
      home,
      away,
      venue: venue ?? '',
      homeScore,
      awayScore,
      sortOrder: index,
    }, index));
  });
  return { rows, errors };
}

export function GroupAdmin({ content, onChange }: { content: AppContent; onChange: (next: AppContent) => Promise<void> }) {
  const [matches, setMatches] = useState<SeasonMatch[]>(() => (content.groupMatches ?? []).map(normalizeMatch));
  const [selectedDay, setSelectedDay] = useState<number>(() => Number(content.groupMatches?.[0]?.matchday) || 1);
  const [search, setSearch] = useState('');
  const [csvText, setCsvText] = useState('');
  const [csvMode, setCsvMode] = useState<ImportMode>('merge');
  const [csvPreview, setCsvPreview] = useState<{ rows: SeasonMatch[]; errors: string[] } | null>(null);

  useEffect(() => {
    setMatches((content.groupMatches ?? []).map(normalizeMatch));
  }, [content.groupMatches]);

  const days = useMemo(() => [...new Set(matches.map((match) => Number(match.matchday) || 1))].sort((a, b) => a - b), [matches]);

  const searchTerm = normalizeTeamName(search.trim());
  const matchingDays = useMemo(() => {
    if (!searchTerm) return null;
    return new Set(
      matches
        .filter((m) => normalizeTeamName(m.home).includes(searchTerm) || normalizeTeamName(m.away).includes(searchTerm))
        .map((m) => Number(m.matchday) || 1),
    );
  }, [matches, searchTerm]);

  const dayMatches = useMemo(() => {
    const base = matches.filter((match) => (Number(match.matchday) || 1) === selectedDay);
    if (!searchTerm) return base;
    return base.filter((m) => normalizeTeamName(m.home).includes(searchTerm) || normalizeTeamName(m.away).includes(searchTerm));
  }, [matches, selectedDay, searchTerm]);

  const clubs = useMemo(() => [...new Set([
    ...(content.standings ?? []).map((row) => canonicalTeamName(row.club)),
    ...matches.flatMap((match) => [canonicalTeamName(match.home), canonicalTeamName(match.away)]),
  ].filter(Boolean))], [content.standings, matches]);
  const preview = useMemo(() => calculateStandingSets(matches, clubs).overall, [clubs, matches]);
  const completed = matches.filter((match) => match.status === 'final').length;

  // Avviso: la giornata selezionata non ha esattamente 9 partite o ha una
  // squadra duplicata (es. dopo una modifica manuale poco attenta).
  const dayWarning = useMemo(() => {
    const all = matches.filter((match) => (Number(match.matchday) || 1) === selectedDay);
    if (all.length !== 9) return `Attenzione: questa giornata ha ${all.length} partite invece di 9.`;
    const seen = new Set<string>();
    for (const m of all) {
      const h = normalizeTeamName(m.home);
      const a = normalizeTeamName(m.away);
      if (seen.has(h) || seen.has(a)) return 'Attenzione: una squadra compare due volte in questa giornata.';
      seen.add(h); seen.add(a);
    }
    return null;
  }, [matches, selectedDay]);

  const updateMatch = (id: string, patch: Partial<SeasonMatch>) => {
    setMatches((current) => current.map((match) => match.id === id ? { ...match, ...patch } : match));
  };

  const setScore = (id: string, side: 'homeScore' | 'awayScore', value: string) => {
    const score = updateScore(value);
    if (score === null) return;
    updateMatch(id, { [side]: score });
  };

  const addMatch = () => {
    const day = selectedDay || 1;
    setMatches((current) => [...current, normalizeMatch({
      id: `group-${Date.now()}`,
      competition: 'Campionato',
      matchday: day,
      roundLabel: `${day}ª giornata`,
      home: '',
      away: '',
      dateLabel: '',
      time: '',
      venue: '',
      sortOrder: current.length,
      status: 'scheduled',
    }, current.length)]);
  };

  const clearResult = (id: string) => updateMatch(id, { homeScore: undefined, awayScore: undefined, status: 'scheduled' });

  const removeMatch = (id: string) => {
    Alert.alert('Eliminare la partita?', 'La partita verrà rimossa dal girone al prossimo salvataggio.', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => setMatches((current) => current.filter((match) => match.id !== id)) },
    ]);
  };

  const validateAndFinalize = (list: SeasonMatch[]): SeasonMatch[] | null => {
    const normalized = list.map(normalizeMatch);
    const invalid = normalized.find((match) => {
      const oneScoreOnly = (match.homeScore === undefined) !== (match.awayScore === undefined);
      return !match.home.trim()
        || !match.away.trim()
        || normalizeTeamName(match.home) === normalizeTeamName(match.away)
        || oneScoreOnly
        || !validScore(match.homeScore)
        || !validScore(match.awayScore);
    });
    if (invalid) {
      Alert.alert('Dati non validi', 'Ogni partita deve avere due squadre diverse e il risultato deve contenere due numeri interi non negativi, oppure essere completamente vuoto.');
      return null;
    }
    return normalized.map((match) => ({
      ...match,
      status: match.status === 'live' ? 'live' : Number.isInteger(match.homeScore) && Number.isInteger(match.awayScore) ? 'final' as const : 'scheduled' as const,
    }));
  };

  const save = async () => {
    const finalized = validateAndFinalize(matches);
    if (!finalized) return;
    const next = synchronizeGroupMatches(content, finalized);
    await onChange(next);
    Alert.alert('Girone aggiornato', 'Risultati, calendario, Live e classifiche sono stati sincronizzati.');
  };

  const previewImport = () => {
    const parsed = parseSeasonCsv(csvText);
    setCsvPreview(parsed);
  };

  const confirmImport = async () => {
    if (!csvPreview?.rows.length) return;
    const merged = csvMode === 'replace'
      ? csvPreview.rows
      : (() => {
          // Unisci e aggiorna: sostituisce le partite esistenti che coincidono
          // per giornata+casa+trasferta, aggiunge le nuove, mantiene il resto.
          const byKey = new Map(matches.map((m) => [`${m.matchday}|${normalizeTeamName(m.home)}|${normalizeTeamName(m.away)}`, m]));
          for (const row of csvPreview.rows) {
            byKey.set(`${row.matchday}|${normalizeTeamName(row.home)}|${normalizeTeamName(row.away)}`, row);
          }
          return [...byKey.values()];
        })();
    const finalized = validateAndFinalize(merged);
    if (!finalized) return;
    setMatches(finalized);
    const next = synchronizeGroupMatches(content, finalized);
    await onChange(next);
    setCsvPreview(null);
    setCsvText('');
    Alert.alert('Importazione completata', `${csvPreview.rows.length} partite ${csvMode === 'replace' ? 'hanno sostituito il girone' : 'sono state unite/aggiornate'}.`);
  };

  return <View style={{ gap: 14 }}>
    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Calendario campionato</Text>
      <Text style={adminStyles.copy}>Tutte le 306 partite del girone (18 squadre, 34 giornate). Al salvataggio vengono aggiornate automaticamente calendario pubblico, Live e classifiche generale/casa/trasferta/forma.</Text>
      <Text style={[adminStyles.listMeta, { marginTop: 10 }]}>{completed} risultati completi su {matches.length} partite</Text>
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Cerca squadra</Text>
      <Field label="Nome squadra" value={search} onChangeText={setSearch} placeholder="es. Siena, Lucchese..." />
      {searchTerm && matchingDays ? (
        <Text style={adminStyles.copy}>
          {matchingDays.size === 0 ? 'Nessuna giornata trovata.' : `Trovata in ${matchingDays.size} giornate: ${[...matchingDays].sort((a, b) => a - b).join(', ')}`}
        </Text>
      ) : null}
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Giornata</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={adminStyles.choices}>
        {days.map((day) => {
          const highlighted = matchingDays?.has(day);
          return <Pressable key={day} onPress={() => setSelectedDay(day)} style={[adminStyles.choice, selectedDay === day && adminStyles.choiceActive, highlighted && { borderColor: colors.accentStrong, borderWidth: 2 }]}>
            <Text style={[adminStyles.choiceText, selectedDay === day && adminStyles.choiceTextActive]}>{day}ª</Text>
          </Pressable>;
        })}
        {!days.length ? <Text style={adminStyles.copy}>Nessuna giornata inserita.</Text> : null}
      </ScrollView>
      <Button label="Aggiungi partita alla giornata" icon="plus-circle-outline" secondary onPress={addMatch} />
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>{selectedDay}ª giornata</Text>
      {dayWarning ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.yellowSoft, padding: 10, borderRadius: 10, marginTop: 8 }}>
          <MaterialCommunityIcons name="alert-outline" size={16} color={colors.warning} />
          <Text style={{ color: colors.warning, fontSize: 12, fontWeight: '700', flex: 1 }}>{dayWarning}</Text>
        </View>
      ) : null}
      <View style={adminStyles.list}>
        {dayMatches.map((match) => {
          const hasResult = match.homeScore !== undefined && match.awayScore !== undefined;
          const pratoMatch = isPrato(match.home) || isPrato(match.away);
          return <View
            key={match.id}
            style={[
              adminStyles.listRow,
              { alignItems: 'flex-start' },
              pratoMatch && { borderColor: colors.accent, borderWidth: 1.5, backgroundColor: '#F4FAFF' },
            ]}
          >
            <View style={adminStyles.listBody}>
              <View style={adminStyles.row}>
                <Field label="Squadra casa" value={match.home} onChangeText={(value) => updateMatch(match.id, { home: value })} />
                <Field label="Gol casa" value={match.homeScore === undefined ? '' : String(match.homeScore)} onChangeText={(value) => setScore(match.id, 'homeScore', value)} keyboardType="numeric" />
                <Field label="Gol ospite" value={match.awayScore === undefined ? '' : String(match.awayScore)} onChangeText={(value) => setScore(match.id, 'awayScore', value)} keyboardType="numeric" />
                <Field label="Squadra ospite" value={match.away} onChangeText={(value) => updateMatch(match.id, { away: value })} />
              </View>
              <View style={adminStyles.row}>
                <Field label="Data" value={match.dateLabel ?? ''} onChangeText={(value) => updateMatch(match.id, { dateLabel: value })} placeholder="DOM 06 SET" />
                <Field label="Ora" value={match.time ?? ''} onChangeText={(value) => updateMatch(match.id, { time: value })} placeholder="15:00" />
                <Field label="Stadio" value={match.venue ?? ''} onChangeText={(value) => updateMatch(match.id, { venue: value })} />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, alignItems: 'center' }}>
                <Text style={[adminStyles.listMeta, { fontWeight: '900' }]}>Stato:</Text>
                {statusOptions.map((option) => (
                  <Pressable key={option} onPress={() => updateMatch(match.id, { status: option })} style={[adminStyles.choice, match.status === option && adminStyles.choiceActive]}>
                    <Text style={[adminStyles.choiceText, match.status === option && adminStyles.choiceTextActive]}>{statusLabels[option]}</Text>
                  </Pressable>
                ))}
                {hasResult ? <Pressable onPress={() => clearResult(match.id)} style={adminStyles.choice}>
                  <Text style={adminStyles.choiceText}>Cancella solo il risultato</Text>
                </Pressable> : null}
              </View>
            </View>
            <Pressable accessibilityLabel="Elimina partita" onPress={() => removeMatch(match.id)} style={{ padding: 8 }}>
              <MaterialCommunityIcons name="trash-can-outline" size={19} color={colors.live} />
            </Pressable>
          </View>;
        })}
        {!dayMatches.length ? <Text style={adminStyles.copy}>{searchTerm ? 'Nessuna partita di questa squadra in questa giornata.' : 'Aggiungi la prima partita di questa giornata.'}</Text> : null}
      </View>
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Importa CSV</Text>
      <Text style={adminStyles.copy}>Formato: giornata;data;ora;casa;trasferta;stadio;golCasa;golOspite (fino a 306 righe). I gol vanno compilati entrambi o lasciati entrambi vuoti.</Text>
      <View style={adminStyles.choices}>
        <Pressable onPress={() => setCsvMode('merge')} style={[adminStyles.choice, csvMode === 'merge' && adminStyles.choiceActive]}>
          <Text style={[adminStyles.choiceText, csvMode === 'merge' && adminStyles.choiceTextActive]}>Unisci e aggiorna</Text>
        </Pressable>
        <Pressable onPress={() => setCsvMode('replace')} style={[adminStyles.choice, csvMode === 'replace' && adminStyles.choiceActive]}>
          <Text style={[adminStyles.choiceText, csvMode === 'replace' && adminStyles.choiceTextActive]}>Sostituisci tutto</Text>
        </Pressable>
      </View>
      <Field label="Righe CSV" value={csvText} onChangeText={setCsvText} multiline placeholder="1;DOM 06 SET;15:00;AC Prato;Polisportiva Pietralunghese;Stadio Lungobisenzio;2;0" />
      <Button label="Anteprima import" icon="eye-outline" secondary onPress={previewImport} />
      {csvPreview?.errors.length ? (
        <View style={{ marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: colors.liveSoft }}>
          {csvPreview.errors.slice(0, 20).map((err, i) => <Text key={i} style={{ color: colors.live, fontSize: 12, fontFamily: 'monospace' }}>⚠️ {err}</Text>)}
          {csvPreview.errors.length > 20 ? <Text style={{ color: colors.live, fontSize: 12 }}>...e altri {csvPreview.errors.length - 20} errori.</Text> : null}
        </View>
      ) : null}
      {csvPreview?.rows.length ? (
        <View style={{ marginTop: 10 }}>
          <Text style={[adminStyles.listTitle, { marginBottom: 6 }]}>{csvPreview.rows.length} partite valide in anteprima ({csvMode === 'replace' ? 'sostituiranno tutto il girone' : 'verranno unite/aggiornate'})</Text>
          <View style={{ maxHeight: 200, gap: 6 }}>
            {csvPreview.rows.slice(0, 30).map((m, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, padding: 6, borderBottomWidth: 1, borderColor: colors.line }}>
                <Text style={{ flex: 1, fontSize: 11 }}>{m.home} – {m.away}</Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>{m.roundLabel} | {m.dateLabel}</Text>
              </View>
            ))}
          </View>
          <Button label={`Conferma: ${csvMode === 'replace' ? 'sostituisci tutto' : 'unisci e aggiorna'}`} icon="check-circle-outline" onPress={() => void confirmImport()} />
        </View>
      ) : null}
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Anteprima classifica</Text>
      <Text style={adminStyles.copy}>Calcolata in tempo reale dai risultati inseriti. Le penalità salvate vengono applicate al salvataggio.</Text>
      <View style={adminStyles.list}>
        {preview.slice(0, 5).map((row) => <View key={row.club} style={adminStyles.listRow}>
          <Text style={{ width: 24, color: colors.muted, fontWeight: '900' }}>{row.rank}</Text>
          <Text style={[adminStyles.listTitle, { flex: 1 }]}>{row.club}</Text>
          <Text style={{ color: colors.accentStrong, fontWeight: '900' }}>{row.points} pt</Text>
        </View>)}
      </View>
    </View>

    <Button label="Salva e sincronizza tutto" icon="content-save-check-outline" onPress={() => void save()} />
  </View>;
}
