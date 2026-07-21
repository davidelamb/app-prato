/**
 * Mappa centralizzata squadra → informazioni logo.
 * Ogni squadra ha nome canonico, alias alternativi e URL del logo (quando disponibile).
 * Usare `resolveTeamLogo()` per ottenere le info a partire da qualsiasi variante del nome.
 *
 * I loghi sono gestiti come URI:
 * - Asset locali: `require(...)` per immagini nel progetto
 * - URL remoti: stringa HTTP/HTTPS
 *
 * Se `logoSource` è undefined, il componente TeamLogo mostra un fallback con le iniziali.
 */

import type { ImageSourcePropType } from 'react-native';

export interface TeamLogoInfo {
  /** Nome canonico della squadra (coincide con la chiave in teamLogos) */
  canonicalName: string;
  /** Alias alternativi con cui la squadra può apparire nei dati */
  aliases: string[];
  /**
   * Fonte del logo. Se undefined o null → fallback automatico.
   * - Asset locale: `require('../../assets/...')`
   * - Remoto: `{ uri: 'https://...' }`
   */
  logoSource?: ImageSourcePropType;
}

export const teamLogos: Record<string, TeamLogoInfo> = {
  'AC Prato': {
    canonicalName: 'AC Prato',
    aliases: ['Prato'],
    logoSource: require('../../assets/ac-prato-crest.png'),
  },
  'Tau Calcio Altopascio': {
    canonicalName: 'Tau Calcio Altopascio',
    aliases: ['Tau Altopascio'],
  },
  'Seravezza Pozzi': {
    canonicalName: 'Seravezza Pozzi',
    aliases: ['Seravezza'],
  },
  'US Città di Pontedera': {
    canonicalName: 'US Città di Pontedera',
    aliases: ['Pontedera'],
  },
  'Siena FC': {
    canonicalName: 'Siena FC',
    aliases: ['Siena'],
  },
  'SC Trestina': {
    canonicalName: 'SC Trestina',
    aliases: ['Trestina'],
  },
  'US Follonica Gavorrano': {
    canonicalName: 'US Follonica Gavorrano',
    aliases: ['Follonica Gavorrano', 'Gavorrano'],
  },
  'San Donato Tavarnelle': {
    canonicalName: 'San Donato Tavarnelle',
    aliases: ['San Donato', 'Tavarnelle'],
  },
  'Aquila Montevarchi': {
    canonicalName: 'Aquila Montevarchi',
    aliases: ['Montevarchi'],
  },
  'Lucchese Calcio': {
    canonicalName: 'Lucchese Calcio',
    aliases: ['Lucchese'],
  },
  'Terranuova Traiana': {
    canonicalName: 'Terranuova Traiana',
    aliases: ['Terranuova'],
  },
  'GSD Ghiviborgo VDS': {
    canonicalName: 'GSD Ghiviborgo VDS',
    aliases: ['Ghiviborgo', 'Ghiviborgo VDS'],
  },
  'FC Scandicci 1908': {
    canonicalName: 'FC Scandicci 1908',
    aliases: ['Scandicci'],
  },
  'Foligno Calcio 1928': {
    canonicalName: 'Foligno Calcio 1928',
    aliases: ['Foligno'],
  },
  'Ternana Calcio': {
    canonicalName: 'Ternana Calcio',
    aliases: ['Ternana'],
  },
  'ASD Angelana 1930': {
    canonicalName: 'ASD Angelana 1930',
    aliases: ['Angelana'],
  },
  'Rondinella Marzocco': {
    canonicalName: 'Rondinella Marzocco',
    aliases: ['Rondinella'],
  },
  'Polisportiva Pietralunghese': {
    canonicalName: 'Polisportiva Pietralunghese',
    aliases: ['Pietralunghese'],
  },
  'Sangiovannese': {
    canonicalName: 'Sangiovannese',
    aliases: [],
  },
};

/**
 * Risolve qualsiasi variante del nome di una squadra alla sua chiave canonica.
 * Restituisce la chiave se trovata, altrimenti il nome originale.
 */
export function resolveTeamKey(name: string): string {
  const normalized = name.trim().toLowerCase();
  for (const [key, info] of Object.entries(teamLogos)) {
    if (key.toLowerCase() === normalized) return key;
    if (info.aliases.some((a) => a.toLowerCase() === normalized)) return key;
  }
  return name;
}

/**
 * Risolve qualsiasi nome di squadra al suo TeamLogoInfo.
 * Restituisce undefined se la squadra non è riconosciuta.
 */
export function resolveTeamLogo(name: string): TeamLogoInfo | undefined {
  const key = resolveTeamKey(name);
  return teamLogos[key] ?? undefined;
}