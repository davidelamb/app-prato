/**
 * Verifica il matching tra i nomi squadra e le chiavi in imported-rosters.ts
 * Esegui con: node scripts/verify-roster-matching.cjs
 */
const fs = require('fs');
const path = require('path');

// Leggi imported-rosters.ts e estrai le chiavi
const rostersRaw = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'imported-rosters.ts'), 'utf8');
const rosterKeys = [];
const keyRegex = /"([^"]+)"\s*:\s*\[/g;
let match;
while ((match = keyRegex.exec(rostersRaw)) !== null) {
  const key = match[1];
  const blockStart = rostersRaw.indexOf('[', match.index);
  let cursor = blockStart + 1;
  let depth = 1;
  while (cursor < rostersRaw.length && depth > 0) {
    if (rostersRaw[cursor] === '[') depth++;
    if (rostersRaw[cursor] === ']') depth--;
    cursor++;
  }
  const block = rostersRaw.slice(blockStart, cursor);
  const count = (block.match(/\bid:\s*"/g) || []).length;
  rosterKeys.push({ key, count });
}

console.log('=== Chiavi in imported-rosters.ts ===');
rosterKeys.forEach(r => console.log(`  ${r.key} (${r.count} giocatori)`));

// I nomi delle squadre (da season-2026-27.ts)
const teams = [
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
  'AC Prato',
  'GSD Ghiviborgo VDS',
  'FC Scandicci 1908',
  'Foligno Calcio 1928',
  'Ternana Calcio',
  'ASD Angelana 1930',
  'Rondinella Marzocco',
  'Polisportiva Pietralunghese',
];

// Reimplementa teamRosterKey (da teams.ts)
function teamRosterKey(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(a\s*c|a\s*s\s*d|s\s*s\s*d|g\s*s\s*d|u\s*s|f\s*c|s\s*c)\b/g, ' ')
    .replace(/\b(calcio|football club)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const rosterKeySet = new Set(rosterKeys.map(r => r.key));

console.log('\n=== Matching Nomi Squadre -> Chiavi Import ===');
for (const t of teams) {
  const key = teamRosterKey(t);
  const has = rosterKeySet.has(key);
  const usesMainRoster = t === 'AC Prato';
  console.log(`  ${t}`);
  console.log(`    => "${key}" ${has ? '✅ OK' : usesMainRoster ? '✅ ROSA PRINCIPALE' : '❌ MISSING'}`);
  if (!has && !usesMainRoster) process.exitCode = 1;
}

// Reverse: quali chiavi non matchano nessuna squadra?
console.log('\n=== Chiavi senza match (se presenti) ===');
const teamKeys = new Set(teams.map(t => teamRosterKey(t)));
let orphans = 0;
for (const r of rosterKeys) {
  if (!teamKeys.has(r.key)) {
    console.log(`  ❌ "${r.key}" — nessuna squadra corrisponde`);
    orphans++;
    process.exitCode = 1;
  }
}
if (orphans === 0) console.log('  ✅ Tutte le chiavi hanno un match');
