#!/usr/bin/env node
/**
 * Genera il calendario completo del girone (18 squadre, andata e ritorno,
 * 306 partite totali) con il metodo del "cerchio" (circle method), fissando
 * AC Prato in posizione 0 e disponendo le altre 17 squadre nell'ordine degli
 * avversari già esistente in `src/data/season-2026-27.ts`, in modo che la
 * sequenza di accoppiamenti dell'AC Prato coincida esattamente con quella
 * già pubblicata (stesse giornate, stesse date, stesso casa/trasferta).
 *
 * Deterministico: nessun Date.now() o Math.random() a runtime. I punteggi
 * delle partite che non coinvolgono il Prato sono generati con un PRNG
 * seedato (mulberry32) sul nome della partita, quindi riproducibile.
 *
 * Uso: node scripts/generate-full-season.cjs > src/data/full-season-2026-27.ts
 */

const PRATO = 'AC Prato';

// Ordine esatto già presente in season-2026-27.ts / simulated-season.ts
const pratoOpponentOrder = [
  'US Città di Pontedera',
  'Tau Calcio Altopascio',
  'Siena FC',
  'SC Trestina',
  'US Follonica Gavorrano',
  'San Donato Tavarnelle',
  'Aquila Montevarchi',
  'Lucchese Calcio',
  'Terranuova Traiana',
  'Seravezza Pozzi',
  'GSD Ghiviborgo VDS',
  'FC Scandicci 1908',
  'Foligno Calcio 1928',
  'Ternana Calcio',
  'ASD Angelana 1930',
  'Rondinella Marzocco',
  'Polisportiva Pietralunghese',
];

// NB: nella cronologia esistente l'ordine reale con cui il Prato incontra
// gli avversari (giornata per giornata) e' quello di rawPratoMatches, che e'
// diverso dall'ordine "preseason" sopra. Usiamo quello reale per preservare
// esattamente gli accoppiamenti gia' pubblicati.
const pratoScheduleOrder = [
  'Polisportiva Pietralunghese',
  'FC Scandicci 1908',
  'San Donato Tavarnelle',
  'Terranuova Traiana',
  'Rondinella Marzocco',
  'Aquila Montevarchi',
  'GSD Ghiviborgo VDS',
  'US Follonica Gavorrano',
  'SC Trestina',
  'Foligno Calcio 1928',
  'US Città di Pontedera',
  'Tau Calcio Altopascio',
  'Seravezza Pozzi',
  'Siena FC',
  'ASD Angelana 1930',
  'Ternana Calcio',
  'Lucchese Calcio',
];

// dateLabel/time per giornata (1..34), presi dal dataset esistente
const roundMeta = [
  ['DOM 06 SET', '15:00'], ['DOM 13 SET', '15:00'], ['DOM 20 SET', '15:00'], ['DOM 27 SET', '15:00'],
  ['DOM 04 OTT', '15:00'], ['DOM 11 OTT', '15:00'], ['DOM 18 OTT', '15:00'], ['DOM 25 OTT', '15:00'],
  ['DOM 01 NOV', '14:30'], ['DOM 08 NOV', '14:30'], ['DOM 15 NOV', '14:30'], ['DOM 22 NOV', '14:30'],
  ['DOM 29 NOV', '14:30'], ['DOM 06 DIC', '14:30'], ['DOM 13 DIC', '14:30'], ['DOM 20 DIC', '14:30'],
  ['DOM 10 GEN', '14:30'],
  ['DOM 17 GEN', '14:30'], ['DOM 24 GEN', '14:30'], ['DOM 31 GEN', '14:30'], ['DOM 07 FEB', '14:30'],
  ['DOM 14 FEB', '14:30'], ['DOM 21 FEB', '14:30'], ['DOM 28 FEB', '14:30'], ['DOM 07 MAR', '15:00'],
  ['DOM 14 MAR', '15:00'], ['DOM 21 MAR', '15:00'], ['DOM 28 MAR', '15:00'], ['DOM 04 APR', '15:00'],
  ['DOM 11 APR', '15:00'], ['DOM 18 APR', '15:00'], ['DOM 25 APR', '15:00'], ['DOM 02 MAG', '15:00'],
  ['DOM 09 MAG', '15:00'],
];

// Stadio di casa di ogni squadra (dal dataset esistente: venue delle
// partite in cui la squadra ospitava il Prato)
const venues = {
  'AC Prato': 'Stadio Lungobisenzio',
  'Polisportiva Pietralunghese': 'Stadio Comunale Pietralunga',
  'FC Scandicci 1908': 'Stadio Turri',
  'San Donato Tavarnelle': 'Stadio Pianigiani',
  'Terranuova Traiana': 'Stadio Comunale Terranuova',
  'Rondinella Marzocco': 'Stadio Bozzi',
  'Aquila Montevarchi': 'Stadio Brilli Peri',
  'GSD Ghiviborgo VDS': 'Stadio Carraia',
  'US Follonica Gavorrano': 'Stadio Malservisi',
  'SC Trestina': 'Stadio Casini',
  'Foligno Calcio 1928': 'Stadio Blasone',
  'US Città di Pontedera': 'Stadio Mannucci',
  'Tau Calcio Altopascio': 'Stadio Comunale Altopascio',
  'Seravezza Pozzi': 'Stadio Buon Riposo',
  'Siena FC': 'Stadio Franchi Siena',
  'ASD Angelana 1930': 'Stadio Comunale Angelana',
  'Ternana Calcio': 'Stadio Liberati',
  'Lucchese Calcio': 'Stadio Porta Elisa',
};

// Punteggi reali del Prato gia' pubblicati (34 partite), da preservare
const pratoResults = {
  '1:AC Prato:Polisportiva Pietralunghese': [2, 0],
  '2:FC Scandicci 1908:AC Prato': [0, 1],
  '3:AC Prato:San Donato Tavarnelle': [3, 1],
  '4:Terranuova Traiana:AC Prato': [0, 2],
  '5:AC Prato:Rondinella Marzocco': [1, 1],
  '6:Aquila Montevarchi:AC Prato': [1, 3],
  '7:AC Prato:GSD Ghiviborgo VDS': [2, 0],
  '8:US Follonica Gavorrano:AC Prato': [0, 0],
  '9:AC Prato:SC Trestina': [4, 1],
  '10:Foligno Calcio 1928:AC Prato': [1, 1],
  '11:AC Prato:US Città di Pontedera': [2, 1],
  '12:Tau Calcio Altopascio:AC Prato': [2, 1],
  '13:AC Prato:Seravezza Pozzi': [3, 0],
  '14:Siena FC:AC Prato': [1, 0],
  '15:AC Prato:ASD Angelana 1930': [5, 0],
  '16:Ternana Calcio:AC Prato': [0, 2],
  '17:AC Prato:Lucchese Calcio': [1, 0],
  '18:Polisportiva Pietralunghese:AC Prato': [0, 3],
  '19:AC Prato:FC Scandicci 1908': [2, 0],
  '20:San Donato Tavarnelle:AC Prato': [1, 2],
  '21:AC Prato:Terranuova Traiana': [3, 0],
  '22:Rondinella Marzocco:AC Prato': [1, 1],
  '23:AC Prato:Aquila Montevarchi': [2, 1],
  '24:GSD Ghiviborgo VDS:AC Prato': [0, 1],
  '25:AC Prato:US Follonica Gavorrano': [1, 0],
  '26:SC Trestina:AC Prato': [1, 3],
  '27:AC Prato:Foligno Calcio 1928': [0, 0],
  '28:US Città di Pontedera:AC Prato': [2, 2],
  '29:AC Prato:Tau Calcio Altopascio': [2, 1],
  '30:Seravezza Pozzi:AC Prato': [0, 2],
  '31:AC Prato:Siena FC': [1, 1],
  '32:ASD Angelana 1930:AC Prato': [0, 4],
  '33:AC Prato:Ternana Calcio': [2, 0],
  '34:Lucchese Calcio:AC Prato': [1, 1],
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function deterministicScore(matchKey) {
  const rng = mulberry32(hashString(matchKey));
  // Distribuzione plausibile per il calcio dilettantistico: la maggior
  // parte dei risultati sta fra 0 e 3 gol per squadra.
  const weighted = () => {
    const r = rng();
    if (r < 0.28) return 0;
    if (r < 0.56) return 1;
    if (r < 0.80) return 2;
    if (r < 0.93) return 3;
    if (r < 0.98) return 4;
    return 5;
  };
  return [weighted(), weighted()];
}

// --- Circle method: 18 squadre, Prato fissa in posizione 0 ---
const rotating = [...pratoScheduleOrder]; // 17 squadre, ruotano
const n = 18;
const rounds = []; // array di round, ognuno array di [home, away]

for (let r = 0; r < n - 1; r++) {
  const arrangement = [PRATO, ...rotating];
  const roundPairs = [];
  // Prato (pos 0) vs pos 1
  roundPairs.push([arrangement[0], arrangement[1]]);
  // le altre 8 coppie: pos[i] vs pos[(n+1)-i] per i=2..n/2
  for (let i = 2; i <= n / 2; i++) {
    roundPairs.push([arrangement[i], arrangement[n + 1 - i]]);
  }
  rounds.push(roundPairs);
  // ruota: la squadra in pos1 va in fondo, le altre avanzano di una posizione
  rotating.push(rotating.shift());
}

const matches = [];
let sortOrder = 0;

for (let leg = 0; leg < 2; leg++) {
  for (let r = 0; r < rounds.length; r++) {
    const matchday = leg * 17 + r + 1;
    const [dateLabel, time] = roundMeta[matchday - 1];
    const legLabel = leg === 0 ? 'Andata' : 'Ritorno';
    for (let p = 0; p < rounds[r].length; p++) {
      let [home, away] = rounds[r][p];
      // In round pari, il primo della coppia gioca in casa; nei round
      // dispari si inverte. Per Prato questo riproduce esattamente
      // l'alternanza casa/trasferta gia' pubblicata (MD1 casa, MD2 trasferta...).
      if (r % 2 === 1) [home, away] = [away, home];
      // Ritorno: casa/trasferta invertite rispetto all'andata
      if (leg === 1) [home, away] = [away, home];

      const id = `season-2026-27-md${matchday}-${p + 1}`;
      const involvesLookupKey = `${matchday}:${home}:${away}`;
      let homeScore;
      let awayScore;
      if (pratoResults[involvesLookupKey]) {
        [homeScore, awayScore] = pratoResults[involvesLookupKey];
      } else {
        [homeScore, awayScore] = deterministicScore(`${home}|${away}|md${matchday}`);
      }

      matches.push({
        id,
        matchday,
        leg: legLabel,
        competition: 'Campionato',
        roundLabel: `${matchday <= 17 ? matchday : matchday - 17}ª giornata${leg === 1 ? ' (Ritorno)' : ''}`,
        home,
        away,
        dateLabel,
        time,
        venue: venues[home],
        homeScore,
        awayScore,
        status: 'final',
        sortOrder: sortOrder++,
      });
    }
  }
}

// --- Validazione interna dello script (fail-fast) ---
if (matches.length !== 306) throw new Error(`Attese 306 partite, generate ${matches.length}`);
const perTeamCount = new Map();
const perMatchdayCount = new Map();
const pairCount = new Map();
for (const m of matches) {
  perTeamCount.set(m.home, (perTeamCount.get(m.home) || 0) + 1);
  perTeamCount.set(m.away, (perTeamCount.get(m.away) || 0) + 1);
  perMatchdayCount.set(m.matchday, (perMatchdayCount.get(m.matchday) || 0) + 1);
  if (m.home === m.away) throw new Error(`Squadra contro se stessa: ${m.id}`);
  const key = [m.home, m.away].sort().join(' vs ');
  pairCount.set(key, (pairCount.get(key) || 0) + 1);
}
for (const [team, count] of perTeamCount) if (count !== 34) throw new Error(`${team} ha ${count} partite, attese 34`);
for (const [md, count] of perMatchdayCount) if (count !== 9) throw new Error(`Giornata ${md} ha ${count} partite, attese 9`);
for (const [pair, count] of pairCount) if (count !== 2) throw new Error(`Coppia ${pair} si affronta ${count} volte, attese 2`);
// ogni squadra gioca una sola volta per giornata
for (let md = 1; md <= 34; md++) {
  const teamsThisRound = new Set();
  for (const m of matches.filter((x) => x.matchday === md)) {
    if (teamsThisRound.has(m.home) || teamsThisRound.has(m.away)) throw new Error(`Squadra doppia alla giornata ${md}`);
    teamsThisRound.add(m.home);
    teamsThisRound.add(m.away);
  }
  if (teamsThisRound.size !== 18) throw new Error(`Giornata ${md} non ha tutte le 18 squadre`);
}

// --- Output TypeScript ---
const header = `// FILE GENERATO — non modificare a mano.
// Generato da scripts/generate-full-season.cjs (deterministico, nessun Math.random() a runtime).
// Campionato simulato/dimostrativo a scopo di sviluppo — non dati ufficiali.
// 18 squadre · 34 giornate · 9 partite a giornata · 306 partite totali.

import { SeasonMatch } from '../types';

export const FULL_SEASON_NOTICE = 'Campionato simulato — dati dimostrativi, non ufficiali';

export const fullSeasonMatches: SeasonMatch[] = ${JSON.stringify(matches, null, 2)};
`;

process.stdout.write(header);
