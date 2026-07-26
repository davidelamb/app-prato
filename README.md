# APPrato

App Expo/React Native in TypeScript dedicata ai tifosi del Prato. Il progetto
funziona su web, iOS e Android e non è presentato come applicazione ufficiale
del club.

## Sezioni

- News con caricamento progressivo e dettaglio articolo
- Media
- Live collegato alla prossima partita del calendario
- Statistiche con calendario, risultati, classifica e forma
- Club con rosa, nazionalità e profili dei giocatori
- Pannello amministrativo per contenuti, partite, classifica e rosa

Il calendario supporta Campionato, Coppa Italia e Amichevoli. Il dataset di
campionato contiene 18 squadre, 34 giornate e 306 partite; la classifica viene
ricalcolata dai risultati.

## Avvio locale

```powershell
npm install --no-audit --no-fund
npx.cmd expo start --web -c
```

Per Expo Go, telefono e PC devono essere sulla stessa rete:

```powershell
npx.cmd expo start --lan -c
```

L'indirizzo LAN e la porta possono cambiare: usare il QR e l'URL mostrati da
Expo al momento dell'avvio.

## Verifiche

```powershell
npm run typecheck
npm run verify:core
npm run verify:season
npm run build:web
```

## Dati e pubblicazione

La produzione web è pubblicata su
`https://app-prato.david3-a.workers.dev`. Cloudflare esegue il deploy dopo il
merge su `main` usando `wrangler.jsonc`.

I contenuti amministrativi sono attualmente salvati tramite AsyncStorage:
restano sul browser o dispositivo che li ha modificati e non si sincronizzano
tra iPhone, PC e altri utenti. Per la pubblicazione editoriale condivisa serve
un backend autenticato.

Le rose possono essere aggiornate manualmente o con lo strumento di sviluppo
`npm run import-rosters`, usando fonti autorizzate. L'app non esegue scraping
automatico di Transfermarkt.

## Collaborazione

Leggere `AGENTS.md` prima di intervenire. Le modifiche non banali passano da un
branch dedicato, una pull request, i controlli CI e infine il merge in `main`.
