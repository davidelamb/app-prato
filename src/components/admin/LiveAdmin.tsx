import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';

import { colors } from '../../theme';
import { displayPlayerName } from '../../utils/player-name';
import { AppContent, Fixture, LiveEvent, LivePhase, MatchLineup } from '../../types';
import { kickoffInput, kickoffIso, kickoffTimestamp } from '../../utils/fixture-time';
import { currentEventTiming, formatMatchClock, phaseElapsedSeconds, removeEvent, removeGoal, shouldAddSecondYellowRed, sortLiveEvents, updateEventMinute } from '../../utils/live-match';
import { lineupSelectionForRoster } from '../../utils/lineup-roster';
import { synchronizeFixture } from '../../utils/match-sync';
import { displayTeamName, isPratoTeam, opponentOfPrato } from '../../utils/team-names';
import { Button, Field, adminStyles, confirmAdminAction } from './Primitives';

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
  const activeFixtures = useMemo(() => content.fixtures
    .filter((fixture) => fixture.status !== 'final')
    .sort((a, b) => (kickoffTimestamp(a) ?? Number.MAX_SAFE_INTEGER) - (kickoffTimestamp(b) ?? Number.MAX_SAFE_INTEGER)), [content.fixtures]);
  const archivedFixtures = useMemo(() => content.fixtures
    .filter((fixture) => fixture.status === 'final')
    .sort((a, b) => (kickoffTimestamp(b) ?? Number.MIN_SAFE_INTEGER) - (kickoffTimestamp(a) ?? Number.MIN_SAFE_INTEGER)), [content.fixtures]);
  const availableFixtures = useMemo(() => [...activeFixtures, ...archivedFixtures], [activeFixtures, archivedFixtures]);
  const [selectedId, setSelectedId] = useState(availableFixtures[0]?.id ?? '');
  const fixture = content.fixtures.find((item) => item.id === selectedId) ?? availableFixtures[0];
  const [officialDate, setOfficialDate] = useState('');
  const [officialTime, setOfficialTime] = useState('');
  const [formation, setFormation] = useState('');
  const [starters, setStarters] = useState<string[]>([]);
  const [substitutes, setSubstitutes] = useState<string[]>([]);
  const [scorerId, setScorerId] = useState('');
  const [opponentScorer, setOpponentScorer] = useState('');
  const [subOutId, setSubOutId] = useState('');
  const [subInId, setSubInId] = useState('');
  const [cardPlayerId, setCardPlayerId] = useState('');
  const [opponentCardPlayer, setOpponentCardPlayer] = useState('');
  const [editEventsMode, setEditEventsMode] = useState(false);
  const [minuteDrafts, setMinuteDrafts] = useState<Record<string, string>>({});
  const [now, setNow] = useState(Date.now());

  const players = useMemo(() => [...content.players].sort((a, b) => roleOrder[a.role] - roleOrder[b.role]
    || (a.number ?? Number.MAX_SAFE_INTEGER) - (b.number ?? Number.MAX_SAFE_INTEGER)
    || a.name.localeCompare(b.name, 'it')), [content.players]);

  useEffect(() => {
    if (!fixture) return;
    const input = kickoffInput(fixture);
    const lineup = lineupForPrato(fixture);
    const currentSelection = lineupSelectionForRoster(lineup, players.map((player) => player.id));
    setOfficialDate(input.date);
    setOfficialTime(input.time);
    setFormation(lineup?.formation ?? '4-3-3');
    setStarters(currentSelection.starters);
    setSubstitutes(currentSelection.substitutes);
    setScorerId('');
    setOpponentScorer('');
    setSubOutId('');
    setSubInId('');
    setCardPlayerId('');
    setOpponentCardPlayer('');
    setEditEventsMode(false);
    setMinuteDrafts({});
  }, [fixture?.id, fixture?.kickoffAt, fixture?.dateLabel, fixture?.time, fixture?.homeLineup, fixture?.awayLineup, players]);

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
    const currentSelection = lineupSelectionForRoster({
      starters: starters.map((playerId) => ({ playerId, starter: true })),
      substitutes: substitutes.map((playerId) => ({ playerId, starter: false })),
    }, players.map((player) => player.id));
    if (currentSelection.starters.length !== 11) return Alert.alert('Formazione incompleta', `Seleziona esattamente 11 titolari della rosa attuale. Attualmente: ${currentSelection.starters.length}/11.`);
    const lineup: MatchLineup = {
      formation: formation.trim() || undefined,
      starters: currentSelection.starters.map((playerId, positionOrder) => ({ playerId, starter: true, positionOrder })),
      substitutes: currentSelection.substitutes.map((playerId, positionOrder) => ({ playerId, starter: false, positionOrder })),
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
    const scorer = pratoGoal && player ? displayPlayerName(player.name) : opponentScorer.trim() || undefined;
    const event: LiveEvent = {
      id: eventId(),
      type: 'goal',
      label: `Gol ${displayTeamName(team)}`,
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
    confirmAdminAction('Eliminare questo gol?', `${event.minuteLabel ?? ''} ${event.scorer ?? event.team ?? ''}`.trim(), () => commitFixture(removeGoal(fixture, event.id)));
  };

  // Giocatori Prato attualmente in campo: titolari meno chi è già stato
  // sostituito, più chi è già entrato dalla panchina.
  const savedLineup = lineupForPrato(fixture);

  const onPitchIds = useMemo(() => {
    const subEvents = (fixture.liveEvents ?? []).filter((event) => event.type === 'substitution');
    const set = new Set(savedLineup?.starters.map((item) => item.playerId) ?? []);
    for (const event of subEvents) {
      if (event.playerOutId) set.delete(event.playerOutId);
      if (event.playerInId) set.add(event.playerInId);
    }
    return set;
  }, [fixture.liveEvents, savedLineup]);

  const onPitchPlayers = players.filter((player) => onPitchIds.has(player.id));
  const benchAvailable = players.filter((player) => {
    const isSub = savedLineup?.substitutes.some((item) => item.playerId === player.id);
    return isSub && !onPitchIds.has(player.id);
  });

  const addSubstitution = async () => {
    if (!liveActive) return Alert.alert('Timer fermo', 'Avvia il tempo di gioco prima di registrare un cambio.');
    const playerOut = players.find((item) => item.id === subOutId);
    const playerIn = players.find((item) => item.id === subInId);
    if (!playerOut || !playerIn) return Alert.alert('Cambio incompleto', 'Seleziona sia il giocatore che esce sia quello che entra.');
    const pratoTeam = isPratoTeam(fixture.home) ? fixture.home : fixture.away;
    const createdAt = new Date().toISOString();
    const timing = currentEventTiming(fixture, Date.parse(createdAt));
    const event: LiveEvent = {
      id: eventId(),
      type: 'substitution',
      label: `Cambio: esce ${displayPlayerName(playerOut.name)}, entra ${displayPlayerName(playerIn.name)}`,
      ...timing,
      team: pratoTeam,
      playerOutId: playerOut.id,
      playerInId: playerIn.id,
      score: currentScore(),
      createdAt,
    };
    await commitFixture(addEvent({ ...fixture, minute: timing.minute }, event));
    setSubOutId('');
    setSubInId('');
  };

  const addCard = async (pratoSide: boolean, cardType: 'yellow_card' | 'red_card') => {
    if (!liveActive) return Alert.alert('Timer fermo', 'Avvia il tempo di gioco prima di registrare un cartellino.');
    const pratoHome = isPratoTeam(fixture.home);
    const team = pratoSide ? (pratoHome ? fixture.home : fixture.away) : (pratoHome ? fixture.away : fixture.home);
    const player = pratoSide ? players.find((item) => item.id === cardPlayerId) : undefined;
    if (pratoSide && !player) return Alert.alert('Giocatore mancante', 'Scegli il giocatore ammonito/espulso.');
    const createdAt = new Date().toISOString();
    const timing = currentEventTiming(fixture, Date.parse(createdAt));
    const cardLabel = cardType === 'yellow_card' ? 'Cartellino giallo' : 'Cartellino rosso';
    const name = pratoSide && player ? displayPlayerName(player.name) : opponentCardPlayer.trim() || undefined;
    const addAutomaticRed = cardType === 'yellow_card' && shouldAddSecondYellowRed(
      fixture.liveEvents ?? [],
      { team, playerId: player?.id, playerName: name },
    );
    const event: LiveEvent = {
      id: eventId(),
      type: cardType,
      label: name ? `${cardLabel}: ${name}` : `${cardLabel} (${team})`,
      ...timing,
      team,
      playerId: player?.id,
      scorer: name,
      score: currentScore(),
      createdAt,
    };
    let nextFixture = addEvent({ ...fixture, minute: timing.minute }, event);
    if (addAutomaticRed) {
      nextFixture = addEvent(nextFixture, {
        ...event,
        id: eventId(),
        type: 'red_card',
        label: name
          ? `Cartellino rosso per doppia ammonizione: ${name}`
          : `Cartellino rosso per doppia ammonizione (${team})`,
        createdAt: new Date(Date.parse(createdAt) + 1).toISOString(),
      });
    }
    await commitFixture(nextFixture);
    setCardPlayerId('');
    setOpponentCardPlayer('');
  };

  // ── Modifica/eliminazione di qualunque evento (disponibile anche a partita in corso, non solo a fine partita) ──
  const deleteAnyEvent = (event: LiveEvent) => {
    confirmAdminAction('Eliminare questo evento?', `${event.minuteLabel ?? ''} ${event.label}`.trim(), () => commitFixture(removeEvent(fixture, event.id)));
  };

  const saveEventMinute = async (event: LiveEvent) => {
    const raw = minuteDrafts[event.id];
    const minuteValue = Number(raw);
    if (!raw || !Number.isInteger(minuteValue) || minuteValue < 0 || minuteValue > 130) {
      return Alert.alert('Minuto non valido', 'Inserisci un numero intero fra 0 e 130.');
    }
    const phase: LivePhase = minuteValue > 45 ? 'second_half' : 'first_half';
    const elapsedSeconds = (phase === 'second_half' ? minuteValue - 45 : minuteValue) * 60;
    await commitFixture(updateEventMinute(fixture, event.id, phase, elapsedSeconds));
  };

  const scorerIds = new Set([...(savedLineup?.starters ?? []), ...(savedLineup?.substitutes ?? [])].map((item) => item.playerId));
  const eligibleScorers = players.filter((player) => scorerIds.has(player.id));
  const liveActive = fixture.livePhase === 'first_half' || fixture.livePhase === 'second_half';
  const events = sortLiveEvents(fixture.liveEvents ?? []).reverse();
  const opponentName = displayTeamName(opponentOfPrato(fixture.home, fixture.away) ?? 'Avversario');

  return <View style={{ gap: 14 }}>
    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Partite da gestire</Text>
      {activeFixtures.length === 0 ? <Text style={adminStyles.copy}>Non ci sono partite attive o in programma.</Text> : null}
      <View style={adminStyles.choices}>{activeFixtures.map((item) => <Pressable key={item.id} onPress={() => setSelectedId(item.id)} style={[adminStyles.choice, item.id === fixture.id && adminStyles.choiceActive]}>
        <Text style={[adminStyles.choiceText, item.id === fixture.id && adminStyles.choiceTextActive]}>{item.home} – {item.away}</Text>
      </Pressable>)}</View>
    </View>

    {archivedFixtures.length > 0 ? <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Archivio partite concluse</Text>
      <Text style={adminStyles.copy}>Le partite restano consultabili e modificabili per eventuali correzioni.</Text>
      <View style={adminStyles.choices}>{archivedFixtures.map((item) => <Pressable key={item.id} onPress={() => setSelectedId(item.id)} style={[adminStyles.choice, item.id === fixture.id && adminStyles.choiceActive]}>
        <Text style={[adminStyles.choiceText, item.id === fixture.id && adminStyles.choiceTextActive]}>{item.home} – {item.away}</Text>
      </Pressable>)}</View>
    </View> : null}

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
      <Text style={adminStyles.copy}>Rosa attuale: {players.length} giocatori. Seleziona 11 titolari e le riserve.</Text>
      <Field label="Modulo" value={formation} onChangeText={setFormation} placeholder="4-3-3" />
      <Text style={[adminStyles.listTitle, { marginTop: 14 }]}>Titolari {starters.length}/11</Text>
      <View style={adminStyles.choices}>{players.map((player) => <Pressable key={`starter-${player.id}`} onPress={() => toggleStarter(player.id)} style={[adminStyles.choice, starters.includes(player.id) && adminStyles.choiceActive]}>
        <Text style={[adminStyles.choiceText, starters.includes(player.id) && adminStyles.choiceTextActive]}>{player.number ? `${player.number} · ` : ''}{displayPlayerName(player.name)}</Text>
      </Pressable>)}</View>
      <Text style={[adminStyles.listTitle, { marginTop: 8 }]}>Panchina ({substitutes.length})</Text>
      <View style={adminStyles.choices}>{players.filter((player) => !starters.includes(player.id)).map((player) => <Pressable key={`sub-${player.id}`} onPress={() => toggleSubstitute(player.id)} style={[adminStyles.choice, substitutes.includes(player.id) && adminStyles.choiceActive]}>
        <Text style={[adminStyles.choiceText, substitutes.includes(player.id) && adminStyles.choiceTextActive]}>{player.number ? `${player.number} · ` : ''}{displayPlayerName(player.name)}</Text>
      </Pressable>)}</View>
      <Button label="Salva formazione" icon="account-check-outline" disabled={starters.length !== 11} onPress={() => void saveLineup()} />
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Registra gol AC Prato</Text>
      <Text style={adminStyles.copy}>Il minuto viene preso automaticamente dal timer. Il marcatore può essere scelto solo dalla formazione salvata.</Text>
      <View style={adminStyles.choices}>{eligibleScorers.map((player) => <Pressable key={player.id} onPress={() => setScorerId(player.id)} style={[adminStyles.choice, scorerId === player.id && adminStyles.choiceActive]}>
        <Text style={[adminStyles.choiceText, scorerId === player.id && adminStyles.choiceTextActive]}>{player.number ? `${player.number} · ` : ''}{displayPlayerName(player.name)}</Text>
      </Pressable>)}</View>
      {!eligibleScorers.length ? <Text style={adminStyles.copy}>Salva prima la formazione ufficiale.</Text> : null}
      <Button label="Gol Prato" icon="soccer" disabled={!liveActive || !scorerId} onPress={() => void addGoal(true)} />
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Registra gol {opponentName}</Text>
      <Field label="Marcatore (facoltativo)" value={opponentScorer} onChangeText={setOpponentScorer} />
      <Button label={`Gol ${opponentName}`} icon="soccer" danger disabled={!liveActive} onPress={() => void addGoal(false)} />
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Registra cambio (AC Prato)</Text>
      <Text style={adminStyles.copy}>Il minuto viene preso automaticamente dal timer. Puoi scegliere solo fra chi è attualmente in campo e chi è in panchina e non è ancora entrato.</Text>
      <Text style={[adminStyles.listTitle, { marginTop: 8 }]}>Esce</Text>
      <View style={adminStyles.choices}>{onPitchPlayers.map((player) => <Pressable key={`out-${player.id}`} onPress={() => setSubOutId(player.id)} style={[adminStyles.choice, subOutId === player.id && adminStyles.choiceActive]}>
        <Text style={[adminStyles.choiceText, subOutId === player.id && adminStyles.choiceTextActive]}>{player.number ? `${player.number} · ` : ''}{displayPlayerName(player.name)}</Text>
      </Pressable>)}</View>
      <Text style={[adminStyles.listTitle, { marginTop: 8 }]}>Entra</Text>
      <View style={adminStyles.choices}>{benchAvailable.map((player) => <Pressable key={`in-${player.id}`} onPress={() => setSubInId(player.id)} style={[adminStyles.choice, subInId === player.id && adminStyles.choiceActive]}>
        <Text style={[adminStyles.choiceText, subInId === player.id && adminStyles.choiceTextActive]}>{player.number ? `${player.number} · ` : ''}{displayPlayerName(player.name)}</Text>
      </Pressable>)}</View>
      {!benchAvailable.length ? <Text style={adminStyles.copy}>Nessuna riserva disponibile: salva prima la formazione ufficiale.</Text> : null}
      <Button label="Registra cambio" icon="swap-horizontal" disabled={!liveActive || !subOutId || !subInId} onPress={() => void addSubstitution()} />
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Cartellino AC Prato</Text>
      <Text style={adminStyles.copy}>Il secondo giallo allo stesso giocatore genera automaticamente il rosso.</Text>
      <View style={adminStyles.choices}>{onPitchPlayers.map((player) => <Pressable key={`card-${player.id}`} onPress={() => setCardPlayerId(player.id)} style={[adminStyles.choice, cardPlayerId === player.id && adminStyles.choiceActive]}>
        <Text style={[adminStyles.choiceText, cardPlayerId === player.id && adminStyles.choiceTextActive]}>{player.number ? `${player.number} · ` : ''}{displayPlayerName(player.name)}</Text>
      </Pressable>)}</View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <View style={{ flex: 1 }}><Button label="Giallo" icon="card" disabled={!liveActive || !cardPlayerId} onPress={() => void addCard(true, 'yellow_card')} /></View>
        <View style={{ flex: 1 }}><Button label="Rosso" icon="card" danger disabled={!liveActive || !cardPlayerId} onPress={() => void addCard(true, 'red_card')} /></View>
      </View>
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Cartellino avversario</Text>
      <Field label="Giocatore" value={opponentCardPlayer} onChangeText={setOpponentCardPlayer} />
      <Text style={adminStyles.copy}>Inserisci lo stesso nome per riconoscere automaticamente la doppia ammonizione.</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <View style={{ flex: 1 }}><Button label="Giallo" icon="card" secondary disabled={!liveActive} onPress={() => void addCard(false, 'yellow_card')} /></View>
        <View style={{ flex: 1 }}><Button label="Rosso" icon="card" danger disabled={!liveActive} onPress={() => void addCard(false, 'red_card')} /></View>
      </View>
    </View>

    <View style={adminStyles.panel}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <Text style={adminStyles.title}>Cronologia eventi</Text>
        <Pressable onPress={() => setEditEventsMode((v) => !v)} style={[adminStyles.choice, editEventsMode && adminStyles.choiceActive]}>
          <Text style={[adminStyles.choiceText, editEventsMode && adminStyles.choiceTextActive]}>{editEventsMode ? 'Fine modifica' : 'Modifica eventi'}</Text>
        </Pressable>
      </View>
      {editEventsMode ? <Text style={adminStyles.copy}>Puoi correggere il minuto di ogni evento o eliminarlo, anche a partita in corso. Il punteggio si ricalcola automaticamente.</Text> : null}
      <View style={adminStyles.list}>{events.map((event) => <View key={event.id} style={[adminStyles.listRow, { flexDirection: 'column', alignItems: 'stretch' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <MaterialCommunityIcons
            name={event.type === 'goal' ? 'soccer' : event.type === 'substitution' ? 'swap-horizontal' : event.type === 'yellow_card' || event.type === 'red_card' ? 'card' : 'circle-medium'}
            size={21}
            color={event.type === 'goal' ? colors.success : event.type === 'yellow_card' ? colors.yellow : event.type === 'red_card' ? colors.live : colors.accentStrong}
          />
          <View style={adminStyles.listBody}>
            <Text style={adminStyles.listTitle}>{event.minuteLabel ? `${event.minuteLabel} · ` : ''}{event.label}</Text>
            <Text style={adminStyles.listMeta}>{event.scorer ? `${event.scorer} · ` : ''}{event.score ?? ''}</Text>
          </View>
          {!editEventsMode && event.type === 'goal' ? <Pressable accessibilityLabel="Elimina gol" onPress={() => deleteGoal(event)} style={{ padding: 8 }}><MaterialCommunityIcons name="trash-can-outline" size={19} color={colors.live} /></Pressable> : null}
        </View>
        {editEventsMode ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.lineSoft }}>
            <Text style={{ color: colors.inkSoft, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }}>Minuto</Text>
            <TextInput
              value={minuteDrafts[event.id] ?? String(event.minute ?? '')}
              onChangeText={(value) => setMinuteDrafts((current) => ({ ...current, [event.id]: value }))}
              keyboardType="numeric"
              style={{ width: 56, minHeight: 38, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.canvasRaised, color: colors.ink, fontWeight: '800', textAlign: 'center' }}
            />
            <Pressable onPress={() => void saveEventMinute(event)} style={{ padding: 8 }} accessibilityLabel="Salva minuto"><MaterialCommunityIcons name="content-save-check-outline" size={20} color={colors.accentStrong} /></Pressable>
            <View style={{ flex: 1 }} />
            <Pressable accessibilityLabel="Elimina evento" onPress={() => deleteAnyEvent(event)} style={{ padding: 8 }}><MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.live} /></Pressable>
          </View>
        ) : null}
      </View>)}</View>
    </View>
  </View>;
}
