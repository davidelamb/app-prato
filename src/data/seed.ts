import { AppContent, Player } from '../types';

const tm = (path: string) => `https://img.a.transfermarkt.technology/portrait/medium/${path}?lm=1`;
const source = 'https://www.transfermarkt.com/ac-prato/kader/verein/2250/saison_id/2026';

const players: Player[] = [
  { id: 'furghieri', number: 12, name: 'Gabriel Furghieri', role: 'Portiere', age: 19, birthDate: '01/11/2006', birthplace: 'Modena', nationality: 'Italia', foot: 'Entrambi', contractUntil: '30/06/2027', marketValue: '€100 mila', appearances: 0, goals: 0, assists: 0, source: 'Transfermarkt', imageUrl: tm('1058885-1762528318.png'), imageSourceUrl: source, bio: 'Portiere giovane, reattivo e moderno, confermato nel progetto biancazzurro.' },
  { id: 'risaliti', number: 4, name: 'Giacomo Risaliti', role: 'Difensore', age: 31, birthDate: '24/04/1995', birthplace: 'Prato', nationality: 'Italia', height: '1,85 m', foot: 'Destro', contractUntil: '30/06/2027', marketValue: '€100 mila', appearances: 0, goals: 0, assists: 0, source: 'Transfermarkt', imageUrl: tm('207965-1475751486.png'), imageSourceUrl: source, bio: 'Difensore centrale di esperienza, forte nel gioco aereo e nella lettura difensiva.' },
  { id: 'polvani', number: 16, name: 'Lorenzo Polvani', role: 'Difensore', age: 31, birthDate: '26/07/1994', birthplace: 'Pistoia', nationality: 'Italia', height: '1,88 m', foot: 'Destro', contractUntil: '30/06/2027', marketValue: '€100 mila', appearances: 0, goals: 0, assists: 0, source: 'Transfermarkt', imageUrl: tm('331838-1475751556.png'), imageSourceUrl: source, bio: 'Centrale strutturato e affidabile, utile anche nella costruzione dal basso.' },
  { id: 'panizzi', name: 'Erik Panizzi', role: 'Difensore', age: 32, nationality: 'Italia', contractUntil: '30/06/2027', marketValue: '€50 mila', appearances: 0, goals: 0, assists: 0, source: 'Transfermarkt', imageUrl: tm('211416-1536479337.jpg'), imageSourceUrl: source },
  { id: 'zanon', number: 11, name: 'Luca Zanon', role: 'Difensore', age: 30, birthDate: '04/07/1996', birthplace: 'Camposampiero', nationality: 'Italia', height: '1,77 m', foot: 'Sinistro', contractUntil: '30/06/2027', marketValue: '€50 mila', appearances: 0, goals: 0, assists: 0, source: 'Transfermarkt', imageUrl: tm('280044-1567145368.jpg'), imageSourceUrl: source, bio: 'Esterno mancino capace di coprire tutta la fascia e dare ampiezza alla manovra.' },
  { id: 'greselin', number: 26, name: 'Simone Greselin', role: 'Centrocampista', age: 28, nationality: 'Italia', contractUntil: '30/06/2027', marketValue: '€100 mila', appearances: 0, goals: 0, assists: 0, source: 'Transfermarkt', imageUrl: tm('373436-1476259389.jpg'), imageSourceUrl: source },
  { id: 'fiorini', number: 34, name: 'Mattia Fiorini', role: 'Centrocampista', age: 25, birthDate: '31/03/2001', birthplace: 'Bagno a Ripoli', nationality: 'Italia', height: '1,85 m', foot: 'Destro', contractUntil: '30/06/2027', marketValue: '€100 mila', appearances: 0, goals: 0, assists: 0, source: 'Transfermarkt', imageUrl: tm('459704-1666194742.png'), imageSourceUrl: source, bio: 'Centrocampista centrale dinamico, efficace nelle due fasi e negli inserimenti.' },
  { id: 'lattarulo', number: 21, name: 'Isaia Lattarulo', role: 'Centrocampista', age: 28, nationality: 'Italia', contractUntil: '30/06/2027', marketValue: '€75 mila', appearances: 0, goals: 0, assists: 0, source: 'Transfermarkt', imageUrl: tm('394777-1663876666.jpg'), imageSourceUrl: source },
  { id: 'cela', number: 14, name: 'Yusuf Cela', role: 'Centrocampista', age: 29, nationality: 'Albania', contractUntil: '30/06/2026', marketValue: '€50 mila', appearances: 0, goals: 0, assists: 0, source: 'Transfermarkt', imageUrl: tm('s_265970_14848_2014_05_07_1.jpg'), imageSourceUrl: source },
  { id: 'dorsi', number: 18, name: "Francesco D'Orsi", role: 'Centrocampista', age: 28, nationality: 'Italia', contractUntil: '30/06/2027', marketValue: '€50 mila', appearances: 0, goals: 0, assists: 0, source: 'Transfermarkt', imageUrl: tm('342350-1752662410.png'), imageSourceUrl: source },
  { id: 'andreoli', number: 23, name: 'Nicola Andreoli', role: 'Centrocampista', age: 26, nationality: 'Italia', contractUntil: '30/06/2026', marketValue: '€50 mila', appearances: 0, goals: 0, assists: 0, source: 'Transfermarkt', imageUrl: tm('395888-1644330074.jpg'), imageSourceUrl: source },
  { id: 'biguzzi', name: 'Riccardo Biguzzi', role: 'Centrocampista', age: 19, nationality: 'Italia', appearances: 0, goals: 0, assists: 0, source: 'Transfermarkt', imageSourceUrl: source },
  { id: 'limberti', number: 7, name: 'Francesco Limberti', role: 'Centrocampista', age: 21, nationality: 'Italia', contractUntil: '30/06/2026', marketValue: '€50 mila', appearances: 0, goals: 0, assists: 0, source: 'Transfermarkt', imageSourceUrl: source },
  { id: 'verde', number: 19, name: 'Francesco Verde', role: 'Attaccante', age: 26, nationality: 'Italia', contractUntil: '30/06/2027', marketValue: '€100 mila', appearances: 0, goals: 0, assists: 0, source: 'Transfermarkt', imageSourceUrl: source, bio: 'Attaccante tecnico, capace di giocare tra le linee e attaccare la profondità.' },
  { id: 'benedetti', name: 'Lorenzo Benedetti', role: 'Attaccante', age: 34, nationality: 'Italia', contractUntil: '30/06/2027', marketValue: '€50 mila', appearances: 0, goals: 0, assists: 0, source: 'Transfermarkt', imageUrl: tm('195291-1477575354.jpg'), imageSourceUrl: source },
];

export const seedContent: AppContent = {
  updatedAt: 'Rosa 2026/27 · aggiornamento prototipo',
  fixtures: [
    { id: 'fixture-1', competition: 'Serie D · Girone E', matchday: 'Diretta dimostrativa', dateLabel: 'LIVE DEMO', time: "67'", home: 'AC Prato', away: 'Tau Altopascio', homeScore: 1, awayScore: 1, status: 'live', minute: 67, venue: 'Stadio Lungobisenzio', isDemo: true, livePhase: 'second_half', liveEvents: [
      { id: 'demo-goal-2', type: 'goal', label: 'Gol Tau Altopascio', minute: 54, team: 'Tau Altopascio', scorer: 'Rossi', score: '1-1', createdAt: new Date().toISOString() },
      { id: 'demo-half', type: 'second_half', label: 'Inizio secondo tempo', minute: 46, score: '1-0', createdAt: new Date().toISOString() },
      { id: 'demo-goal-1', type: 'goal', label: 'Gol AC Prato', minute: 18, team: 'AC Prato', scorer: 'Francesco Verde', score: '1-0', createdAt: new Date().toISOString() },
      { id: 'demo-start', type: 'kickoff', label: 'Inizio partita', minute: 1, score: '0-0', createdAt: new Date().toISOString() },
    ] },
    { id: 'fixture-2', competition: 'Serie D · Girone E', matchday: '38ª giornata', dateLabel: 'DOM 03 MAG', time: 'FINALE', home: 'Seravezza Pozzi', away: 'Prato', homeScore: 1, awayScore: 1, status: 'final', venue: 'Buon Riposo', livePhase: 'finished', liveEvents: [] },
    { id: 'fixture-3', competition: 'Coppa Italia Serie D', matchday: 'Turno preliminare', dateLabel: 'DOM 30 AGO', time: '16:00', home: 'Prato', away: 'Sangiovannese', status: 'scheduled', venue: 'Stadio Lungobisenzio', livePhase: 'scheduled', liveEvents: [] },
  ],
  standings: [
    { rank: 1, club: 'Tau Altopascio', played: 0, points: 0, form: ['W', 'W', 'D', 'W', 'L'] },
    { rank: 2, club: 'Prato', played: 0, points: 0, form: ['D', 'W', 'D', 'W', 'W'] },
    { rank: 3, club: 'Seravezza Pozzi', played: 0, points: 0, form: ['W', 'D', 'L', 'W', 'W'] },
  ],
  players,
  news: [
    { id: 'news-1', category: 'Società', title: 'AC Prato si dà le regole per la nuova stagione', summary: 'Codice etico, safeguarding e modello organizzativo nel percorso verso il nuovo campionato.', body: 'Il club prepara la nuova stagione lavorando su struttura, identità e organizzazione. Questa notizia è un contenuto dimostrativo modificabile dal pannello admin.', publishedAt: '19 GIU 2026', source: 'acprato.it', featured: true },
    { id: 'news-2', category: 'Società', title: 'Jacopo Falanga entra nel consiglio di amministrazione', summary: 'Il club amplia la propria struttura in vista della prossima stagione.', body: 'La società rafforza la propria struttura dirigenziale. Il testo completo può essere aggiornato dall’area amministrativa.', publishedAt: '04 GIU 2026', source: 'acprato.it' },
    { id: 'news-3', category: 'Stadio', title: 'Il Lungobisenzio al centro delle nuove prospettive', summary: 'Aggiornamenti sul futuro della casa dei biancazzurri.', body: 'Il Lungobisenzio resta il cuore del progetto sportivo e della comunità biancazzurra.', publishedAt: '25 MAR 2026', source: 'acprato.it' },
  ],
};
