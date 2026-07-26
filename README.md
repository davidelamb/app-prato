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
npm run typecheck:worker
npm run verify:core
npm run verify:season
npm run build:web
```

## Dati e pubblicazione

La produzione web è pubblicata su
`https://app-prato.david3-a.workers.dev`. Cloudflare esegue il deploy dopo il
merge su `main` usando `wrangler.jsonc`.

I contenuti amministrativi sono condivisi tramite un backend Cloudflare:

- D1 conserva il documento editoriale corrente e le revisioni precedenti;
- R2 conserva le immagini caricate dal pannello admin;
- il Worker espone la lettura pubblica e protegge le scritture con
  `ADMIN_TOKEN`;
- AsyncStorage resta una cache offline e mantiene compatibili i dati locali
  creati dalle versioni precedenti.

La chiave amministratore viene conservata in SecureStore su iOS/Android e
nello storage locale del browser sul web. Non deve essere inserita nel codice
o committata nel repository.

## Configurazione Cloudflare

```powershell
npm run cf:types
npm run db:migrate:local
npm run db:migrate:remote
npx wrangler r2 bucket create app-prato-media
npx wrangler secret put ADMIN_TOKEN
```

Per il test locale creare un file `.dev.vars` non versionato con
`ADMIN_TOKEN=...`, quindi avviare `npx wrangler dev`. L'endpoint
`/api/health` verifica la disponibilità del Worker; il primo salvataggio
autenticato nell'admin inizializza D1 con l'intero contenuto corrente.

Le rose possono essere aggiornate manualmente o con lo strumento di sviluppo
`npm run import-rosters`, usando fonti autorizzate. L'app non esegue scraping
automatico di Transfermarkt.

## Collaborazione

Leggere `AGENTS.md` prima di intervenire. Le modifiche non banali passano da un
branch dedicato, una pull request, i controlli CI e infine il merge in `main`.
