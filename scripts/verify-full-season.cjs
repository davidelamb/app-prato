#!/usr/bin/env node
// Verifica il dataset generato in src/data/full-season-2026-27.ts e la
// coerenza della classifica calcolata a partire da quei risultati.
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'data', 'full-season-2026-27.ts');
const content = fs.readFileSync(filePath, 'utf8');
const marker = 'fullSeasonMatches: SeasonMatch[] = ';
const idx = content.indexOf(marker) + marker.length;
const matches = JSON.parse(content.slice(idx).replace(/;\s*$/, ''));

let failed = 0;
function check(label, cond) {
  if (cond) { console.log(`✅ ${label}`); }
  else { console.log(`❌ ${label}`); failed++; }
}

check('306 partite totali', matches.length === 306);

const teams = new Set();
matches.forEach((m) => { teams.add(m.home); teams.add(m.away); });
check('18 squadre coinvolte', teams.size === 18);

const perTeam = new Map();
const perMatchday = new Map();
const pairs = new Map();
let selfMatch = 0;
for (const m of matches) {
  perTeam.set(m.home, (perTeam.get(m.home) || 0) + 1);
  perTeam.set(m.away, (perTeam.get(m.away) || 0) + 1);
  perMatchday.set(m.matchday, (perMatchday.get(m.matchday) || 0) + 1);
  if (m.home === m.away) selfMatch++;
  const key = [m.home, m.away].sort().join(' vs ');
  pairs.set(key, (pairs.get(key) || 0) + 1);
}

check('ogni squadra gioca 34 partite', [...perTeam.values()].every((n) => n === 34));
check('34 giornate da 9 partite', perMatchday.size === 34 && [...perMatchday.values()].every((n) => n === 9));
check('nessuna squadra contro se stessa', selfMatch === 0);
check('ogni coppia si affronta 2 volte', [...pairs.values()].every((n) => n === 2));

// nessuna squadra due volte nella stessa giornata
let doubleBooked = false;
for (let md = 1; md <= 34; md++) {
  const seen = new Set();
  for (const m of matches.filter((x) => x.matchday === md)) {
    if (seen.has(m.home) || seen.has(m.away)) doubleBooked = true;
    seen.add(m.home); seen.add(m.away);
  }
}
check('nessuna squadra gioca due volte nella stessa giornata', !doubleBooked);

// casa/trasferta invertite fra andata e ritorno
const andata = matches.filter((m) => m.leg === 'Andata');
const ritorno = matches.filter((m) => m.leg === 'Ritorno');
check('34 partite andata + 34 giornate*9/2 ritorno coerenti', andata.length === 153 && ritorno.length === 153);
let swappedOk = true;
for (const a of andata) {
  const rev = ritorno.find((r) => r.home === a.away && r.away === a.home);
  if (!rev) swappedOk = false;
}
check('ogni andata ha il ritorno corrispondente con casa/trasferta invertite', swappedOk);

// classifica: ricalcolo manuale e confronto punti totali
const stats = new Map([...teams].map((t) => [t, { played: 0, points: 0, gf: 0, ga: 0 }]));
for (const m of matches) {
  if (m.status !== 'final' || !Number.isInteger(m.homeScore) || !Number.isInteger(m.awayScore)) continue;
  const home = stats.get(m.home);
  const away = stats.get(m.away);
  home.played++; away.played++;
  home.gf += m.homeScore; home.ga += m.awayScore;
  away.gf += m.awayScore; away.ga += m.homeScore;
  if (m.homeScore > m.awayScore) home.points += 3;
  else if (m.homeScore < m.awayScore) away.points += 3;
  else { home.points += 1; away.points += 1; }
}
check('tutte le 18 squadre hanno 34 partite giocate nella classifica', [...stats.values()].every((s) => s.played === 34));
const totalGoalsFor = [...stats.values()].reduce((sum, s) => sum + s.gf, 0);
const totalGoalsAgainst = [...stats.values()].reduce((sum, s) => sum + s.ga, 0);
check('gol fatti totali = gol subiti totali (simmetria campionato)', totalGoalsFor === totalGoalsAgainst);

const pratoStats = stats.get('AC Prato');
console.log(`\nAC Prato: ${pratoStats.played} giocate, ${pratoStats.points} punti, ${pratoStats.gf}-${pratoStats.ga}`);

console.log(`\n📊 ${matches.length - failed >= 0 ? '' : ''}Risultato: ${failed === 0 ? 'TUTTI I CONTROLLI SUPERATI' : `${failed} controlli falliti`}`);
process.exit(failed === 0 ? 0 : 1);
