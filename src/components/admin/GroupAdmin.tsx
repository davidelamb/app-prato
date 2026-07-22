import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { colors } from '../../theme';
import { AppContent, SeasonMatch } from '../../types';
import { synchronizeGroupMatches } from '../../utils/match-sync';
import { calculateStandingSets } from '../../utils/standings';
import { canonicalTeamName, normalizeTeamName } from '../../utils/team-names';
import { Button, Field, adminStyles } from './Primitives';

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
    status: hasResult ? 'final' : 'scheduled',
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

export function GroupAdmin({ content, onChange }: { content: AppContent; onChange: (next: AppContent) => Promise<void> }) {
  const [matches, setMatches] = useState<SeasonMatch[]>(() => (content.groupMatches ?? []).map(normalizeMatch));
  const [selectedDay, setSelectedDay] = useState<number>(() => Number(content.groupMatches?.[0]?.matchday) || 1);

  useEffect(() => {
    setMatches((content.groupMatches ?? []).map(normalizeMatch));
  }, [content.groupMatches]);

  const days = useMemo(() => [...new Set(matches.map((match) => Number(match.matchday) || 1))].sort((a, b) => a - b), [matches]);
  const dayMatches = useMemo(() => matches.filter((match) => (Number(match.matchday) || 1) === selectedDay), [matches, selectedDay]);
  const clubs = useMemo(() => [...new Set([
    ...(content.standings ?? []).map((row) => canonicalTeamName(row.club)),
    ...matches.flatMap((match) => [canonicalTeamName(match.home), canonicalTeamName(match.away)]),
  ].filter(Boolean))], [content.standings, matches]);
  const preview = useMemo(() => calculateStandingSets(matches, clubs).overall, [clubs, matches]);
  const completed = matches.filter((match) => match.status === 'final').length;

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

  const save = async () => {
    const normalized = matches.map(normalizeMatch);
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
      return Alert.alert('Dati non validi', 'Ogni partita deve avere due squadre diverse e il risultato deve contenere due numeri interi non negativi, oppure essere completamente vuoto.');
    }
    const finalized = normalized.map((match) => ({
      ...match,
      status: Number.isInteger(match.homeScore) && Number.isInteger(match.awayScore) ? 'final' as const : 'scheduled' as const,
    }));
    const next = synchronizeGroupMatches(content, finalized);
    await onChange(next);
    Alert.alert('Girone aggiornato', 'Risultati, calendario, Live e classifiche sono stati sincronizzati.');
  };

  return <View style={{ gap: 14 }}>
    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Risultati Serie D · Girone E</Text>
      <Text style={adminStyles.copy}>Inserisci soltanto i gol. Al salvataggio vengono aggiornate automaticamente classifica generale, casa, trasferta, forma e le partite del Prato.</Text>
      <Text style={[adminStyles.listMeta, { marginTop: 10 }]}>{completed} risultati completi su {matches.length} partite</Text>
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Giornata</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={adminStyles.choices}>
        {days.map((day) => <Pressable key={day} onPress={() => setSelectedDay(day)} style={[adminStyles.choice, selectedDay === day && adminStyles.choiceActive]}>
          <Text style={[adminStyles.choiceText, selectedDay === day && adminStyles.choiceTextActive]}>{day}ª</Text>
        </Pressable>)}
        {!days.length ? <Text style={adminStyles.copy}>Nessuna giornata inserita.</Text> : null}
      </ScrollView>
      <Button label="Aggiungi partita alla giornata" icon="plus-circle-outline" secondary onPress={addMatch} />
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>{selectedDay}ª giornata</Text>
      <View style={adminStyles.list}>
        {dayMatches.map((match) => {
          const hasResult = match.homeScore !== undefined && match.awayScore !== undefined;
          return <View key={match.id} style={[adminStyles.listRow, { alignItems: 'flex-start' }]}>
            <View style={adminStyles.listBody}>
              <View style={adminStyles.row}>
                <Field label="Squadra casa" value={match.home} onChangeText={(value) => updateMatch(match.id, { home: value })} />
                <Field label="Gol casa" value={match.homeScore === undefined ? '' : String(match.homeScore)} onChangeText={(value) => setScore(match.id, 'homeScore', value)} keyboardType="numeric" />
                <Field label="Gol ospite" value={match.awayScore === undefined ? '' : String(match.awayScore)} onChangeText={(value) => setScore(match.id, 'awayScore', value)} keyboardType="numeric" />
                <Field label="Squadra ospite" value={match.away} onChangeText={(value) => updateMatch(match.id, { away: value })} />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {hasResult ? <Pressable onPress={() => clearResult(match.id)} style={adminStyles.choice}>
                  <Text style={adminStyles.choiceText}>Riporta a non disputata</Text>
                </Pressable> : null}
                <Text style={[adminStyles.listMeta, { alignSelf: 'center' }]}>{hasResult ? 'Risultato completo' : 'Non disputata'}</Text>
              </View>
            </View>
            <Pressable accessibilityLabel="Elimina partita" onPress={() => removeMatch(match.id)} style={{ padding: 8 }}>
              <MaterialCommunityIcons name="trash-can-outline" size={19} color={colors.live} />
            </Pressable>
          </View>;
        })}
        {!dayMatches.length ? <Text style={adminStyles.copy}>Aggiungi la prima partita di questa giornata.</Text> : null}
      </View>
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
