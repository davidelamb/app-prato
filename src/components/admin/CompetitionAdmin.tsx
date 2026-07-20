import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { preseasonStandings, provisionalPratoSchedule } from '../../data/season-2026-27';
import { colors } from '../../theme';
import { AppContent, SeasonMatch, Standing } from '../../types';
import { Button, Field, adminStyles } from './Primitives';

const number = (value: string | number | undefined) => Number(value) || 0;
const cleanDate = (value: string) => value === 'Data da definire' ? '' : value;
const cleanTime = (value: string) => value === '—' ? '' : value;

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

export function CompetitionAdmin({ content, onChange }: { content: AppContent; onChange: (next: AppContent) => Promise<void> }) {
  const initialSchedule = useMemo<SeasonMatch[]>(() => (content.schedule?.length ? content.schedule : provisionalPratoSchedule).map((match) => ({ ...match, dateLabel: cleanDate(match.dateLabel), time: cleanTime(match.time) })), [content.schedule]);
  const initialStandings = useMemo<Standing[]>(() => (content.standings.length >= 18 ? content.standings : preseasonStandings).map((row, index) => normalizeStanding(row, index)), [content.standings]);
  const [schedule, setSchedule] = useState<SeasonMatch[]>(initialSchedule);
  const [standings, setStandings] = useState<Standing[]>(initialStandings);
  const [scheduleImport, setScheduleImport] = useState('');
  const [standingsImport, setStandingsImport] = useState('');

  const updateMatch = (id: string, patch: Partial<SeasonMatch>) => setSchedule((current) => current.map((match) => match.id === id ? { ...match, ...patch } : match));
  const updateStanding = (club: string, patch: Partial<Standing>) => setStandings((current) => current.map((row) => row.club === club ? normalizeStanding({ ...row, ...patch }, row.rank - 1) : row));

  const saveSchedule = () => void onChange({ ...content, schedule: schedule.map((match) => ({ ...match, dateLabel: match.dateLabel.trim(), time: match.time.trim() })) });
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
    const parsed = rows.map((line, index) => {
      const cells = line.split(/\t|;/).map((cell) => cell.trim());
      if (cells.length < 5) return null;
      const matchday = number(cells[0]);
      return {
        id: `calendar-import-${matchday || index + 1}`,
        matchday: matchday || index + 1,
        leg: (matchday || index + 1) <= 17 ? 'Andata' as const : 'Ritorno' as const,
        dateLabel: cells[1],
        time: cells[2],
        home: cells[3],
        away: cells[4],
        homeScore: cells[5] === '' || cells[5] === undefined ? undefined : number(cells[5]),
        awayScore: cells[6] === '' || cells[6] === undefined ? undefined : number(cells[6]),
      };
    }).filter((row): row is SeasonMatch => !!row);
    if (!parsed.length) return Alert.alert('Formato non riconosciuto', 'Usa una riga per partita: giornata;data;ora;casa;trasferta;gol casa;gol trasferta.');
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
      return normalizeStanding({
        rank: number(cells[0]) || index + 1,
        club: cells[1],
        played: number(cells[2]),
        wins: number(cells[3]),
        draws: number(cells[4]),
        losses: number(cells[5]),
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points: number(cells[8]),
        form: [],
      }, index);
    }).filter((row): row is Standing => !!row && !!row.club);
    if (!parsed.length) return Alert.alert('Formato non riconosciuto', 'Usa una riga per squadra: posizione;squadra;G;V;N;P;GF;GS;PT.');
    setStandings(parsed);
    setStandingsImport('');
  };

  return <View style={{ gap: 14 }}>
    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Importa dati</Text>
      <Field label="Calendario" value={scheduleImport} onChangeText={setScheduleImport} multiline placeholder="1;06/09/2026;15:00;AC Prato;Siena FC;;" />
      <Button label="Importa calendario" icon="calendar-import" secondary onPress={importSchedule} />
      <Field label="Classifica" value={standingsImport} onChangeText={setStandingsImport} multiline placeholder="1;AC Prato;1;1;0;0;2;0;3" />
      <Button label="Importa classifica" icon="table-arrow-down" secondary onPress={importStandings} />
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Calendario</Text>
      <View style={adminStyles.list}>{schedule.map((match) => <View key={match.id} style={adminStyles.listRow}>
        <View style={{ width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentStrong }}><Text style={{ color: colors.paper, fontWeight: '900' }}>{match.matchday}</Text></View>
        <View style={adminStyles.listBody}>
          <Text style={adminStyles.listTitle}>{match.home} – {match.away}</Text>
          <View style={adminStyles.row}>
            <Field label="Data" value={match.dateLabel} onChangeText={(value) => updateMatch(match.id, { dateLabel: value })} placeholder="06/09/2026" />
            <Field label="Ora" value={match.time} onChangeText={(value) => updateMatch(match.id, { time: value })} placeholder="15:00" />
            <Field label="Gol casa" value={match.homeScore === undefined ? '' : String(match.homeScore)} onChangeText={(value) => updateMatch(match.id, { homeScore: value === '' ? undefined : number(value) })} keyboardType="numeric" />
            <Field label="Gol ospite" value={match.awayScore === undefined ? '' : String(match.awayScore)} onChangeText={(value) => updateMatch(match.id, { awayScore: value === '' ? undefined : number(value) })} keyboardType="numeric" />
          </View>
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
