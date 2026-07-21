import { provisionalPratoSchedule } from './season-2026-27';
import { AppContent, MediaItem, Player, SeasonMatch } from '../types';

const tm = (path: string) => `https://img.a.transfermarkt.technology/portrait/medium/${path}?lm=1`;
const source = 'https://www.transfermarkt.com/ac-prato/kader/verein/2250/saison_id/2026';
const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

const demoResults: Array<[number, number]> = [
  [2, 0], [1, 1], [0, 1], [3, 1], [2, 2], [1, 0], [0, 2], [2, 1], [1, 3], [0, 0],
  [3, 2], [1, 0], [2, 2], [0, 1], [4, 1], [1, 2], [2, 0], [0, 0], [2, 1], [1, 1],
  [0, 2], [3, 0], [1, 2], [2, 2], [1, 0], [0, 3], [2, 1], [1, 1], [3, 2], [0, 1],
];

const demoSchedule: SeasonMatch[] = provisionalPratoSchedule.slice(0, 30).map((match, index) => {
  const date = new Date(Date.UTC(2026, 8, 6 + index * 7));
  const dateLabel = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(date);
  return {
    ...match,
    competition: 'Campionato',
    roundLabel: `${match.matchday}ª giornata`,
    dateLabel,
    time: index % 4 === 0 ? '18:00' : '15:00',
    venue: match.home === 'AC Prato' ? 'Stadio Lungobisenzio' : `Stadio ${match.home}`,
    homeScore: demoResults[index][0],
    awayScore: demoResults[index][1],
    sortOrder: index,
  };
});

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

const media: MediaItem[] = [
  { id: 'media-ghiviborgo', kind: 'Highlights', title: 'Ghiviborgo – Prato 0-3: gli highlights', description: 'La vittoria esterna dei biancazzurri con il rigore di Rossetti e la doppietta di Verde.', publishedAt: '29 MAR 2026', source: 'TV Prato', thumbnailUrl: ytThumb('ec3d9oX2qTI'), url: 'https://www.youtube.com/watch?v=ec3d9oX2qTI', featured: true },
  { id: 'media-prato-channel', kind: 'Video', title: 'AC Prato su Prato Channel', description: 'Contenuti e aggiornamenti video dal canale ufficiale biancazzurro.', publishedAt: '22 FEB 2026', source: 'Prato Channel', thumbnailUrl: ytThumb('E_JAeMd4ajA'), url: 'https://www.youtube.com/watch?v=E_JAeMd4ajA' },
  { id: 'media-politano', kind: 'Intervista', title: 'Politano: «Costruiamo una squadra ambiziosa»', description: 'Il presidente parla di mercato, stadio e prospettive per la nuova stagione.', publishedAt: '27 GIU 2026', source: 'TV Prato', thumbnailUrl: 'https://www.acprato.it/site/wp-content/uploads/2021/07/poster-video.png', url: 'https://www.tvprato.it/ac-prato-il-presidente-politano-sara-una-squadra-da-serie-c-ho-scritto-ad-abete-siamo-disponibili-per-il-ripescaggio/' },
  { id: 'media-zanon', kind: 'Intervista', title: 'Zanon racconta il lavoro della squadra', description: 'L’esterno biancazzurro parla dell’organizzazione tattica e del gruppo.', publishedAt: '12 FEB 2026', source: 'TV Prato', thumbnailUrl: tm('280044-1567145368.jpg'), url: 'https://www.tvprato.it/ac-prato-zanon-mister-dal-canto-ci-ha-dato-ordine-in-campo/' },
  { id: 'media-limberti', kind: 'Intervista', title: 'Limberti: «Ogni partita sarà una finale»', description: 'L’intervista all’esterno cresciuto nel vivaio del Prato.', publishedAt: '12 MAR 2026', source: 'TV Prato', thumbnailUrl: 'https://www.lanazione.it/image-service/view/acePublic/alias/contentid/MTQ1ZmQ1NjQtNWViZS00/0/prato-zero-alibi-prendiamoci-tre-punti-concentrazione-la-ricetta-anti-ghiviborgo.webp?f=16%3A9&q=0.75&w=1280', url: 'https://www.tvprato.it/ac-prato-limberti-ci-aspettano-otto-finali/' },
];

export const seedContent: AppContent = {
  updatedAt: '21 lug 2026 · simulazione admin completa',
  fixtures: [
    { id: 'fixture-1', competition: 'Serie D · Girone E', matchday: 'Diretta dimostrativa', dateLabel: 'LIVE DEMO', time: "78'", home: 'AC Prato', away: 'Tau Calcio Altopascio', homeScore: 2, awayScore: 1, status: 'live', minute: 78, venue: 'Stadio Lungobisenzio', isDemo: true, livePhase: 'second_half', liveEvents: [
      { id: 'demo-chance-3', type: 'chance', label: 'Occasione AC Prato', minute: 76, team: 'AC Prato', scorer: 'Zanon sfiora il palo con un diagonale.', score: '2-1', createdAt: '2026-07-21T14:16:00.000Z' },
      { id: 'demo-sub-2', type: 'substitution', label: 'Sostituzione Tau Calcio Altopascio', minute: 72, team: 'Tau Calcio Altopascio', scorer: 'Entra Nottoli, esce Meucci.', score: '2-1', createdAt: '2026-07-21T14:12:00.000Z' },
      { id: 'demo-yellow-2', type: 'yellow_card', label: 'Ammonizione AC Prato', minute: 68, team: 'AC Prato', scorer: 'Risaliti per intervento in ritardo.', score: '2-1', createdAt: '2026-07-21T14:08:00.000Z' },
      { id: 'demo-goal-3', type: 'goal', label: 'Gol AC Prato', minute: 63, team: 'AC Prato', scorer: 'Francesco Verde', score: '2-1', createdAt: '2026-07-21T14:03:00.000Z' },
      { id: 'demo-sub-1', type: 'substitution', label: 'Sostituzione AC Prato', minute: 58, team: 'AC Prato', scorer: 'Entra Benedetti, esce Limberti.', score: '1-1', createdAt: '2026-07-21T13:58:00.000Z' },
      { id: 'demo-goal-2', type: 'goal', label: 'Gol Tau Calcio Altopascio', minute: 54, team: 'Tau Calcio Altopascio', scorer: 'Meucci', score: '1-1', createdAt: '2026-07-21T13:54:00.000Z' },
      { id: 'demo-second-half', type: 'second_half', label: 'Inizio secondo tempo', minute: 46, score: '1-0', createdAt: '2026-07-21T13:46:00.000Z' },
      { id: 'demo-half', type: 'halftime', label: 'Fine primo tempo', minute: 45, score: '1-0', createdAt: '2026-07-21T13:45:00.000Z' },
      { id: 'demo-yellow-1', type: 'yellow_card', label: 'Ammonizione Tau Calcio Altopascio', minute: 34, team: 'Tau Calcio Altopascio', scorer: 'Meucci per fallo tattico.', score: '1-0', createdAt: '2026-07-21T13:34:00.000Z' },
      { id: 'demo-chance-2', type: 'chance', label: 'Occasione Tau Calcio Altopascio', minute: 27, team: 'Tau Calcio Altopascio', scorer: 'Conclusione respinta da Furghieri.', score: '1-0', createdAt: '2026-07-21T13:27:00.000Z' },
      { id: 'demo-goal-1', type: 'goal', label: 'Gol AC Prato', minute: 18, team: 'AC Prato', scorer: 'Lorenzo Benedetti', score: '1-0', createdAt: '2026-07-21T13:18:00.000Z' },
      { id: 'demo-chance-1', type: 'chance', label: 'Occasione AC Prato', minute: 8, team: 'AC Prato', scorer: 'Fiorini calcia alto dal limite.', score: '0-0', createdAt: '2026-07-21T13:08:00.000Z' },
      { id: 'demo-start', type: 'kickoff', label: 'Inizio partita', minute: 1, score: '0-0', createdAt: '2026-07-21T13:01:00.000Z' },
    ] },
    { id: 'fixture-2', competition: 'Serie D · Girone E', matchday: '38ª giornata', dateLabel: 'DOM 03 MAG', time: 'FINALE', home: 'Seravezza Pozzi', away: 'Prato', homeScore: 1, awayScore: 1, status: 'final', venue: 'Buon Riposo', livePhase: 'finished', liveEvents: [] },
    { id: 'fixture-3', competition: 'Coppa Italia Serie D', matchday: 'Turno preliminare', dateLabel: 'DOM 30 AGO', time: '16:00', home: 'Prato', away: 'Sangiovannese', status: 'scheduled', venue: 'Stadio Lungobisenzio', livePhase: 'scheduled', liveEvents: [] },
  ],
  schedule: demoSchedule,
  standings: [
    { rank: 1, club: 'Tau Altopascio', played: 0, points: 0, form: ['W', 'W', 'D', 'W', 'L'] },
    { rank: 2, club: 'Prato', played: 0, points: 0, form: ['D', 'W', 'D', 'W', 'W'] },
    { rank: 3, club: 'Seravezza Pozzi', played: 0, points: 0, form: ['W', 'D', 'L', 'W', 'W'] },
  ],
  players,
  media,
  news: [
    { id: 'news-convocati', category: 'Prima squadra', title: 'I convocati per la prossima sfida', summary: 'Il gruppo biancazzurro è pronto per il nuovo appuntamento di campionato.', body: 'Lo staff tecnico ha definito l’elenco dei convocati. La squadra completerà la preparazione con la rifinitura al Lungobisenzio.', publishedAt: '21 LUG 2026', source: 'Redazione APPrato', imageUrl: 'https://www.lanazione.it/image-service/view/acePublic/alias/contentid/MTQ1ZmQ1NjQtNWViZS00/0/prato-zero-alibi-prendiamoci-tre-punti-concentrazione-la-ricetta-anti-ghiviborgo.webp?f=16%3A9&q=0.75&w=1280' },
    { id: 'news-biglietti', category: 'Stadio', title: 'Aperta la prevendita per il Lungobisenzio', summary: 'Disponibili i tagliandi per tribuna e gradinata in vista della gara interna.', body: 'La prevendita è attiva nei punti autorizzati e attraverso i canali indicati dalla società.', publishedAt: '19 LUG 2026', source: 'Redazione APPrato', imageUrl: 'https://www.acprato.it/site/wp-content/uploads/Com_Uff.png' },
    { id: 'news-allenamento', category: 'Allenamenti', title: 'Seduta tecnico-tattica per i biancazzurri', summary: 'Lavoro sul possesso e sulle situazioni da palla inattiva.', body: 'La squadra ha svolto una seduta intensa alternando esercitazioni tecniche e prove tattiche.', publishedAt: '18 LUG 2026', source: 'Redazione APPrato', imageUrl: 'https://www.lanazione.it/image-service/view/acePublic/alias/contentid/ZjlhNjhjMWUtZTg2Ni00/0/prato-parla-il-preparatore-atletico-chiatto-ragazzi-seri-e-motivati-non-si-risparmiano.webp?f=16%3A9&q=0.75&w=1280' },
    { id: 'news-intervista-verde', category: 'Intervista', title: 'Verde: «Vogliamo partire con il piede giusto»', summary: 'L’attaccante racconta le sensazioni del gruppo durante la preparazione.', body: 'Francesco Verde ha parlato del lavoro svolto e dell’entusiasmo che accompagna la squadra.', publishedAt: '17 LUG 2026', source: 'Redazione APPrato', imageUrl: tm('395888-1644330074.jpg') },
    { id: 'news-amichevole', category: 'Prima squadra', title: 'Definita una nuova amichevole precampionato', summary: 'Un altro test utile per verificare condizione e meccanismi di squadra.', body: 'L’incontro permetterà allo staff di distribuire minuti e valutare le soluzioni provate in allenamento.', publishedAt: '16 LUG 2026', source: 'Redazione APPrato', imageUrl: 'https://www.lanazione.it/image-service/view/acePublic/alias/contentid/MTQ1ZmQ1NjQtNWViZS00/0/prato-zero-alibi-prendiamoci-tre-punti-concentrazione-la-ricetta-anti-ghiviborgo.webp?f=16%3A9&q=0.75&w=1280' },
    { id: 'news-campagna', category: 'Tifosi', title: 'Prosegue la campagna abbonamenti', summary: 'Cresce l’attesa dei tifosi per il ritorno al Lungobisenzio.', body: 'La società ha aggiornato modalità e orari per sottoscrivere l’abbonamento stagionale.', publishedAt: '15 LUG 2026', source: 'Redazione APPrato', imageUrl: 'https://www.acprato.it/site/wp-content/uploads/Com_Uff.png' },
    { id: 'news-fiorini', category: 'Intervista', title: 'Fiorini: «Il centrocampo sta trovando equilibrio»', summary: 'Il centrocampista fa il punto dopo le prime settimane di lavoro.', body: 'Mattia Fiorini sottolinea la disponibilità del gruppo e i progressi nell’organizzazione della manovra.', publishedAt: '14 LUG 2026', source: 'Redazione APPrato', imageUrl: tm('459704-1666194742.png') },
    { id: 'news-settore-giovanile', category: 'Settore giovanile', title: 'Riparte l’attività del vivaio biancazzurro', summary: 'Programmi e gruppi pronti per una nuova stagione di crescita.', body: 'Il settore giovanile riprende l’attività con sedute dedicate alle diverse categorie.', publishedAt: '12 LUG 2026', source: 'Redazione APPrato', imageUrl: 'https://www.acprato.it/site/wp-content/uploads/Com_Uff.png' },
    { id: 'news-stadio', category: 'Società', title: 'Sopralluogo operativo allo stadio Lungobisenzio', summary: 'Club e addetti ai lavori hanno verificato gli spazi in vista del campionato.', body: 'Il sopralluogo ha riguardato accessi, aree tecniche e servizi destinati al pubblico.', publishedAt: '11 LUG 2026', source: 'Redazione APPrato', imageUrl: 'https://www.acprato.it/site/wp-content/uploads/Com_Uff.png' },
    { id: 'news-furghieri', category: 'Mercato', title: 'Furghieri resta al Prato: rinnovo fino al 2027', summary: 'Il giovane portiere prosegue il proprio percorso in biancazzurro dopo una stagione da protagonista.', body: 'Gabriel Furghieri ha prolungato il proprio rapporto con l’AC Prato fino al 30 giugno 2027. Il portiere classe 2006 si è conquistato il posto da titolare nel corso della stagione e rappresenta uno dei punti fermi del nuovo progetto tecnico.', publishedAt: '03 LUG 2026', source: 'NotiziarioCalcio', sourceUrl: 'https://www.notiziariocalcio.com/serie-d/rinnovo-casa-prato-confermata-esclusiva-370939', imageUrl: 'https://net-storage-auto.tcccdn.com/storage/notiziariocalcio.com/img_notizie/thumb3/eb/eb796f3a86f449447d093970a323226f-87825-oooz0000.jpeg' },
    { id: 'news-regole', category: 'Società', title: 'AC Prato si dà le regole per la nuova stagione', summary: 'Codice etico, safeguarding e modello organizzativo nel percorso verso il nuovo campionato.', body: 'Il club ha avviato il percorso per dotarsi di codice etico, codice di condotta safeguarding e modello organizzativo. L’obiettivo è costruire una società più moderna, trasparente e attenta alla tutela di atleti e famiglie.', publishedAt: '19 GIU 2026', source: 'AC Prato', sourceUrl: 'https://www.acprato.it/site/ac-prato-si-da-le-regole-codice-etico-safeguarding-e-modello-organizzativo-in-arrivo-prima-del-via-alla-nuova-stagione/', imageUrl: 'https://www.acprato.it/site/wp-content/uploads/Com_Uff.png' },
    { id: 'news-ritiro', category: 'Prima squadra', title: 'Il Prato torna al lavoro in vista della nuova stagione', summary: 'Allenamenti, intensità e preparazione atletica al centro del programma biancazzurro.', body: 'La squadra è tornata sul campo per iniziare la preparazione. Lo staff sta lavorando su condizione atletica, organizzazione e identità di gioco in vista dei primi appuntamenti ufficiali.', publishedAt: '13 LUG 2026', source: 'La Nazione', sourceUrl: 'https://www.lanazione.it/prato/cronaca/prato-parla-il-preparatore-atletico-f97987d4', imageUrl: 'https://www.lanazione.it/image-service/view/acePublic/alias/contentid/ZjlhNjhjMWUtZTg2Ni00/0/prato-parla-il-preparatore-atletico-chiatto-ragazzi-seri-e-motivati-non-si-risparmiano.webp?f=16%3A9&q=0.75&w=1280' },
    { id: 'news-squadra', category: 'Campionato', title: 'Il gruppo biancazzurro prepara le prossime sfide', summary: 'Concentrazione, unità e lavoro quotidiano per costruire la nuova stagione.', body: 'Il gruppo prosegue la preparazione con sedute dedicate alla parte atletica e tattica. L’obiettivo è arrivare pronto ai primi impegni ufficiali mantenendo forte il legame con la città e i tifosi.', publishedAt: '20 LUG 2026', source: 'La Nazione', sourceUrl: 'https://www.lanazione.it/prato/cronaca/prato-zero-alibi-prendiamoci-tre-3bba275c', imageUrl: 'https://www.lanazione.it/image-service/view/acePublic/alias/contentid/MTQ1ZmQ1NjQtNWViZS00/0/prato-zero-alibi-prendiamoci-tre-punti-concentrazione-la-ricetta-anti-ghiviborgo.webp?f=16%3A9&q=0.75&w=1280' },
  ],
};
