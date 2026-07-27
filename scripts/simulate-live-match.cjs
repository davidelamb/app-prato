#!/usr/bin/env node
'use strict';
// Simula una partita Live completa (kickoff → primo tempo → intervallo →
// secondo tempo → finale) usando le funzioni REALI del codice
// (sortLiveEvents, scoreFromGoalEvents, minuteLabelFor, formatMatchClock,
// synchronizeFixture, calculateStandingSets...), non una reimplementazione
// a parte. Serve a verificare che il sistema Live funzioni end-to-end.

const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('node:assert');
const { execFileSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;
function check(label, cond) {
  if (cond) { console.log(`  ✅ ${label}`); passed++; }
  else { console.log(`  ❌ ${label}`); failed++; }
}
function checkEqual(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) console.log(`     atteso: ${JSON.stringify(expected)} — trovato: ${JSON.stringify(actual)}`);
  check(label, ok);
}

function main() {
  const tscLib = path.resolve(projectRoot, 'node_modules', 'typescript', 'lib', 'tsc.js');
  if (!fs.existsSync(tscLib)) { console.error('tsc non trovato'); process.exit(1); }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sim-live-'));
  try {
    const srcFiles = [
      'src/types.ts',
      'src/utils/team-names.ts',
      'src/utils/standings.ts',
      'src/utils/live-match.ts',
      'src/utils/match-sync.ts',
      'src/utils/match-merge.ts',
    ].map((f) => path.join(projectRoot, f));

    execFileSync(process.execPath, [
      tscLib, '--outDir', tmpDir, '--module', 'commonjs', '--target', 'es2020',
      '--strict', '--esModuleInterop', '--skipLibCheck', '--moduleResolution', 'node',
      ...srcFiles,
    ], { cwd: projectRoot, stdio: 'pipe' });

    const liveMatch = require(path.join(tmpDir, 'utils', 'live-match.js'));
    const matchSync = require(path.join(tmpDir, 'utils', 'match-sync.js'));
    const standings = require(path.join(tmpDir, 'utils', 'standings.js'));

    console.log('\n═══ SIMULAZIONE PARTITA LIVE COMPLETA ═══\n');
    console.log('AC Prato vs Tau Calcio Altopascio — Serie D Girone E, 11ª giornata\n');

    // Stato iniziale: partita in calendario, non ancora iniziata
    let fixture = {
      id: 'sim-fixture-1',
      competition: 'Serie D · Girone E',
      matchday: '11ª giornata',
      dateLabel: 'DOM 15 NOV 2026',
      time: '14:30',
      home: 'AC Prato',
      away: 'Tau Calcio Altopascio',
      status: 'scheduled',
      venue: 'Stadio Lungobisenzio',
      livePhase: 'scheduled',
      liveEvents: [],
    };

    let content = {
      updatedAt: 'test',
      fixtures: [fixture],
      schedule: [{ id: 'sched-1', matchday: 11, competition: 'Campionato', roundLabel: '11ª giornata', home: 'AC Prato', away: 'Tau Calcio Altopascio', dateLabel: 'DOM 15 NOV 2026', time: '14:30', venue: 'Stadio Lungobisenzio', status: 'scheduled', sortOrder: 0 }],
      groupMatches: [{ id: 'sched-1', matchday: 11, competition: 'Campionato', roundLabel: '11ª giornata', home: 'AC Prato', away: 'Tau Calcio Altopascio', dateLabel: 'DOM 15 NOV 2026', time: '14:30', venue: 'Stadio Lungobisenzio', status: 'scheduled', sortOrder: 0 }],
      players: [
        { id: 'caon', number: 10, name: 'Giammarco Caon', role: 'Attaccante', appearances: 10, goals: 5, source: 'Transfermarkt' },
        { id: 'verde', number: 19, name: 'Francesco Verde', role: 'Attaccante', appearances: 10, goals: 3, source: 'Transfermarkt' },
      ],
      standings: [],
      news: [], media: [],
    };

    // ── 1. Prepartita: stato "scheduled" ──
    console.log('── Fase 1: prepartita ──');
    check('Stato iniziale: scheduled', fixture.livePhase === 'scheduled');
    check('Nessun punteggio prima del calcio d\'inizio', fixture.homeScore === undefined && fixture.awayScore === undefined);
    checkEqual('formatMatchClock mostra l\'orario', liveMatch.formatMatchClock(fixture), '14:30');

    // ── 2. Calcio d'inizio ──
    console.log('\n── Fase 2: calcio d\'inizio ──');
    const kickoffAt = new Date('2026-11-15T14:30:00.000Z').toISOString();
    fixture = {
      ...fixture,
      status: 'live',
      livePhase: 'first_half',
      phaseStartedAt: kickoffAt,
      firstHalfElapsedSeconds: 0,
      homeScore: 0,
      awayScore: 0,
      liveEvents: [
        { id: 'ev-kickoff', type: 'kickoff', label: 'Calcio d\'inizio', phase: 'first_half', score: '0-0', createdAt: kickoffAt },
      ],
    };
    content = matchSync.synchronizeFixture(content, fixture);
    fixture = content.fixtures[0];
    check('Fixture sincronizzata: status live', fixture.status === 'live');
    check('Fase: first_half', fixture.livePhase === 'first_half');
    checkEqual('Punteggio 0-0 al fischio d\'inizio', liveMatch.scoreFromGoalEvents(fixture), [0, 0]);
    const scheduleAfterKickoff = content.schedule.find((m) => m.id === 'sched-1');
    check('Il calendario NON segna ancora la partita come finale durante il live', scheduleAfterKickoff.status !== 'final');

    // ── 3. Primo tempo: gol del Prato al 23' (Caon) ──
    console.log('\n── Fase 3: gol AC Prato 23\' (Caon) ──');
    const goal23 = { id: 'ev-goal-1', type: 'goal', label: 'Gol! Caon', phase: 'first_half', phaseElapsedSeconds: 23 * 60, team: 'AC Prato', playerId: 'caon', createdAt: new Date('2026-11-15T14:53:00.000Z').toISOString() };
    fixture = { ...fixture, liveEvents: [...fixture.liveEvents, goal23] };
    const [h1, a1] = liveMatch.scoreFromGoalEvents(fixture);
    fixture = { ...fixture, homeScore: h1, awayScore: a1 };
    checkEqual('Punteggio dopo il gol: 1-0', [fixture.homeScore, fixture.awayScore], [1, 0]);
    checkEqual('minuteLabelFor al 23\' primo tempo', liveMatch.minuteLabelFor('first_half', 23 * 60), "23'");

    // ── 4. Fine primo tempo → intervallo ──
    console.log('\n── Fase 4: fine primo tempo, intervallo ──');
    fixture = { ...fixture, livePhase: 'halftime', firstHalfElapsedSeconds: 45 * 60, liveEvents: [...fixture.liveEvents, { id: 'ev-ht', type: 'halftime', label: 'Fine primo tempo', phase: 'halftime', createdAt: new Date('2026-11-15T15:15:00.000Z').toISOString() }] };
    checkEqual('formatMatchClock durante l\'intervallo', liveMatch.formatMatchClock(fixture), 'Intervallo');
    checkEqual('Punteggio invariato all\'intervallo: 1-0', liveMatch.scoreFromGoalEvents(fixture), [1, 0]);

    // ── 5. Secondo tempo: pareggio avversario al 61' ──
    console.log('\n── Fase 5: secondo tempo, gol Tau Altopascio 61\' ──');
    const secondHalfStart = new Date('2026-11-15T15:30:00.000Z').toISOString();
    fixture = { ...fixture, livePhase: 'second_half', phaseStartedAt: secondHalfStart, secondHalfElapsedSeconds: 0, liveEvents: [...fixture.liveEvents, { id: 'ev-2h', type: 'second_half', label: 'Inizio secondo tempo', phase: 'second_half', createdAt: secondHalfStart }] };
    const goal61 = { id: 'ev-goal-2', type: 'goal', label: 'Gol Tau Altopascio', phase: 'second_half', phaseElapsedSeconds: 16 * 60, team: 'Tau Calcio Altopascio', createdAt: new Date('2026-11-15T15:46:00.000Z').toISOString() };
    fixture = { ...fixture, secondHalfElapsedSeconds: 16 * 60, liveEvents: [...fixture.liveEvents, goal61] };
    const [h2, a2] = liveMatch.scoreFromGoalEvents(fixture);
    fixture = { ...fixture, homeScore: h2, awayScore: a2 };
    checkEqual('Punteggio dopo il pareggio: 1-1', [fixture.homeScore, fixture.awayScore], [1, 1]);
    checkEqual('minuteLabelFor al 61\' (16\' di secondo tempo)', liveMatch.minuteLabelFor('second_half', 16 * 60), "61'");

    // ── 6. Gol vittoria Prato all'87' (Verde) ──
    console.log('\n── Fase 6: gol vittoria AC Prato 87\' (Verde) ──');
    const goal87 = { id: 'ev-goal-3', type: 'goal', label: 'Gol! Verde', phase: 'second_half', phaseElapsedSeconds: 42 * 60, team: 'AC Prato', playerId: 'verde', createdAt: new Date('2026-11-15T16:12:00.000Z').toISOString() };
    fixture = { ...fixture, secondHalfElapsedSeconds: 42 * 60, liveEvents: [...fixture.liveEvents, goal87] };
    const [h3, a3] = liveMatch.scoreFromGoalEvents(fixture);
    fixture = { ...fixture, homeScore: h3, awayScore: a3 };
    checkEqual('Punteggio dopo il gol vittoria: 2-1', [fixture.homeScore, fixture.awayScore], [2, 1]);
    checkEqual('minuteLabelFor all\'87\'', liveMatch.minuteLabelFor('second_half', 42 * 60), "87'");

    // ── 6b. Cambio AC Prato al 70' ──
    console.log('\n── Fase 6b: cambio AC Prato al 70\' ──');
    const subEvent = { id: 'ev-sub-1', type: 'substitution', label: 'Cambio: esce Verde, entra Marzierli', phase: 'second_half', phaseElapsedSeconds: 25 * 60, team: 'AC Prato', playerOutId: 'verde', playerInId: 'marzierli', createdAt: new Date('2026-11-15T15:55:00.000Z').toISOString() };
    fixture = { ...fixture, liveEvents: [...fixture.liveEvents, subEvent] };
    checkEqual('Il cambio non altera il punteggio (resta 2-1)', liveMatch.scoreFromGoalEvents(fixture), [2, 1]);
    check('Evento cambio con playerOutId/playerInId corretti', fixture.liveEvents.find((e) => e.id === 'ev-sub-1').playerOutId === 'verde' && fixture.liveEvents.find((e) => e.id === 'ev-sub-1').playerInId === 'marzierli');

    // ── 6c. Cartellino giallo avversario al 75' ──
    console.log('\n── Fase 6c: cartellino giallo avversario al 75\' ──');
    const yellowEvent = { id: 'ev-yellow-1', type: 'yellow_card', label: 'Cartellino giallo: Difensore Tau', phase: 'second_half', phaseElapsedSeconds: 30 * 60, team: 'Tau Calcio Altopascio', scorer: 'Difensore Tau', createdAt: new Date('2026-11-15T16:00:00.000Z').toISOString() };
    fixture = { ...fixture, liveEvents: [...fixture.liveEvents, yellowEvent] };
    check('Cartellino giallo registrato con la squadra corretta', fixture.liveEvents.find((e) => e.id === 'ev-yellow-1').team === 'Tau Calcio Altopascio');

    // ── 6d. Cartellino rosso AC Prato all'80' ──
    console.log('\n── Fase 6d: cartellino rosso AC Prato all\'80\' ──');
    const redEvent = { id: 'ev-red-1', type: 'red_card', label: 'Cartellino rosso: Caon', phase: 'second_half', phaseElapsedSeconds: 35 * 60, team: 'AC Prato', playerId: 'caon', createdAt: new Date('2026-11-15T16:05:00.000Z').toISOString() };
    fixture = { ...fixture, liveEvents: [...fixture.liveEvents, redEvent] };
    check('Cartellino rosso registrato con il giocatore corretto', fixture.liveEvents.find((e) => e.id === 'ev-red-1').playerId === 'caon');
    checkEqual('Punteggio invariato dopo cambio+cartellini: 2-1', liveMatch.scoreFromGoalEvents(fixture), [2, 1]);

    // ordine cronologico eventi (kickoff, 23', ht, 2h-start, 61', sub 70', giallo 75', rosso 80', 87')
    const sorted = liveMatch.sortLiveEvents(fixture.liveEvents);
    checkEqual('Cambio e cartellini nell\'ordine cronologico corretto', sorted.map((e) => e.id), ['ev-kickoff', 'ev-goal-1', 'ev-ht', 'ev-2h', 'ev-goal-2', 'ev-sub-1', 'ev-yellow-1', 'ev-red-1', 'ev-goal-3']);

    // ── 6e. Correzione/eliminazione eventi mentre la partita è ANCORA IN CORSO (non finale) ──
    console.log('\n── Fase 6e: modifica ed eliminazione eventi a partita ancora in corso ──');
    check('La partita non è ancora finale in questa fase', fixture.status !== 'final');
    const liveCorrected = liveMatch.updateEventMinute(fixture, 'ev-yellow-1', 'second_half', 32 * 60);
    checkEqual('Il minuto del cartellino giallo si corregge anche live (77\')', liveCorrected.liveEvents.find((e) => e.id === 'ev-yellow-1').minuteLabel, "77'");
    const liveWithoutSub = liveMatch.removeEvent(fixture, 'ev-sub-1');
    checkEqual('Il cambio si può eliminare anche live (partita non ancora finale)', liveWithoutSub.liveEvents.some((e) => e.id === 'ev-sub-1'), false);
    checkEqual('Il punteggio resta invariato eliminando un cambio live: 2-1', [liveWithoutSub.homeScore, liveWithoutSub.awayScore], [2, 1]);

    // ── 7. Triplice fischio: la partita diventa finale ──
    console.log('\n── Fase 7: triplice fischio ──');
    fixture = {
      ...fixture,
      homeLineup: { formation: '4-3-3', starters: [{ playerId: 'caon', starter: true }, { playerId: 'verde', starter: true }], substitutes: [{ playerId: 'marzierli', starter: false }] },
      status: 'final',
      livePhase: 'finished',
      liveEvents: [...fixture.liveEvents, { id: 'ev-ft', type: 'fulltime', label: 'Triplice fischio', phase: 'finished', createdAt: new Date('2026-11-15T16:20:00.000Z').toISOString() }],
    };
    content = matchSync.synchronizeFixture(content, fixture);
    fixture = content.fixtures[0];
    checkEqual('formatMatchClock a fine partita', liveMatch.formatMatchClock(fixture), 'Finale');
    check('Fixture status: final', fixture.status === 'final');

    const finalMatch = content.schedule.find((m) => m.id === 'sched-1');
    check('Il calendario riceve il risultato finale (2-1)', finalMatch.homeScore === 2 && finalMatch.awayScore === 1 && finalMatch.status === 'final');
    const finalGroupMatch = content.groupMatches.find((m) => m.id === 'sched-1');
    check('Anche il girone riceve lo stesso risultato finale', finalGroupMatch.homeScore === 2 && finalGroupMatch.awayScore === 1);
    check('Il tabellino (eventi) finisce nel calendario a fine partita', Array.isArray(finalMatch.liveEvents) && finalMatch.liveEvents.length === fixture.liveEvents.length);
    check('La formazione del Prato finisce nel calendario a fine partita', finalMatch.homeLineup?.formation === '4-3-3' && finalMatch.homeLineup?.starters.length === 2);
    check('Tabellino e formazione finiscono anche nel girone', Array.isArray(finalGroupMatch.liveEvents) && finalGroupMatch.homeLineup?.formation === '4-3-3');

    // ── 8. Statistiche giocatori aggiornate dai gol Live ──
    console.log('\n── Fase 8: statistiche giocatori ──');
    const caon = content.players.find((p) => p.id === 'caon');
    const verde = content.players.find((p) => p.id === 'verde');
    checkEqual('Caon: +1 gol dal live (da 5 a 6)', caon.goals, 6);
    checkEqual('Verde: +1 gol dal live (da 3 a 4)', verde.goals, 4);
    checkEqual('Caon: liveGoals tracciati correttamente', caon.liveGoals, 1);
    checkEqual('Verde: liveGoals tracciati correttamente', verde.liveGoals, 1);

    // ── 9. Classifica ricalcolata con il nuovo risultato ──
    console.log('\n── Fase 9: classifica ricalcolata ──');
    const sets = standings.calculateStandingSets(content.groupMatches, ['AC Prato', 'Tau Calcio Altopascio']);
    const pratoRow = sets.overall.find((r) => r.club === 'AC Prato');
    const tauRow = sets.overall.find((r) => r.club === 'Tau Calcio Altopascio');
    checkEqual('AC Prato: 3 punti per la vittoria 2-1', pratoRow.points, 3);
    checkEqual('Tau Altopascio: 0 punti per la sconfitta', tauRow.points, 0);
    checkEqual('AC Prato: 1 partita giocata', pratoRow.played, 1);

    // ── 10. Riesecuzione idempotente: sincronizzare di nuovo la stessa fixture finale non deve cambiare nulla ──
    console.log('\n── Fase 10: idempotenza (nessuna duplicazione a doppia sincronizzazione) ──');
    const contentAgain = matchSync.synchronizeFixture(content, fixture);
    checkEqual('Nessuna nuova fixture creata', contentAgain.fixtures.length, 1);
    checkEqual('Nessuna nuova partita creata nel calendario', contentAgain.schedule.length, 1);
    checkEqual('Il risultato resta 2-1 anche dopo una seconda sincronizzazione', [contentAgain.schedule[0].homeScore, contentAgain.schedule[0].awayScore], [2, 1]);

    // ── 11. Modalità post-partita: correggere il minuto di un evento ──
    console.log('\n── Fase 11: modalità post-partita, correzione minuto ──');
    // Il gol del pareggio (ev-goal-2) era registrato al 61'; lo si corregge al 63'.
    const corrected = liveMatch.updateEventMinute(fixture, 'ev-goal-2', 'second_half', 18 * 60);
    const correctedGoal = corrected.liveEvents.find((e) => e.id === 'ev-goal-2');
    checkEqual('Il minuto del gol viene corretto a 63\'', correctedGoal.minuteLabel, "63'");
    checkEqual('Il punteggio finale resta 2-1 dopo la correzione (solo il minuto cambia)', [corrected.homeScore, corrected.awayScore], [2, 1]);
    const correctedSortedIds = liveMatch.sortLiveEvents(corrected.liveEvents).map((e) => e.id);
    checkEqual('Gli eventi restano ordinati correttamente dopo la correzione', correctedSortedIds, ['ev-kickoff', 'ev-goal-1', 'ev-ht', 'ev-2h', 'ev-goal-2', 'ev-sub-1', 'ev-yellow-1', 'ev-red-1', 'ev-goal-3', 'ev-ft']);

    // ── 12. Modalità post-partita: eliminare un evento qualunque (non solo un gol) ──
    console.log('\n── Fase 12: modalità post-partita, eliminazione di un cartellino ──');
    const withoutYellow = liveMatch.removeEvent(fixture, 'ev-yellow-1');
    checkEqual('Il cartellino giallo viene rimosso dalla cronologia', withoutYellow.liveEvents.some((e) => e.id === 'ev-yellow-1'), false);
    checkEqual('Il punteggio resta 2-1 (un cartellino non lo modifica)', [withoutYellow.homeScore, withoutYellow.awayScore], [2, 1]);
    checkEqual('Il cambio e il cartellino rosso restano presenti', withoutYellow.liveEvents.some((e) => e.id === 'ev-sub-1') && withoutYellow.liveEvents.some((e) => e.id === 'ev-red-1'), true);

    // Eliminare un GOL in modalità post-partita deve ricalcolare il punteggio
    const withoutSecondGoal = liveMatch.removeEvent(fixture, 'ev-goal-2');
    checkEqual('Eliminando il gol del pareggio il punteggio torna 2-0', [withoutSecondGoal.homeScore, withoutSecondGoal.awayScore], [2, 0]);

    console.log(`\n📊 ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
    console.log('✅ Simulazione partita Live completa: TUTTO FUNZIONANTE dall\'inizio alla fine.');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main();
