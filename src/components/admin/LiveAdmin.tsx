import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { colors } from '../../theme';
import { AppContent, Fixture, LiveEvent } from '../../types';
import { kickoffInput, kickoffIso, kickoffTimestamp } from '../../utils/fixture-time';
import { Button, Field, adminStyles } from './Primitives';

const id = () => `event-${Date.now()}`;
const eventIcons: Record<LiveEvent['type'], React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  kickoff: 'play', halftime: 'pause', second_half: 'play', goal: 'soccer', chance: 'alert-circle-outline', yellow_card: 'card-outline', substitution: 'swap-horizontal', fulltime: 'flag-checkered',
};

export function LiveAdmin({ content, onChange }: { content: AppContent; onChange: (next: AppContent) => Promise<void> }) {
  const availableFixtures = useMemo(() => content.fixtures
    .filter((item) => item.status !== 'final')
    .sort((a, b) => (kickoffTimestamp(a) ?? Number.MAX_SAFE_INTEGER) - (kickoffTimestamp(b) ?? Number.MAX_SAFE_INTEGER)), [content.fixtures]);
  const [selectedId, setSelectedId] = useState(availableFixtures[0]?.id ?? content.fixtures[0]?.id ?? '');
  const fixture = content.fixtures.find((item) => item.id === selectedId) ?? availableFixtures[0] ?? content.fixtures[0];
  const [scorer, setScorer] = useState('');
  const [minute, setMinute] = useState('');
  const [eventDetail, setEventDetail] = useState('');
  const [eventTeam, setEventTeam] = useState<'home' | 'away'>('home');
  const [officialDate, setOfficialDate] = useState('');
  const [officialTime, setOfficialTime] = useState('');

  useEffect(() => {
    if (!fixture) return;
    const input = kickoffInput(fixture);
    setOfficialDate(input.date);
    setOfficialTime(input.time);
  }, [fixture?.id, fixture?.kickoffAt, fixture?.dateLabel, fixture?.time]);

  if (!fixture) return <Text style={adminStyles.copy}>Nessuna partita disponibile.</Text>;

  const update = (next: Fixture) => onChange({ ...content, fixtures: content.fixtures.map((item) => item.id === next.id ? next : item) });
  const saveKickoff = () => {
    const value = kickoffIso(officialDate, officialTime);
    if (!value) return Alert.alert('Orario non valido', 'Inserisci data nel formato GG/MM/AAAA e ora nel formato HH:MM.');
    void update({ ...fixture, dateLabel: officialDate.trim(), time: officialTime.trim(), kickoffAt: value });
  };
  const phase = (type: LiveEvent['type'], label: string, livePhase: Fixture['livePhase'], status: Fixture['status'], eventMinute: number) => {
    const event: LiveEvent = { id: id(), type, label, minute: eventMinute, score: `${fixture.homeScore ?? 0}-${fixture.awayScore ?? 0}`, createdAt: new Date().toISOString() };
    void update({ ...fixture, livePhase, status, minute: eventMinute, liveEvents: [event, ...(fixture.liveEvents ?? [])] });
  };
  const goal = (side: 'home' | 'away') => {
    if (!scorer.trim()) return Alert.alert('Marcatore mancante', 'Inserisci il nome.');
    const team = side === 'home' ? fixture.home : fixture.away;
    const homeScore = (fixture.homeScore ?? 0) + (side === 'home' ? 1 : 0);
    const awayScore = (fixture.awayScore ?? 0) + (side === 'away' ? 1 : 0);
    const event: LiveEvent = { id: id(), type: 'goal', label: `Gol ${team}`, minute: Number(minute) || undefined, team, scorer: scorer.trim(), score: `${homeScore}-${awayScore}`, createdAt: new Date().toISOString() };
    void update({ ...fixture, status: 'live', homeScore, awayScore, minute: Number(minute) || fixture.minute, liveEvents: [event, ...(fixture.liveEvents ?? [])] });
    setScorer('');
    setMinute('');
  };
  const addMatchEvent = (type: 'chance' | 'yellow_card' | 'substitution', label: string) => {
    if (!eventDetail.trim()) return Alert.alert('Dettaglio mancante', 'Inserisci giocatore o descrizione dell’evento.');
    const team = eventTeam === 'home' ? fixture.home : fixture.away;
    const event: LiveEvent = { id: id(), type, label: `${label} ${team}`, minute: Number(minute) || undefined, team, scorer: eventDetail.trim(), score: `${fixture.homeScore ?? 0}-${fixture.awayScore ?? 0}`, createdAt: new Date().toISOString() };
    void update({ ...fixture, status: 'live', minute: Number(minute) || fixture.minute, liveEvents: [event, ...(fixture.liveEvents ?? [])] });
    setEventDetail('');
    setMinute('');
  };

  return <View style={{ gap: 14 }}>
    {availableFixtures.length > 1 ? <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Partita da gestire</Text>
      <View style={adminStyles.choices}>{availableFixtures.map((item) => <Pressable key={item.id} onPress={() => setSelectedId(item.id)} style={[adminStyles.choice, item.id === fixture.id && adminStyles.choiceActive]}><Text style={[adminStyles.choiceText, item.id === fixture.id && adminStyles.choiceTextActive]}>{item.home} – {item.away}</Text></Pressable>)}</View>
    </View> : null}

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Inizio ufficiale</Text>
      <View style={adminStyles.row}><Field label="Data" value={officialDate} onChangeText={setOfficialDate} placeholder="06/09/2026" /><Field label="Ora" value={officialTime} onChangeText={setOfficialTime} placeholder="15:00" /></View>
      <Button label="Salva orario ufficiale" icon="clock-check-outline" onPress={saveKickoff} />
    </View>

    <View style={[adminStyles.panel, { backgroundColor: colors.accentStrong }]}><Text style={{ color: colors.accentSoft, fontWeight: '900' }}>CONTROLLO PARTITA</Text><Text style={{ color: colors.paper, fontSize: 21, fontWeight: '900', marginTop: 7 }}>{fixture.home} – {fixture.away}</Text><Text style={{ color: colors.paper, fontSize: 46, fontWeight: '900', marginTop: 5 }}>{fixture.homeScore ?? 0} - {fixture.awayScore ?? 0}</Text></View>
    <View style={adminStyles.panel}><Text style={adminStyles.title}>Fasi partita</Text><Button label="Inizio partita" icon="play" onPress={() => phase('kickoff', 'Inizio partita', 'first_half', 'live', 1)} /><Button label="Intervallo" icon="pause" secondary onPress={() => phase('halftime', 'Fine primo tempo', 'halftime', 'live', 45)} /><Button label="Secondo tempo" icon="play" onPress={() => phase('second_half', 'Inizio secondo tempo', 'second_half', 'live', 46)} /><Button label="Fine partita" icon="flag-checkered" secondary onPress={() => phase('fulltime', 'Fine partita', 'finished', 'final', 90)} /></View>
    <View style={adminStyles.panel}><Text style={adminStyles.title}>Registra gol</Text><View style={adminStyles.row}><Field label="Marcatore" value={scorer} onChangeText={setScorer} /><Field label="Minuto" value={minute} onChangeText={setMinute} keyboardType="numeric" /></View><View style={adminStyles.row}><Button label={`Gol ${fixture.home}`} icon="soccer" onPress={() => goal('home')} /><Button label={`Gol ${fixture.away}`} icon="soccer" secondary onPress={() => goal('away')} /></View></View>
    <View style={adminStyles.panel}><Text style={adminStyles.title}>Altro evento</Text><View style={adminStyles.choices}><Pressable onPress={() => setEventTeam('home')} style={[adminStyles.choice, eventTeam === 'home' && adminStyles.choiceActive]}><Text style={[adminStyles.choiceText, eventTeam === 'home' && adminStyles.choiceTextActive]}>{fixture.home}</Text></Pressable><Pressable onPress={() => setEventTeam('away')} style={[adminStyles.choice, eventTeam === 'away' && adminStyles.choiceActive]}><Text style={[adminStyles.choiceText, eventTeam === 'away' && adminStyles.choiceTextActive]}>{fixture.away}</Text></Pressable></View><View style={adminStyles.row}><Field label="Giocatore o descrizione" value={eventDetail} onChangeText={setEventDetail} /><Field label="Minuto" value={minute} onChangeText={setMinute} keyboardType="numeric" /></View><Button label="Occasione" icon="alert-circle-outline" secondary onPress={() => addMatchEvent('chance', 'Occasione')} /><Button label="Ammonizione" icon="card-outline" secondary onPress={() => addMatchEvent('yellow_card', 'Ammonizione')} /><Button label="Sostituzione" icon="swap-horizontal" secondary onPress={() => addMatchEvent('substitution', 'Sostituzione')} /></View>
    <View style={adminStyles.panel}><Text style={adminStyles.title}>Ultimi eventi</Text><View style={adminStyles.list}>{(fixture.liveEvents ?? []).map((event) => <View key={event.id} style={adminStyles.listRow}><MaterialCommunityIcons name={eventIcons[event.type]} size={21} color={event.type === 'goal' ? colors.success : event.type === 'yellow_card' ? colors.yellow : colors.accentStrong} /><View style={adminStyles.listBody}><Text style={adminStyles.listTitle}>{event.label}</Text><Text style={adminStyles.listMeta}>{event.minute ? `${event.minute}' · ` : ''}{event.scorer ?? event.score}</Text></View></View>)}</View></View>
  </View>;
}
