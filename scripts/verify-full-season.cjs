#!/usr/bin/env node
// Verifica il calendario ufficiale LND generato per il Girone E 2026/27.
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'data', 'full-season-2026-27.ts');
const content = fs.readFileSync(filePath, 'utf8');
const marker = 'fullSeasonMatches: SeasonMatch[] = ';
const markerIndex = content.indexOf(marker);
if (markerIndex < 0) throw new Error('Dataset fullSeasonMatches non trovato');
const matches = JSON.parse(content.slice(markerIndex + marker.length).replace(/;\s*$/, ''));

const expectedTeams = [
  'AC Prato',
  'Aquila Montevarchi',
  'FC Scandicci 1908',
  'Flaminia Civitacastellana',
  'GSD Ghiviborgo VDS',
  'Grassina',
  'Lucchese Calcio',
  'Mezzolara',
  'Nuova Ternana',
  'Progresso',
  'Rondinella Marzocco',
  'San Donato Tavarnelle',
  'Sasso Marconi',
  'Seravezza Pozzi',
  'Siena FC',
  'Tau Calcio Altopascio',
  'Terranuova Traiana',
  'US Follonica Gavorrano',
].sort();

let failed = 0;
function check(label, condition) {
  console.log(`${condition ? 'OK' : 'ERRORE'} - ${label}`);
  if (!condition) failed += 1;
}

check('306 partite totali', matches.length === 306);

const teams = [...new Set(matches.flatMap((match) => [match.home, match.away]))].sort();
check('le 18 squadre coincidono con il Girone E ufficiale', JSON.stringify(teams) === JSON.stringify(expectedTeams));

const perTeam = new Map();
const perMatchday = new Map();
const pairs = new Map();
let doubleBooked = false;
for (const match of matches) {
  perTeam.set(match.home, (perTeam.get(match.home) || 0) + 1);
  perTeam.set(match.away, (perTeam.get(match.away) || 0) + 1);
  perMatchday.set(match.matchday, (perMatchday.get(match.matchday) || 0) + 1);
  const key = [match.home, match.away].sort().join('|');
  pairs.set(key, (pairs.get(key) || 0) + 1);
}

for (let matchday = 1; matchday <= 34; matchday += 1) {
  const seen = new Set();
  for (const match of matches.filter((item) => item.matchday === matchday)) {
    if (seen.has(match.home) || seen.has(match.away)) doubleBooked = true;
    seen.add(match.home);
    seen.add(match.away);
  }
}

check('ogni squadra gioca 34 partite', [...perTeam.values()].every((count) => count === 34));
check('34 giornate da 9 partite', perMatchday.size === 34 && [...perMatchday.values()].every((count) => count === 9));
check('nessuna squadra gioca due volte nella stessa giornata', !doubleBooked);
check('ogni coppia si affronta due volte', [...pairs.values()].every((count) => count === 2));
check('andata e ritorno hanno casa/trasferta invertite', matches
  .filter((match) => match.leg === 'Andata')
  .every((match) => matches.some((candidate) => candidate.leg === 'Ritorno'
    && candidate.home === match.away
    && candidate.away === match.home)));

check('nessun risultato simulato', matches.every((match) => match.homeScore === undefined
  && match.awayScore === undefined
  && match.status === 'scheduled'));
check('tutte le date e gli orari sono valorizzati', matches.every((match) => /^\d{2}\/\d{2}\/\d{4}$/.test(match.dateLabel)
  && /^\d{2}:\d{2}$/.test(match.time)));

const pratoMatches = matches.filter((match) => match.home === 'AC Prato' || match.away === 'AC Prato');
const firstPratoMatch = pratoMatches.find((match) => match.matchday === 1);
const lastPratoMatch = pratoMatches.find((match) => match.matchday === 34);
check('il Prato ha 34 partite', pratoMatches.length === 34);
check('prima giornata: AC Prato-Nuova Ternana il 6 settembre', firstPratoMatch?.home === 'AC Prato'
  && firstPratoMatch?.away === 'Nuova Ternana'
  && firstPratoMatch?.dateLabel === '06/09/2026');
check('ultima giornata: AC Prato-Progresso il 2 maggio', lastPratoMatch?.home === 'AC Prato'
  && lastPratoMatch?.away === 'Progresso'
  && lastPratoMatch?.dateLabel === '02/05/2027');

console.log(`Risultato: ${failed === 0 ? 'tutti i controlli superati' : `${failed} controlli falliti`}`);
process.exit(failed === 0 ? 0 : 1);
