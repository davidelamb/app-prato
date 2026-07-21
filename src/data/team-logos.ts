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
  /** Pagina usata per verificare la provenienza dello stemma. */
  sourceUrl?: string;
}

export const teamLogos: Record<string, TeamLogoInfo> = {
  'AC Prato': {
    canonicalName: 'AC Prato',
    aliases: ['Prato'],
    logoSource: require('../../assets/team-logos/ac-prato.png'),
    sourceUrl: 'https://www.transfermarkt.it/ac-prato/startseite/verein/2250',
  },
  'Tau Calcio Altopascio': {
    canonicalName: 'Tau Calcio Altopascio',
    aliases: ['Tau Altopascio'],
    logoSource: require('../../assets/team-logos/tau-calcio-altopascio.png'),
    sourceUrl: 'https://www.transfermarkt.it/tau-calcio-altopascio/startseite/verein/43153',
  },
  'Seravezza Pozzi': {
    canonicalName: 'Seravezza Pozzi',
    aliases: ['Seravezza'],
    logoSource: require('../../assets/team-logos/seravezza-pozzi.png'),
    sourceUrl: 'https://www.transfermarkt.it/seravezza-pozzi-calcio/startseite/verein/59318',
  },
  'US Città di Pontedera': {
    canonicalName: 'US Città di Pontedera',
    aliases: ['Pontedera'],
    logoSource: require('../../assets/team-logos/us-citta-di-pontedera.png'),
    sourceUrl: 'https://www.transfermarkt.it/us-citta-di-pontedera/startseite/verein/14888',
  },
  'Siena FC': {
    canonicalName: 'Siena FC',
    aliases: ['Siena'],
    logoSource: require('../../assets/team-logos/siena-fc.png'),
    sourceUrl: 'https://www.transfermarkt.it/acn-siena-1904/startseite/verein/1387',
  },
  'SC Trestina': {
    canonicalName: 'SC Trestina',
    aliases: ['Trestina'],
    logoSource: require('../../assets/team-logos/sc-trestina.png'),
    sourceUrl: 'https://www.transfermarkt.it/sc-trestina/startseite/verein/38489',
  },
  'US Follonica Gavorrano': {
    canonicalName: 'US Follonica Gavorrano',
    aliases: ['Follonica Gavorrano', 'Gavorrano'],
    logoSource: require('../../assets/team-logos/us-follonica-gavorrano.png'),
    sourceUrl: 'https://www.transfermarkt.it/us-follonica-gavorrano/startseite/verein/27568',
  },
  'San Donato Tavarnelle': {
    canonicalName: 'San Donato Tavarnelle',
    aliases: ['San Donato', 'Tavarnelle'],
    logoSource: require('../../assets/team-logos/san-donato-tavarnelle.png'),
    sourceUrl: 'https://www.transfermarkt.it/san-donato-tavarnelle/startseite/verein/39818',
  },
  'Aquila Montevarchi': {
    canonicalName: 'Aquila Montevarchi',
    aliases: ['Montevarchi'],
    logoSource: require('../../assets/team-logos/aquila-montevarchi.png'),
    sourceUrl: 'https://www.transfermarkt.it/aquila-1902-montevarchi/startseite/verein/4339',
  },
  'Lucchese Calcio': {
    canonicalName: 'Lucchese Calcio',
    aliases: ['Lucchese'],
    logoSource: require('../../assets/team-logos/lucchese-calcio.png'),
    sourceUrl: 'https://www.transfermarkt.it/lucchese-1905/startseite/verein/1253',
  },
  'Terranuova Traiana': {
    canonicalName: 'Terranuova Traiana',
    aliases: ['Terranuova'],
    logoSource: require('../../assets/team-logos/terranuova-traiana.png'),
    sourceUrl: 'https://www.transfermarkt.it/asd-terranuova-traiana/startseite/verein/78454',
  },
  'GSD Ghiviborgo VDS': {
    canonicalName: 'GSD Ghiviborgo VDS',
    aliases: ['Ghiviborgo', 'Ghiviborgo VDS'],
    logoSource: require('../../assets/team-logos/ghiviborgo.png'),
    sourceUrl: 'https://www.transfermarkt.it/ghivizzano-borgo-a-mozzano/startseite/verein/41692',
  },
  'FC Scandicci 1908': {
    canonicalName: 'FC Scandicci 1908',
    aliases: ['Scandicci'],
    logoSource: require('../../assets/team-logos/fc-scandicci-1908.png'),
    sourceUrl: 'https://www.transfermarkt.it/cs-scandicci-1908/startseite/verein/27049',
  },
  'Foligno Calcio 1928': {
    canonicalName: 'Foligno Calcio 1928',
    aliases: ['Foligno'],
    logoSource: require('../../assets/team-logos/foligno-calcio-1928.png'),
    sourceUrl: 'https://www.transfermarkt.it/asd-c4/startseite/verein/83391',
  },
  'Ternana Calcio': {
    canonicalName: 'Ternana Calcio',
    aliases: ['Ternana'],
    logoSource: require('../../assets/team-logos/ternana-calcio.png'),
    sourceUrl: 'https://www.transfermarkt.it/ternana-calcio/startseite/verein/1103',
  },
  'ASD Angelana 1930': {
    canonicalName: 'ASD Angelana 1930',
    aliases: ['Angelana'],
    logoSource: require('../../assets/team-logos/asd-angelana-1930.png'),
    sourceUrl: 'https://www.transfermarkt.it/asd-angelana-1930/startseite/verein/54611',
  },
  'Rondinella Marzocco': {
    canonicalName: 'Rondinella Marzocco',
    aliases: ['Rondinella'],
    logoSource: require('../../assets/team-logos/rondinella-marzocco.png'),
    sourceUrl: 'https://www.transfermarkt.it/rondinella-marzocco/startseite/verein/4569',
  },
  'Polisportiva Pietralunghese': {
    canonicalName: 'Polisportiva Pietralunghese',
    aliases: ['Pietralunghese'],
    logoSource: require('../../assets/team-logos/pietralunghese.png'),
    sourceUrl: 'https://www.transfermarkt.it/polisportiva-pietralunghese/startseite/verein/54953',
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
