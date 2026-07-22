const canonicalAliases: Record<string, string[]> = {
  'AC Prato': ['Prato', 'A.C. Prato', 'Prato Calcio'],
  'US Città di Pontedera': ['Pontedera', 'Città di Pontedera', 'US Pontedera'],
  'Tau Calcio Altopascio': ['Tau Altopascio', 'Tau Calcio'],
  'Siena FC': ['Siena', 'ACN Siena 1904'],
  'SC Trestina': ['Trestina'],
  'US Follonica Gavorrano': ['Follonica Gavorrano', 'Gavorrano'],
  'San Donato Tavarnelle': ['San Donato', 'Tavarnelle'],
  'Aquila Montevarchi': ['Montevarchi', 'Aquila 1902 Montevarchi'],
  'Lucchese Calcio': ['Lucchese', 'Lucchese 1905'],
  'Terranuova Traiana': ['Terranuova', 'ASD Terranuova Traiana'],
  'Seravezza Pozzi': ['Seravezza', 'Seravezza Pozzi Calcio'],
  'GSD Ghiviborgo VDS': ['Ghiviborgo', 'Ghiviborgo VDS', 'Ghivizzano Borgo a Mozzano'],
  'FC Scandicci 1908': ['Scandicci', 'CS Scandicci 1908'],
  'Foligno Calcio 1928': ['Foligno', 'C4 Foligno'],
  'Ternana Calcio': ['Ternana'],
  'ASD Angelana 1930': ['Angelana', 'Angelana 1930'],
  'Rondinella Marzocco': ['Rondinella'],
  'Polisportiva Pietralunghese': ['Pietralunghese'],
};

function basicTeamKey(value: string): string {
  return value
    .toLocaleLowerCase('it')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(a\s*c|a\s*s\s*d|s\s*s\s*d|g\s*s\s*d|u\s*s|f\s*c|s\s*c)\b/g, ' ')
    .replace(/\b(calcio|football club)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const aliasIndex = new Map<string, string>();
for (const [canonical, aliases] of Object.entries(canonicalAliases)) {
  aliasIndex.set(basicTeamKey(canonical), canonical);
  for (const alias of aliases) aliasIndex.set(basicTeamKey(alias), canonical);
}

export function canonicalTeamName(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return aliasIndex.get(basicTeamKey(trimmed)) ?? trimmed;
}

export function normalizeTeamName(value: string): string {
  return basicTeamKey(canonicalTeamName(value));
}

export function teamNamesEqual(left: string, right: string): boolean {
  const leftKey = normalizeTeamName(left);
  return !!leftKey && leftKey === normalizeTeamName(right);
}

export function isPratoTeam(value: string): boolean {
  return normalizeTeamName(value) === normalizeTeamName('AC Prato');
}
