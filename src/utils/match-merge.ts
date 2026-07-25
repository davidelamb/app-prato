import { SeasonMatch } from '../types';
import { normalizeTeamName } from './team-names';

// Confronta due partite tramite competizione + giornata + squadre
// normalizzate anziché tramite id grezzo: id diversi fra versioni del seed
// (es. il vecchio calendario incompleto pre-v12) non devono generare
// duplicati né impedire il completamento con le partite mancanti.
export function matchIdentityKey(match: Pick<SeasonMatch, 'competition' | 'matchday' | 'home' | 'away'>): string {
  return [
    match.competition ?? 'Campionato',
    match.matchday ?? 0,
    normalizeTeamName(match.home ?? ''),
    normalizeTeamName(match.away ?? ''),
  ].join('|');
}

// Fonde un elenco "seed" (fonte di verità aggiornata) con un elenco
// "saved" (persistito, potenzialmente vecchio o incompleto): le partite del
// seed vengono preservate integralmente e arricchite con i campi salvati se
// la stessa partita esiste già (stesso identity key); le partite salvate
// che non trovano corrispondenza nel seed vengono aggiunte (partite
// aggiunte manualmente dall'admin), senza mai duplicare.
export function mergeMatchLists(seedList: SeasonMatch[], savedList: SeasonMatch[]): SeasonMatch[] {
  const savedByKey = new Map(savedList.map((m) => [matchIdentityKey(m), m]));
  const seedKeys = new Set(seedList.map((m) => matchIdentityKey(m)));
  const merged = seedList.map((seed) => {
    const saved = savedByKey.get(matchIdentityKey(seed));
    return saved ? { ...seed, ...saved, id: seed.id } : seed;
  });
  for (const saved of savedList) {
    if (!seedKeys.has(matchIdentityKey(saved))) merged.push(saved);
  }
  return merged;
}
