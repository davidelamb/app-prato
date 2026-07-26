// Normalizza il campo nationality (che può essere una stringa singola per
// compatibilità con i dati esistenti, o un array per la doppia
// cittadinanza) in un elenco di stringhe pulite.
export function nationalityList(value?: string | string[]): string[] {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.map((v) => v.trim()).filter(Boolean);
}

// Bandiera emoji per le nazionalità più comuni in questo campionato.
// Nazionalità non presenti nella mappa vengono mostrate solo come testo.
const FLAGS: Record<string, string> = {
  Italia: '🇮🇹',
  Marocco: '🇲🇦',
  Montenegro: '🇲🇪',
  Albania: '🇦🇱',
  Brasile: '🇧🇷',
  Argentina: '🇦🇷',
  Francia: '🇫🇷',
  Romania: '🇷🇴',
  Spagna: '🇪🇸',
  Senegal: '🇸🇳',
  Nigeria: '🇳🇬',
  Tunisia: '🇹🇳',
  Egitto: '🇪🇬',
  'Costa d\'Avorio': '🇨🇮',
  Camerun: '🇨🇲',
  Ghana: '🇬🇭',
};

export function flagFor(nation: string): string | null {
  return FLAGS[nation] ?? null;
}
