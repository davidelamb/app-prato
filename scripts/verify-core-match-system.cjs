#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('node:assert');
const { execFileSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');

// ── Tiny test runner ──
let passed = 0;
let failed = 0;

function test(label, fn) {
  try {
    fn();
    passed += 1;
  } catch (err) {
    failed += 1;
    console.error(`  ❌ ${label}`);
    console.error('     ' + (err.message || err).split('\n').join('\n     '));
  }
}

function assertEqual(actual, expected, label) {
  test(label, () => assert.strictEqual(actual, expected));
}

function assertOk(value, label) {
  test(label, () => assert.ok(value));
}

// ── Fixed reference point ──
const NOW = new Date('2026-08-01T15:00:00.000Z').getTime();

function main() {
  // ── Locate TypeScript compiler (lib/tsc.js, not .cmd wrapper) ──
  const tscLib = path.resolve(projectRoot, 'node_modules', 'typescript', 'lib', 'tsc.js');
  if (!fs.existsSync(tscLib)) {
    console.error('❌ TypeScript lib/tsc.js not found at ' + tscLib);
    // fallback: try npx
    if (fs.existsSync(path.resolve(projectRoot, 'node_modules', '.bin', 'tsc.cmd'))) {
      console.error('   Found .bin/tsc.cmd but cannot exec it directly from node.exe.');
    }
    process.exit(1);
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-core-'));

  try {
    // ── Compile needed TypeScript modules ──
    const srcFiles = [
      'src/types.ts',
      'src/utils/team-names.ts',
      'src/utils/standings.ts',
      'src/utils/live-match.ts',
      'src/utils/match-sync.ts',
    ].map((f) => path.join(projectRoot, f));

    execFileSync(
      process.execPath,
      [
        tscLib,
        '--outDir', tmpDir,
        '--module', 'commonjs',
        '--target', 'es2020',
        '--strict', '--esModuleInterop', '--skipLibCheck',
        '--moduleResolution', 'node',
        ...srcFiles,
      ],
      { cwd: projectRoot, stdio: 'pipe' },
    );

    // ── Load compiled modules ──
    const teamNames = require(path.join(tmpDir, 'utils', 'team-names.js'));
    const standings = require(path.join(tmpDir, 'utils', 'standings.js'));
    const liveMatch = require(path.join(tmpDir, 'utils', 'live-match.js'));
    const matchSync = require(path.join(tmpDir, 'utils', 'match-sync.js'));

    // ══════════════════════════════════════════
    //  1. ALIAS: AC Prato / A.C. Prato / Prato
    // ══════════════════════════════════════════

    console.log('\n── 1. Alias AC Prato ──');

    assertEqual(teamNames.canonicalTeamName('AC Prato'), 'AC Prato', 'canonical AC Prato');
    assertEqual(teamNames.canonicalTeamName('A.C. Prato'), 'AC Prato', 'canonical A.C. Prato');
    assertEqual(teamNames.canonicalTeamName('Prato Calcio'), 'AC Prato', 'canonical Prato Calcio');
    assertEqual(teamNames.canonicalTeamName('Prato'), 'AC Prato', 'canonical Prato');

    assertEqual(teamNames.teamNamesEqual('AC Prato', 'A.C. Prato'), true, 'equal AC / A.C.');
    assertEqual(teamNames.teamNamesEqual('AC Prato', 'Prato Calcio'), true, 'equal / Prato Calcio');
    assertEqual(teamNames.teamNamesEqual('  a.c.  prato  ', 'AC Prato'), true, 'equal spacing/lower');

    assertEqual(teamNames.isPratoTeam('A.C. Prato'), true, 'isPrato A.C.');
    assertEqual(teamNames.isPratoTeam('Prato Calcio'), true, 'isPrato Prato Calcio');

    // Non-collision
    assertEqual(teamNames.teamNamesEqual('AC Prato', 'Prato Doc'), false, '!= Prato Doc');
    assertEqual(teamNames.isPratoTeam('US Città di Pontedera'), false, 'isPrato false');
    assertEqual(teamNames.canonicalTeamName('FC Prato'), 'AC Prato', 'FC Prato → AC Prato');
    assertEqual(teamNames.canonicalTeamName('Prato Doc'), 'Prato Doc', 'Prato Doc stays');

    // ══════════════════════════════════════════
    //  2. CLASSIFICA 2–1
    // ══════════════════════════════════════════

    console.log('── 2. Classifica 2–1 ──');

    const clubs = ['AC Prato', 'FC Pontedera'];
    const match2_1 = {
      id: 'm1', home: 'AC Prato', away: 'FC Pontedera',
      homeScore: 2, awayScore: 1, status: 'final',
      competition: 'Campionato', dateLabel: '2026-01-01', time: '15:00',
    };

    const sets = standings.calculateStandingSets([match2_1], clubs);

    assertEqual(sets.overall.length, 2, '2 rows overall');
    const prato2 = sets.overall.find((r) => teamNames.teamNamesEqual(r.club, 'AC Prato'));
    const pont2 = sets.overall.find((r) => teamNames.teamNamesEqual(r.club, 'FC Pontedera'));
    assertOk(prato2, 'Prato in overall');
    assertOk(pont2, 'Pontedera in overall');

    assertEqual(prato2.played, 1, 'prato played');
    assertEqual(prato2.wins, 1, 'prato wins');
    assertEqual(prato2.draws, 0, 'prato draws');
    assertEqual(prato2.losses, 0, 'prato losses');
    assertEqual(prato2.goalsFor, 2, 'prato GF');
    assertEqual(prato2.goalsAgainst, 1, 'prato GA');
    assertEqual(prato2.goalDifference, 1, 'prato GD');
    assertEqual(prato2.points, 3, 'prato points');

    assertEqual(pont2.played, 1, 'pont played');
    assertEqual(pont2.wins, 0, 'pont wins');
    assertEqual(pont2.draws, 0, 'pont draws');
    assertEqual(pont2.losses, 1, 'pont losses');
    assertEqual(pont2.goalsFor, 1, 'pont GF');
    assertEqual(pont2.goalsAgainst, 2, 'pont GA');
    assertEqual(pont2.goalDifference, -1, 'pont GD');
    assertEqual(pont2.points, 0, 'pont points');

    // Home / Away breakdown
    const pratoH = sets.home.find((r) => teamNames.teamNamesEqual(r.club, 'AC Prato'));
    const pontH = sets.home.find((r) => teamNames.teamNamesEqual(r.club, 'FC Pontedera'));
    assertOk(pratoH, 'Prato home');
    assertEqual(pratoH.played, 1, 'prato home played');
    assertEqual(pratoH.wins, 1, 'prato home wins');
    assertEqual(pratoH.points, 3, 'prato home points');
    assertEqual(pontH.played, 0, 'pont home played');

    const pontA = sets.away.find((r) => teamNames.teamNamesEqual(r.club, 'FC Pontedera'));
    const pratoA = sets.away.find((r) => teamNames.teamNamesEqual(r.club, 'AC Prato'));
    assertOk(pontA, 'Pont away');
    assertEqual(pontA.played, 1, 'pont away played');
    assertEqual(pontA.losses, 1, 'pont away losses');
    assertEqual(pontA.points, 0, 'pont away points');
    assertEqual(pratoA.played, 0, 'prato away played');

    // ══════════════════════════════════════════
    //  3. MODIFICA 1–1
    // ══════════════════════════════════════════

    console.log('── 3. Modifica 1–1 ──');

    const match1_1 = { ...match2_1, homeScore: 1, awayScore: 1 };
    const setsMod = standings.calculateStandingSets([match1_1], clubs);
    const pratoM = setsMod.overall.find((r) => teamNames.teamNamesEqual(r.club, 'AC Prato'));
    const pontM = setsMod.overall.find((r) => teamNames.teamNamesEqual(r.club, 'FC Pontedera'));
    assertOk(pratoM, 'prato mod');
    assertOk(pontM, 'pont mod');

    assertEqual(pratoM.played, 1, 'mod prato played');
    assertEqual(pratoM.draws, 1, 'mod prato draws');
    assertEqual(pratoM.points, 1, 'mod prato points');
    assertEqual(pratoM.goalsFor, 1, 'mod prato GF');
    assertEqual(pratoM.goalsAgainst, 1, 'mod prato GA');
    assertEqual(pontM.played, 1, 'mod pont played');
    assertEqual(pontM.draws, 1, 'mod pont draws');
    assertEqual(pontM.points, 1, 'mod pont points');
    assertEqual(pontM.goalsFor, 1, 'mod pont GF');
    assertEqual(pontM.goalsAgainst, 1, 'mod pont GA');

    // ══════════════════════════════════════════
    //  4. SCORE UNDEFINED escluso
    // ══════════════════════════════════════════

    console.log('── 4. Score undefined escluso ──');

    const matchNoScore = { ...match2_1, id: 'm2', homeScore: undefined, awayScore: undefined, status: 'scheduled' };
    const setsEmpty = standings.calculateStandingSets([matchNoScore], clubs);
    const pratoE = setsEmpty.overall.find((r) => teamNames.teamNamesEqual(r.club, 'AC Prato'));
    assertOk(pratoE, 'prato in empty');
    assertEqual(pratoE.played, 0, 'no score played');
    assertEqual(pratoE.points, 0, 'no score points');

    // ══════════════════════════════════════════
    //  5. minuteLabelFor
    // ══════════════════════════════════════════

    console.log('── 5. minuteLabelFor ──');

    assertEqual(liveMatch.minuteLabelFor('first_half', 45 * 60 + 20), "45+1'", 'first_half 45:20');
    assertEqual(liveMatch.minuteLabelFor('first_half', 46 * 60 + 10), "45+1'", 'first_half 46:10');
    assertEqual(liveMatch.minuteLabelFor('second_half', 45 * 60 + 20), "90+1'", 'second_half 90:20');

    // ══════════════════════════════════════════
    //  6. formatMatchClock – secondo tempo
    // ══════════════════════════════════════════

    console.log('── 6. formatMatchClock secondo tempo ──');

    const fixture2H = {
      id: 'f1', competition: 'Campionato', matchday: '1',
      dateLabel: '2026-01-01', time: '15:00',
      home: 'AC Prato', away: 'FC Pontedera', status: 'live',
      venue: 'Stadio', livePhase: 'second_half',
      phaseStartedAt: new Date(NOW).toISOString(),
      firstHalfElapsedSeconds: 47 * 60 + 18, // first half lasted 47:18 including stoppage
      secondHalfElapsedSeconds: 0,
    };

    assertEqual(liveMatch.formatMatchClock(fixture2H, NOW), '45:00', '2nd half starts 45:00');

    // ══════════════════════════════════════════
    //  7. Invalidi: negativi, decimali, live/Coppa
    // ══════════════════════════════════════════

    console.log('── 7. Invalidi/dec/live/Coppa ──');

    const invalidMatches = [
      { ...match2_1, id: 'neg', homeScore: -1, awayScore: 0 },
      { ...match2_1, id: 'dec', homeScore: 1.5, awayScore: 1 },
      { ...match2_1, id: 'live', status: 'live' },
      { ...match2_1, id: 'coppa', competition: 'Coppa Italia' },
    ];
    const setsInv = standings.calculateStandingSets(invalidMatches, clubs);
    const pratoInv = setsInv.overall.find((r) => teamNames.teamNamesEqual(r.club, 'AC Prato'));
    assertOk(pratoInv, 'prato in inv');
    assertEqual(pratoInv.played, 0, 'invalids not counted');
    assertEqual(pratoInv.goalsFor, 0, 'Coppa not counted');

    // ══════════════════════════════════════════
    //  8. Penalità negativa
    // ══════════════════════════════════════════

    console.log('── 8. Penalità negativa ──');

    const penalties = new Map([['prato', -2]]);
    const setsPen = standings.calculateStandingSets([match2_1], clubs, penalties);
    const pratoPen = setsPen.overall.find((r) => teamNames.teamNamesEqual(r.club, 'AC Prato'));
    assertOk(pratoPen, 'prato pen');
    assertEqual(pratoPen.points, 3, 'raw points unchanged');
    assertEqual(pratoPen.penalty, -2, 'penalty stored');

    // ══════════════════════════════════════════
    //  9. Forma ultime 5 in ordine
    // ══════════════════════════════════════════

    console.log('── 9. Forma ultime 5 ──');

    // Last 5 of 6 sorted matches should be: W W W W L
    const formMatches = [];
    for (let i = 0; i < 6; i++) {
      const isWin = i < 5;
      formMatches.push({
        ...match2_1,
        id: 'form' + i,
        matchday: i + 1,
        home: isWin ? 'AC Prato' : 'FC Pontedera',
        away: isWin ? 'FC Pontedera' : 'AC Prato',
        // For match 5 (i=5, not win): Prato is away, must lose → Pontedera 1-0 Prato
        homeScore: isWin ? 1 : 1,
        awayScore: isWin ? 0 : 0,
      });
    }
    const setsForm = standings.calculateStandingSets(formMatches, clubs);
    const pratoForm = setsForm.form.find((r) => teamNames.teamNamesEqual(r.club, 'AC Prato'));
    assertOk(pratoForm, 'prato form');
    assertEqual(pratoForm.form.length, 5, '5 form entries');
    assertEqual(pratoForm.form.join(''), 'WWWWL', 'form order: WWWWL');

    // ══════════════════════════════════════════
    //  10. sameMatch
    // ══════════════════════════════════════════

    console.log('── 10. sameMatch ──');

    // Linked via ID
    assertEqual(
      matchSync.sameMatch({ id: 'a', home: 'AC Prato', away: 'FC Pontedera', fixtureId: 'x' },
        { id: 'x', home: 'AC Prato', away: 'FC Pontedera' }),
      true, 'linked via fixtureId',
    );
    assertEqual(
      matchSync.sameMatch({ id: 'a', home: 'AC Prato', away: 'FC Pontedera', scheduleMatchId: 's' },
        { id: 's', home: 'AC Prato', away: 'FC Pontedera' }),
      true, 'linked via scheduleMatchId',
    );
    assertEqual(
      matchSync.sameMatch({ id: 'a', home: 'AC Prato', away: 'FC Pontedera', groupMatchId: 'g' },
        { id: 'g', home: 'AC Prato', away: 'FC Pontedera' }),
      true, 'linked via groupMatchId',
    );

    // Normalised names + matchday
    assertEqual(
      matchSync.sameMatch({ id: 'a', home: 'AC Prato', away: 'FC Pontedera', matchday: '1', dateLabel: '2026-01-01' },
        { id: 'b', home: '  A.C.  Prato  ', away: 'Pontedera', matchday: '1', dateLabel: '2026-02-01' }),
      true, 'same names+matchday',
    );

    // Compatible date (no matchday)
    assertEqual(
      matchSync.sameMatch({ id: 'a', home: 'AC Prato', away: 'FC Pontedera', dateLabel: '2026-01-01' },
        { id: 'b', home: 'AC Prato', away: 'FC Pontedera', dateLabel: '2026-01-01' }),
      true, 'same names+date',
    );

    // Negative case
    assertEqual(
      matchSync.sameMatch({ id: 'a', home: 'AC Prato', away: 'FC Pontedera', matchday: '1' },
        { id: 'b', home: 'AC Prato', away: 'Siena FC', matchday: '1' }),
      false, 'different away team',
    );

    // ══════════════════════════════════════════
    //  11. synchronizeGroupMatches
    // ══════════════════════════════════════════

    console.log('── 11. synchronizeGroupMatches ──');

    const baseMatch = { id: 'gm1', home: 'AC Prato', away: 'FC Pontedera', matchday: '1', dateLabel: '2026-01-01', time: '15:00', competition: 'Campionato' };
    const baseContent = {
      schedule: [{ ...baseMatch, id: 'sch1' }],
      groupMatches: [{ ...baseMatch, id: 'gm1', homeScore: 2, awayScore: 1, status: 'final' }],
      fixtures: [{ ...baseMatch, id: 'fx1', venue: 'Stadio', status: 'final', homeScore: 2, awayScore: 1, livePhase: 'finished' }],
      standings: [
        { rank: 1, club: 'AC Prato', played: 1, wins: 1, draws: 0, losses: 0, goalsFor: 2, goalsAgainst: 1, goalDifference: 1, points: 3, penalty: 0, form: [] },
        { rank: 2, club: 'FC Pontedera', played: 1, wins: 0, draws: 0, losses: 1, goalsFor: 1, goalsAgainst: 2, goalDifference: -1, points: 0, penalty: 0, form: [] },
      ],
      homeStandings: [], awayStandings: [], formStandings: [],
      players: [], newsItems: [], mediaItems: [], events: [],
    };

    const updatedGroups = [{ ...baseMatch, id: 'gm1', homeScore: 1, awayScore: 1, status: 'final' }];
    const synced = matchSync.synchronizeGroupMatches(baseContent, updatedGroups);

    const sch = synced.schedule.find((m) => m.id === 'sch1');
    assertOk(sch, 'sch updated');
    assertEqual(sch.homeScore, 1, 'schedule score synced');
    assertEqual(sch.awayScore, 1, 'schedule away synced');

    const fx = synced.fixtures.find((m) => m.id === 'fx1');
    assertOk(fx, 'fx updated');
    assertEqual(fx.homeScore, 1, 'fixture score synced');

    const gmIds = synced.groupMatches.map((m) => m.id);
    assertEqual(new Set(gmIds).size, gmIds.length, 'no duplicate groupMatches');

    const st = synced.standings.find((r) => teamNames.teamNamesEqual(r.club, 'AC Prato'));
    assertOk(st, 'standings recalc');
    assertEqual(st.points, 1, 'recalculated to draw');

    // ══════════════════════════════════════════
    //  12. synchronizeFixture finale
    // ══════════════════════════════════════════

    console.log('── 12. synchronizeFixture ──');

    const baseFixtureContent = {
      schedule: [{ ...baseMatch, id: 'sch2' }],
      groupMatches: [{ ...baseMatch, id: 'gm2' }],
      fixtures: [{
        ...baseMatch, id: 'fx2', venue: 'Stadio', status: 'scheduled',
        livePhase: 'scheduled', liveEvents: [],
      }],
      standings: [
        { rank: 1, club: 'AC Prato', played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, penalty: 0, form: [] },
        { rank: 2, club: 'FC Pontedera', played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, penalty: 0, form: [] },
      ],
      homeStandings: [], awayStandings: [], formStandings: [],
      players: [
        { id: 'p1', name: 'P1', number: 10, role: 'Attaccante', goals: 5, liveGoals: 0 },
        { id: 'p2', name: 'P2', number: 9, role: 'Attaccante', goals: 3, liveGoals: 0 },
      ],
      newsItems: [], mediaItems: [], events: [],
    };

    const finalFixture = {
      ...baseFixtureContent.fixtures[0],
      status: 'final', homeScore: 2, awayScore: 1,
      livePhase: 'finished',
      liveEvents: [
        { id: 'e1', type: 'goal', team: 'AC Prato', playerId: 'p1', minute: 30, phase: 'first_half', phaseElapsedSeconds: 1800 },
        { id: 'e2', type: 'goal', team: 'FC Pontedera', playerId: undefined, minute: 40, phase: 'first_half', phaseElapsedSeconds: 2400 },
        { id: 'e3', type: 'goal', team: 'AC Prato', playerId: 'p1', minute: 33, phase: 'second_half', phaseElapsedSeconds: 1980 },
      ],
    };

    const synced1 = matchSync.synchronizeFixture(baseFixtureContent, finalFixture);

    const sch_synced = synced1.schedule.find((m) => m.id === 'sch2');
    assertOk(sch_synced, 'sch2 found');
    assertEqual(sch_synced.homeScore, 2, 'fixture→schedule score');

    const gm_synced = synced1.groupMatches.find((m) => m.id === 'gm2');
    assertOk(gm_synced, 'gm2 found');
    assertEqual(gm_synced.homeScore, 2, 'fixture→groupMatch score');

    // Player gol added once
    const p1_1 = synced1.players.find((p) => p.id === 'p1');
    assertOk(p1_1, 'p1 found');
    assertEqual(p1_1.goals, 7, 'p1 goals updated (5+2)');
    assertEqual(p1_1.liveGoals, 2, 'p1 liveGoals = 2');

    const p2_1 = synced1.players.find((p) => p.id === 'p2');
    assertEqual(p2_1.goals, 3, 'p2 goals unchanged');
    assertEqual(p2_1.liveGoals, 0, 'p2 liveGoals unchanged');

    // Idempotency: same fixture applied again
    const synced2 = matchSync.synchronizeFixture(synced1, finalFixture);
    const p1_2 = synced2.players.find((p) => p.id === 'p1');
    assertOk(p1_2, 'p1 idemp');
    assertEqual(p1_2.goals, 7, 'p1 goals idempotent');
    assertEqual(p1_2.liveGoals, 2, 'p1 liveGoals idempotent');

    // Remove one goal → total 1
    const finalFixtureOneGoal = {
      ...finalFixture,
      liveEvents: [
        { id: 'e1', type: 'goal', team: 'AC Prato', playerId: 'p1', minute: 30, phase: 'first_half', phaseElapsedSeconds: 1800 },
        { id: 'e2', type: 'goal', team: 'FC Pontedera', playerId: undefined, minute: 40, phase: 'first_half', phaseElapsedSeconds: 2400 },
      ],
    };
    const synced3 = matchSync.synchronizeFixture(baseFixtureContent, finalFixtureOneGoal);
    const p1_3 = synced3.players.find((p) => p.id === 'p1');
    assertOk(p1_3, 'p1 after remove');
    assertEqual(p1_3.goals, 6, 'p1 goals back to 5+1');
    assertEqual(p1_3.liveGoals, 1, 'p1 liveGoals = 1');

    // ══════════════════════════════════════════
    //  13. scoreFromGoalEvents
    // ══════════════════════════════════════════

    console.log('── 13. scoreFromGoalEvents ──');

    const fixtureGoals = {
      home: 'AC Prato', away: 'FC Pontedera',
      liveEvents: [
        { id: 'g1', type: 'goal', team: 'AC Prato', minute: 10, phase: 'first_half', phaseElapsedSeconds: 600 },
        { id: 'g2', type: 'goal', team: 'FC Pontedera', minute: 20, phase: 'first_half', phaseElapsedSeconds: 1200 },
        { id: 'g3', type: 'goal', team: 'AC Prato', minute: 30, phase: 'second_half', phaseElapsedSeconds: 1800 },
      ],
    };
    const [homeS, awayS] = liveMatch.scoreFromGoalEvents(fixtureGoals);
    assertEqual(homeS, 2, 'home goals from events');
    assertEqual(awayS, 1, 'away goals from events');

    // ══════════════════════════════════════════
    //  14. sortLiveEvents
    // ══════════════════════════════════════════

    console.log('── 14. sortLiveEvents ──');

    const unsorted = [
      { id: 'e1', type: 'goal', team: 'AC Prato', minute: 20, phase: 'second_half', phaseElapsedSeconds: 1200 },
      { id: 'e2', type: 'goal', team: 'AC Prato', minute: 15, phase: 'first_half', phaseElapsedSeconds: 900 },
      { id: 'e3', type: 'goal', team: 'AC Prato', minute: 10, phase: 'first_half', phaseElapsedSeconds: 600 },
      { id: 'e4', type: 'goal', team: 'AC Prato', minute: 5, phase: 'halftime', phaseElapsedSeconds: 0 },
    ];
    const sorted = liveMatch.sortLiveEvents(unsorted);
    assertEqual(sorted[0].id, 'e3', '1st half first');
    assertEqual(sorted[1].id, 'e2', '1st half second');
    assertEqual(sorted[2].id, 'e4', 'halftime');
    assertEqual(sorted[3].id, 'e1', '2nd half last');

    // ══════════════════════════════════════════
    //  15. inferLegacyEventPhase
    // ══════════════════════════════════════════

    console.log('── 15. inferLegacyEventPhase ──');

    // Array inverso: [goal54, second_half46, goal18, kickoff1]
    // dovrebbe produrre: second_half, second_half, first_half, first_half
    const reversedEvents = [
      { id: 'e4', type: 'goal', team: 'AC Prato', minute: 54 },
      { id: 'e3', type: 'second_half', minute: 46 },
      { id: 'e2', type: 'goal', team: 'AC Prato', minute: 18 },
      { id: 'e1', type: 'kickoff', minute: 1 },
    ];

    assertEqual(liveMatch.inferLegacyEventPhase(reversedEvents[0], reversedEvents), 'second_half', 'goal54 → second_half');
    assertEqual(liveMatch.inferLegacyEventPhase(reversedEvents[1], reversedEvents), 'second_half', 'second_half46 → second_half');
    assertEqual(liveMatch.inferLegacyEventPhase(reversedEvents[2], reversedEvents), 'first_half', 'goal18 → first_half');
    assertEqual(liveMatch.inferLegacyEventPhase(reversedEvents[3], reversedEvents), 'first_half', 'kickoff1 → first_half');

    // Regola createdAt: goal 47 con createdAt < marker second_half → first_half
    const earlierEvents = [
      { id: 'e1', type: 'kickoff', minute: 1, createdAt: '2026-01-01T19:00:00.000Z' },
      { id: 'e2', type: 'goal', team: 'AC Prato', minute: 47, createdAt: '2026-01-01T19:45:00.000Z' },
      { id: 'e3', type: 'second_half', minute: 46, createdAt: '2026-01-01T19:46:00.000Z' },
    ];

    assertEqual(liveMatch.inferLegacyEventPhase(earlierEvents[1], earlierEvents), 'first_half', 'goal47 createdAt before marker → first_half');

    // 15a. Senza marker: fallback conservativo per minuto
    const noMarkerEvents = [
      { id: 'e1', type: 'goal', minute: 30 },
      { id: 'e2', type: 'goal', minute: 50 },
    ];
    assertEqual(liveMatch.inferLegacyEventPhase(noMarkerEvents[0], noMarkerEvents), 'first_half', 'goal30 no marker → first_half');
    assertEqual(liveMatch.inferLegacyEventPhase(noMarkerEvents[1], noMarkerEvents), 'second_half', 'goal50 no marker → second_half');

    // ══════════════════════════════════════════
    //  16. removeGoal – score ricalcolo eventi
    // ══════════════════════════════════════════

    console.log('── 16. removeGoal score ricalcolo ──');

    // kickoff 0-0, goal casa 1-0, goal ospite 1-1, halftime 1-1
    // Eliminando il goal casa → fixture 0-1, goal ospite 0-1, halftime 0-1
    const removeGoalFixture = {
      id: 'rg1',
      home: 'AC Prato',
      away: 'FC Pontedera',
      liveEvents: [
        { id: 'ko', type: 'kickoff', score: '0-0', minute: 1, phase: 'first_half', phaseElapsedSeconds: 0, createdAt: '2026-01-01T15:00:00.000Z', label: 'Calcio d\'inizio' },
        { id: 'g1', type: 'goal', team: 'AC Prato', score: '1-0', minute: 30, phase: 'first_half', phaseElapsedSeconds: 1800, createdAt: '2026-01-01T15:30:00.000Z', label: 'Gol Prato' },
        { id: 'g2', type: 'goal', team: 'FC Pontedera', score: '1-1', minute: 40, phase: 'first_half', phaseElapsedSeconds: 2400, createdAt: '2026-01-01T15:40:00.000Z', label: 'Gol Pontedera' },
        { id: 'ht', type: 'halftime', score: '1-1', minute: 45, phase: 'halftime', phaseElapsedSeconds: 0, createdAt: '2026-01-01T15:45:00.000Z', label: 'Intervallo' },
      ],
    };

    const afterRemove = liveMatch.removeGoal(removeGoalFixture, 'g1');

    assertEqual(afterRemove.homeScore, 0, 'fixture homeScore 0 dopo rimozione goal casa');
    assertEqual(afterRemove.awayScore, 1, 'fixture awayScore 1 dopo rimozione goal casa');

    // Controlla eventi nell'ordine originale
    assertEqual(afterRemove.liveEvents.length, 3, '3 eventi rimasti');

    // kickoff deve restare 0-0
    const koAfter = afterRemove.liveEvents.find((e) => e.id === 'ko');
    assertOk(koAfter, 'kickoff presente');
    assertEqual(koAfter.score, '0-0', 'kickoff score 0-0');

    // goal ospite deve diventare 0-1 (non più 1-1)
    const g2After = afterRemove.liveEvents.find((e) => e.id === 'g2');
    assertOk(g2After, 'goal ospite presente');
    assertEqual(g2After.score, '0-1', 'goal ospite score 0-1');

    // halftime deve diventare 0-1
    const htAfter = afterRemove.liveEvents.find((e) => e.id === 'ht');
    assertOk(htAfter, 'halftime presente');
    assertEqual(htAfter.score, '0-1', 'halftime score 0-1');

    // Verifica immutabilità input
    const originalG1 = removeGoalFixture.liveEvents.find((e) => e.id === 'g1');
    assertOk(originalG1, 'input originale contiene ancora g1');
    assertEqual(originalG1.score, '1-0', 'input g1 immutato');

    // ══════════════════════════════════════════
    //  Summary
    // ══════════════════════════════════════════

    console.log(`\n📊 ${passed} passed, ${failed} failed`);
    if (failed > 0) {
      process.exitCode = 1;
    } else {
      console.log('✅ All core match system tests passed.');
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main();