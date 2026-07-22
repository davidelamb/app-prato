import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { colors } from '../../theme';
import { AppContent, Fixture, LiveEvent, MatchLineup } from '../../types';
import { kickoffInput, kickoffIso, kickoffTimestamp } from '../../utils/fixture-time';
import { currentEventTiming, formatMatchClock, phaseElapsedSeconds, removeGoal, sortLiveEvents } from '../../utils/live-match';
import { synchronizeFixture } from '../../utils/match-sync';
import { isPratoTeam } from '../../utils/team-names';
import { Button, Field, adminStyles } from './Primitives';

const eventId = () => `event-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const roleOrder = { Portiere: 0, Difensore: 1, Centrocampista: 2, Attaccante: 3 } as const;

function addEvent(fixture: Fixture, event: LiveEvent): Fixture {
  return { ...fixture, liveEvents: [...(fixture.liveEvents ?? []), event] };
}

function lineupForPrato(fixture: Fixture): MatchLineup | undefined {
  if (isPratoTeam(fixture.home)) return fixture.homeLineup;
  if (isPratoTeam(fixture.away)) return fixture.awayLineup;
  return undefined;
}

export function LiveAdmin({ content, onChange }: { content: AppContent; onChange: (next: AppContent) => Promise<void> }) {
  const availableFixtures = useMemo(() => [...content.fixtures]
    .sort((a, b) => (kickoffTimestamp(a) ?? Number.MAX_SAFE_INTEGER) - (kickoffTimestamp(b) ?? Number.MAX_SAFE_INTEGER)), [content.fixtures]);
  const [selectedId, setSelectedId] = useState(availableFixtures[0]?.id ?? '');
  const fixture = content.fixtures.find((item) => item.id === selectedId) ?? availableFixtures[0];
  const [officialDate, setOfficialDate] = useState('');
  const [officialTime, setOfficialTime] = useState('');
  const [formation, setFormation] = useState('');
  const [starters, setStarters] = useState<string[]>([]);
  const [substitutes, setSubstitutes] = useState<string[]>([]);
  const [scorerId, setScorerId] = useState('');
  const [opponentScorer, setOpponentScorer] = useState('');
  const [now, setNow] = useState(Date.now());

  const players = useMemo(() => [...content.players].sort((a, b) => roleOrder[a.role] - roleOrder[b.role]
    || (a.number ?? Number.MAX_SAFE_INTEGER) - (b.number ?? Number.MAX_SAFE_INTEGER)
    || a.name.localeCompare(b.name, 'it')), [content.players]);

  useEffect(() => {
    if (!fixture) return;
    const input = kickoffInput(fixture);
    const lineup = lineupForPrato(fixture);
    setOfficialDate(input.date);
    setOfficialTime(input.time);
    setFormation(lineup?.formation ?? '4-3-3');
    setStarters(lineup?.starters.map((item) => item.playerId) ?? []);
    setSubstitutes(lineup?.substitutes.map((item) => item.playerId) ?? []);
    setScorerId('');
    setOpponentScorer('');
  }, [fixture?.id, fixture?.kickoffAt, fixture?.dateLabel, fixture?.time, fixture?.homeLineup, fixture?.awayLineup]);

  useEffect(() => {
    if (fixture?.livePhase !== 'first_half' && fixture?.livePhase !== 'second_half') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [fixture?.id, fixture?.livePhase, fixture?.phaseStartedAt]);

  if (!fixture) return <Text style={adminStyles.copy}>Nessuna partita disponibile.</Text>;

  const commitFixture = async (nextFixture: Fixture) => onChange(synchronizeFixture(content, nextFixture));
  const currentScore = () => `${fixture.homeScore ?? 0}-${fixture.awayScore ?? 0}`;

  const saveKickoff = async () => {
    const value = kickoffIso(officialDate, officialTime);
    if (!value) return Alert.alert('Orario non valido', 'Inserisci data nel formato GG/MM/AAAA e ora nel formato HH:MM.');
    await commitFixture({ ...fixture, dateLabel: officialDate.trim(), time: officialTime.trim(), kickoffAt: value });
  };

  const startMatch = async () => {
    if ((fixture.livePhase ?? 'scheduled') !== 'scheduled') return;
    const createdAt = new Date().toISOString();
    const homeScore = fixture.homeScore ?? 0;
    const awayScore = fixture.awayScore ?? 0;
    const event: LiveEvent = { id: eventId(), type: 'kickoff', label: 'Inizio partita', minute: 0, minuteLabel: "0'", phase: 'first_half', phaseElapsedSeconds: 0, score: `${homeScore}-${awayScore}`, createdAt };
    await commitFixture(addEvent({ ...fixture, status: 'live', livePhase: 'first_half', homeScore, awayScore, minute: 0, phaseStartedAt: createdAt, firstHalfElapsedSeconds: 0, secondHalfElapsedSeconds: 0 }, event));
  };

  const endFirstHalf = async () => {
    if (fixture.livePhase !== 'first_half') return;
    const createdAt = new Date().toISOString();
    const elapsed = phaseElapsedSeconds(fixture, Date.parse(createdAt));
    const timing = currentEventTiming(fixture, Date.parse(createdAt));
    const event: LiveEvent = { id: eventId(), type: 'halftime', label: 'Fine primo tempo', ...timing, minuteLabel: 'Intervallo', score: currentScore(), createdAt };
    await commitFixture(addEvent({ ...fixture, livePhase: 'halftime', minute: timing.minute, phaseStartedAt: undefined, firstHalfElapsedSeconds: elapsed }, event));
  };

  const startSecondHalf = async () => {
    if (fixture.livePhase !== 'halftime') return;
    const createdAt = new Date().toISOString();
    const event: LiveEvent = { id: eventId(), type: 'second_half', label: 'Inizio secondo tempo', minute: 45, minuteLabel: "45'", phase: 'second_half', phaseElapsedSeconds: 0, score: currentScore(), createdAt };
    await commitFixture(addEvent({ ...fixture, status: 'live', livePhase: 'second_half', minute: 45, phaseStartedAt: createdAt, secondHalfElapsedSeconds: 0 }, event));
  };

  const finishMatch = async () => {
    if (fixture.livePhase !== 'second_half') return;
    const createdAt = new Date().toISOString();
    const elapsed = phaseElapsedSeconds(fixture, Date.parse(createdAt));
    const timing = currentEventTiming(fixture, Date.parse(createdAt));
    const event: LiveEvent = { id: eventId(), type: 'fulltime', label: 'Fine partita', ...timing, minuteLabel: 'Finale', phase: 'finished', score: currentScore(), createdAt };
    await commitFixture(addEvent({ ...fixture, status: 'final', livePhase: 'finished', minute: timing.minute, phaseStartedAt: undefined, secondHalfElapsedSeconds: elapsed }, event));
  };

  const saveLineup = async () => {
    if (starters.length !== 11) return Alert.alert('Formazione incompleta', `Seleziona esattamente 11 titolari. Attualmente: ${starters.length}/11.`);
    const lineup: MatchLineup = {
      formation: formation.trim() || undefined,
      starters: starters.map((playerId, positionOrder) => ({ playerId, starter: true, positionOrder })),
      substitutes: substitutes.filter((playerId) => !starters.includes(playerId)).map((playerId, positionOrder) => ({ playerId, starter: false, positionOrder })),
      confirmedAt: new Date().toISOString(),
    };
    const nextFixture = isPratoTeam(fixture.home)
      ? { ...fixture, homeLineup: lineup }
      : isPratoTeam(fixture.away) ? { ...fixture, awayLineup: lineup } : fixture;
    await commitFixture(nextFixture);
    Alert.alert('Formazione salvata', 'Titolari e panchina sono ora visibili nel Live.');
  };

  const toggleStarter = (playerId: string) => {
    setStarters((current) => {
      if (current.includes(playerId)) return current.filter((id) => id !== playerId);
      if (current.length >= 11) {
        Alert.alert('Undici titolari già selezionati', 'Rimuovi un titolare prima di aggiungerne un altro.');
        return current;
      }
      setSubstitutes((currentSubs) => currentSubs.filter((id) => id !== playerId));
      return [...current, playerId];
    });
  };

  const toggleSubstitute = (playerId: string) => {
    if (starters.includes(playerId)) return;
    setSubstitutes((current) => current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId]);
  };

  const addGoal = async (pratoGoal: boolean) => {
    if (fixture.livePhase !== 'first_half' && fixture.livePhase !== 'second_half') return Alert.alert('Timer fermo', 'Avvia il tempo di gioco prima di registrare un gol.');
    const pratoHome = isPratoTeam(fixture.home);
    const pratoAway = isPratoTeam(fixture.away);
    if (!pratoHome && !pratoAway) return Alert.alert('Partita non valida', 'Questa partita non contiene il Prato.');
    const team = pratoGoal ? (pratoHome ? fixture.home : fixture.away) : (pratoHome ? fixture.away : fixture.home);
    const player = pratoGoal ? content.players.find((item) => item.id === scorerId) : undefined;
    if (pratoGoal && !player) return Alert.alert('Marcatore mancante', 'Scegli il marcatore dalla formazione ufficiale.');
    const createdAt = new Date().toISOString();
    const timing = currentEventTiming(fixture, Date.parse(createdAt));
    const homeScore = (fixture.homeScore ?? 0) + (team === fixture.home ? 1 : 0);
    const awayScore = (fixture.awayScore ?? 0) + (team === fixture.away ? 1 : 0);
    const scorer = pratoGoal ? player?.name : opponentScorer.trim() || undefined;
    const event: LiveEvent = {
      id: eventId(),
      type: 'goal',
      label: pratoGoal ? `Gol ${team}` : 'Gol avversario',
      ...timing,
      team,
      playerId: player?.id,
      scorer,
      score: `${homeScore}-${awayScore}`,
      createdAt,
    };
    await commitFixture(addEvent({ ...fixture, status: 'live', homeScore, awayScore, minute: timing.minute }, event));
    setScorerId('');
    setOpponentScorer('');
  };

  const deleteGoal = (event: LiveEvent) => {
    Alert.alert('Eliminare questo gol?', `${event.minuteLabel ?? ''} ${event.scorer ?? event.team ?? ''}`.trim(), [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => void commitFixture(removeGoal(fixture, event.id)) },
    ]);
  };

  const savedLineup = lineupForPrato(fixture);
  const scorerIds = new Set([...(savedLineup?.starters ?? []), ...(savedLineup?.substitutes ?? [])].map((item) => item.playerId));
  const eligibleScorers = players.filter((player) => scorerIds.has(player.id));
  const liveActive = fixture.livePhase === 'first_half' || fixture.livePhase === 'second_half';
  const events = sortLiveEvents(fixture.liveEvents ?? []).reverse();

  return <View style={{ gap: 14 }}>
    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Partita da gestire</Text>
      <View style={adminStyles.choices}>{availableFixtures.map((item) => <Pressable key={item.id} onPress={() => setSelectedId(item.id)} style={[adminStyles.choice, item.id === fixture.id && adminStyles.choiceActive]}>
        <Text style={[adminStyles.choiceText, item.id === fixture.id && adminStyles.choiceTextActive]}>{item.home} – {item.away}</Text>
      </Pressable>)}</View>
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Inizio ufficiale</Text>
      <View style={adminStyles.row}><Field label="Data" value={officialDate} onChangeText={setOfficialDate} placeholder="06/09/2026" /><Field label="Ora" value={officialTime} onChangeText={setOfficialTime} placeholder="15:00" /></View>
      <Button label="Salva orario ufficiale" icon="clock-check-outline" onPress={() => void saveKickoff()} />
    </View>

    <View style={[adminStyles.panel, { backgroundColor: colors.accentStrong }]}>
      <Text style={{ color: colors.accentSoft, fontWeight: '900' }}>CONTROLLO PARTITA · {fixture.livePhase ?? 'scheduled'}</Text>
      <Text style={{ color: colors.paper, fontSize: 21, fontWeight: '900', marginTop: 7 }}>{fixture.home} – {fixture.away}</Text>
      <Text style={{ color: colors.paper, fontSize: 46, fontWeight: '900', marginTop: 5 }}>{fixture.homeScore ?? 0} - {fixture.awayScore ?? 0}</Text>
      <Text style={{ color: colors.yellow, fontSize: 28, fontWeight: '900', marginTop: 3 }}>{formatMatchClock(fixture, now)}</Text>
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Fasi partita</Text>
      <Button label="Inizio partita" icon="play" disabled={(fixture.livePhase ?? 'scheduled') !== 'scheduled'} onPress={() => void startMatch()} />
      <Button label="Fine primo tempo" icon="pause" secondary disabled={fixture.livePhase !== 'first_half'} onPress={() => void endFirstHalf()} />
      <Button label="Inizio secondo tempo" icon="play" disabled={fixture.livePhase !== 'halftime'} onPress={() => void startSecondHalf()} />
      <Button label="Fine partita" icon="flag-checkered" secondary disabled={fixture.livePhase !== 'second_half'} onPress={() => void finishMatch()} />
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Formazione ufficiale AC Prato</Text>
      <Text style={adminStyles.copy}>Seleziona 11 titolari e le riserve. Un giocatore non può essere in entrambi gli elenchi.</Text>
      <Field label="Modulo" value={formation} onChangeText={setFormation} placeholder="4-3-3" />
      <Text style={[adminStyles.listTitle, { marginTop: 14 }]}>Titolari {starters.length}/11</Text>
      <View style={adminStyles.choices}>{players.map((player) => <Pressable key={`starter-${player.id}`} onPress={() => toggleStarter(player.id)} style={[adminStyles.choice, starters.includes(player.id) && adminStyles.choiceActive]}>
        <Text style={[adminStyles.choiceText, starters.includes(player.id) && adminStyles.choiceTextActive]}>{player.number ? `${player.number} · ` : ''}{player.name}</Text>
      </Pressable>)}</View>
      <Text style={[adminStyles.listTitle, { marginTop: 8 }]}>Panchina ({substitutes.length})</Text>
      <View style={adminStyles.choices}>{players.filter((player) => !starters.includes(player.id)).map((player) => <Pressable key={`sub-${player.id}`} onPress={() => toggleSubstitute(player.id)} style={[adminStyles.choice, substitutes.includes(player.id) && adminStyles.choiceActive]}>
        <Text style={[adminStyles.choiceText, substitutes.includes(player.id) && adminStyles.choiceTextActive]}>{player.number ? `${player.number} · ` : ''}{player.name}</Text>
      </Pressable>)}</View>
      <Button label="Salva formazione" icon="account-check-outline" disabled={starters.length !== 11} onPress={() => void saveLineup()} />
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Registra gol AC Prato</Text>
      <Text style={adminStyles.copy}>Il minuto viene preso automaticamente dal timer. Il marcatore può essere scelto solo dalla formazione salvata.</Text>
      <View style={adminStyles.choices}>{eligibleScorers.map((player) => <Pressable key={player.id} onPress={() => setScorerId(player.id)} style={[adminStyles.choice, scorerId === player.id && adminStyles.choiceActive]}>
        <Text style={[adminStyles.choiceText, scorerId === player.id && adminStyles.choiceTextActive]}>{player.number ? `${player.number} · ` : ''}{player.name}</Text>
      </Pressable>)}</View>
      {!eligibleScorers.length ? <Text style={adminStyles.copy}>Salva prima la formazione ufficiale.</Text> : null}
      <Button label="Gol Prato" icon="soccer" disabled={!liveActive || !scorerId} onPress={() => void addGoal(true)} />
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Registra gol avversario</Text>
      <Field label="Marcatore (facoltativo)" value={opponentScorer} onChangeText={setOpponentScorer} />
      <Button label="Gol avversario" icon="soccer" danger disabled={!liveActive} onPress={() => void addGoal(false)} />
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Cronologia eventi</Text>
      <View style={adminStyles.list}>{events.map((event) => <View key={event.id} style={adminStyles.listRow}>
        <MaterialCommunityIcons name={event.type === 'goal' ? 'soccer' : 'circle-medium'} size={21} color={event.type === 'goal' ? colors.success : colors.accentStrong} />
        <View style={adminStyles.listBody}><Text style={adminStyles.listTitle}>{event.minuteLabel ? `${event.minuteLabel} · ` : ''}{event.label}</Text><Text style={adminStyles.listMeta}>{event.scorer ? `${event.scorer} · ` : ''}{event.score ?? ''}</Text></View>
        {event.type === 'goal' ? <Pressable accessibilityLabel="Elimina gol" onPress={() => deleteGoal(event)} style={{ padding: 8 }}><MaterialCommunityIcons name="trash-can-outline" size={19} color={colors.live} /></Pressable> : null}
      </View>)}</View>
    </View>
  </View>;
}
