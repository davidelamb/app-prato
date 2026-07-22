import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '../../theme';
import { AppContent, SeasonMatch, Standing } from '../../types';
import { calculateStandings } from '../../utils/standings';
import { Button, Field, adminStyles } from './Primitives';

const number = (value: string | number | undefined) => Number(value) || 0;

function normalize(match: SeasonMatch, index: number): SeasonMatch {
  return { ...match, id: match.id || `group-${Date.now()}-${index}`, competition: 'Campionato', matchday: match.matchday ?? undefined, roundLabel: match.roundLabel ?? (match.matchday ? `${match.matchday}ª giornata` : ''), dateLabel: match.dateLabel ?? '', time: match.time ?? '', venue: match.venue ?? '', sortOrder: match.sortOrder ?? index };
}

function groupByMatchday(matches: SeasonMatch[]): Map<number, SeasonMatch[]> {
  const map = new Map<number, SeasonMatch[]>();
  for (const m of matches) {
    const day = m.matchday ?? 0;
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(m);
  }
  // Sort matchdays
  const sorted = new Map([...map.entries()].sort((a, b) => a[0] - b[0]));
  return sorted;
}

export function GroupAdmin({ content, onChange }: { content: AppContent; onChange: (next: AppContent) => Promise<void> }) {
  const initialMatches = useMemo<SeasonMatch[]>(() => (content.groupMatches?.length ? content.groupMatches.map(normalize) : []), [content.groupMatches]);
  const [matches, setMatches] = useState<SeasonMatch[]>(initialMatches);
  const [quickDay, setQuickDay] = useState('');
  const [standings, setStandings] = useState<Standing[] | null>(null);

  const updateMatch = (id: string, patch: Partial<SeasonMatch>) => setMatches((prev) => prev.map((m) => m.id === id ? { ...m, ...patch } : m));

  const addMatch = () => {
    const match: SeasonMatch = { id: `group-${Date.now()}`, competition: 'Campionato', matchday: 1, roundLabel: '1ª giornata', home: '', away: '', dateLabel: '', time: '', venue: '', sortOrder: matches.length };
    setMatches((prev) => [match, ...prev]);
  };

  const save = () => {
    const normalized = matches.map(normalize);
    void onChange({ ...content, groupMatches: normalized });
  };

  const quickEntryApply = () => {
    const day = number(quickDay);
    if (day < 1) return Alert.alert('Giornata non valida', 'Inserisci un numero di giornata valido.');
    const preview = matches.map((m) => {
      if (m.matchday !== day) return m;
      return { ...m, homeScore: 0, awayScore: 0 };
    });
    setMatches(preview);
  };

  const standingsFromMatches = () => {
    const clubs = [...new Set([...matches.map((m) => m.home), ...matches.map((m) => m.away)].filter(Boolean))];
    setStandings(calculateStandings(matches.filter((m) => m.homeScore !== undefined && m.awayScore !== undefined), clubs));
  };

  const applyStandingsToContent = () => {
    if (!standings) return;
    const penalties = new Map((content.standings ?? []).map((row) => [row.club, Number(row.penalty) || 0]));
    void onChange({ ...content, standings: standings.map((row) => ({ ...row, penalty: penalties.get(row.club) ?? 0 })) });
    Alert.alert('Applicata', 'Classifica calcolata e salvata nel contenuto.');
  };

  const grouped = groupByMatchday(matches);

  return <View style={{ gap: 14 }}>
    <View style={adminStyles.panel}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={adminStyles.title}>Partite del girone</Text><Button label="+ Aggiungi" icon="plus-circle-outline" onPress={addMatch} secondary /></View>
      <Text style={adminStyles.copy}>Gestisci tutte le partite di Campionato del girone {matches.length ? `(${matches.length} partite)` : ''}.</Text>
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Inserimento rapido risultati per giornata</Text>
      <View style={adminStyles.row}><Field label="Giornata n°" value={quickDay} onChangeText={setQuickDay} keyboardType="numeric" /></View>
      <Text style={adminStyles.copy}>Tutte le partite della giornata saranno inizializzate con 0-0, poi modifica i risultati uno per uno.</Text>
      <Button label="Prepara giornata" icon="playlist-edit" onPress={quickEntryApply} />
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Classifica calcolata</Text>
      <Button label="Calcola classifica dai risultati" icon="table" onPress={standingsFromMatches} />
      {standings ? <View style={{ marginTop: 12 }}>
        <View style={{ flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderColor: colors.line }}>
          <Text style={{ flex: 0.4, fontSize: 11, fontWeight: '700' }}>#</Text>
          <Text style={{ flex: 2, fontSize: 11, fontWeight: '700' }}>Squadra</Text>
          <Text style={{ flex: 0.6, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>G</Text>
          <Text style={{ flex: 0.6, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>V</Text>
          <Text style={{ flex: 0.6, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>N</Text>
          <Text style={{ flex: 0.6, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>P</Text>
          <Text style={{ flex: 0.8, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>GF</Text>
          <Text style={{ flex: 0.8, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>GS</Text>
          <Text style={{ flex: 0.8, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>DR</Text>
          <Text style={{ flex: 0.8, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>PT</Text>
        </View>
        {standings.map((row) => <View key={row.club} style={{ flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderColor: colors.lineSoft, backgroundColor: row.club === 'AC Prato' ? colors.accentSoft : 'transparent' }}>
          <Text style={{ flex: 0.4, fontSize: 11, fontWeight: '700' }}>{row.rank}</Text>
          <Text style={{ flex: 2, fontSize: 11, fontWeight: '600', color: row.club === 'AC Prato' ? colors.accentStrong : colors.ink }}>{row.club}</Text>
          <Text style={{ flex: 0.6, fontSize: 11, textAlign: 'center' }}>{row.played}</Text>
          <Text style={{ flex: 0.6, fontSize: 11, textAlign: 'center' }}>{row.wins}</Text>
          <Text style={{ flex: 0.6, fontSize: 11, textAlign: 'center' }}>{row.draws}</Text>
          <Text style={{ flex: 0.6, fontSize: 11, textAlign: 'center' }}>{row.losses}</Text>
          <Text style={{ flex: 0.8, fontSize: 11, textAlign: 'center' }}>{row.goalsFor}</Text>
          <Text style={{ flex: 0.8, fontSize: 11, textAlign: 'center' }}>{row.goalsAgainst}</Text>
          <Text style={{ flex: 0.8, fontSize: 11, textAlign: 'center', fontWeight: '600' }}>{row.goalDifference}</Text>
          <Text style={{ flex: 0.8, fontSize: 11, textAlign: 'center', fontWeight: '900', color: colors.accentStrong }}>{row.points}</Text>
        </View>)}
        <Button label="Applica al contenuto" icon="database-arrow-up-outline" onPress={applyStandingsToContent} />
      </View> : null}
    </View>

    <ScrollView horizontal style={{ maxHeight: 400 }}>
      {[...grouped.entries()].map(([day, dayMatches]) => <View key={day} style={[adminStyles.panel, { marginRight: 8, minWidth: 340 }]}>
        <Text style={adminStyles.title}>{day}ª giornata</Text>
        {dayMatches.map((match) => <View key={match.id} style={[adminStyles.listRow, { paddingVertical: 10 }]}>
          <View style={adminStyles.listBody}>
            <Text style={adminStyles.listTitle}>{match.home || '?'} – {match.away || '?'}</Text>
            <View style={[adminStyles.row, { marginTop: 6 }]}>
              <Field label="Gol casa" value={match.homeScore === undefined ? '' : String(match.homeScore)} onChangeText={(v) => updateMatch(match.id, { homeScore: v === '' ? undefined : number(v) })} keyboardType="numeric" />
              <Field label="Gol ospite" value={match.awayScore === undefined ? '' : String(match.awayScore)} onChangeText={(v) => updateMatch(match.id, { awayScore: v === '' ? undefined : number(v) })} keyboardType="numeric" />
            </View>
            <Field label="Casa" value={match.home} onChangeText={(v) => updateMatch(match.id, { home: v })} />
            <Field label="Trasferta" value={match.away} onChangeText={(v) => updateMatch(match.id, { away: v })} />
          </View>
          <Pressable onPress={() => setMatches((prev) => prev.filter((m) => m.id !== match.id))}><MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.live} /></Pressable>
        </View>)}</View>)}</ScrollView>

    <Button label="Salva girone" icon="content-save-outline" onPress={save} />
  </View>;
}
