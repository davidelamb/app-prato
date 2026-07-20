# AGENTS.md — Guida permanente per APPrato

Queste istruzioni valgono per tutto il repository. Prima di modificare il progetto, leggere questo file e ispezionare il codice esistente. Non ricostruire l’app da zero e non eliminare funzioni già presenti senza una richiesta esplicita.

## Progetto

APPrato è un’app Expo/React Native + TypeScript dedicata ai tifosi del Prato. Non presentarla come applicazione ufficiale del club salvo futura autorizzazione esplicita.

- Repository: `davidelamb/app-prato`
- Branch di produzione: `main`
- Expo SDK: 54
- Web beta: `https://app-prato.david3-a.workers.dev`
- Deploy: Cloudflare Workers, automatico dopo gli aggiornamenti di `main`
- Configurazione deploy: `wrangler.jsonc`
- Verifica CI: `.github/workflows/verify.yml`

Per modifiche non banali, lavorare su un branch e aprire una pull request. Unire in `main` solo dopo il superamento dei controlli.

## File da leggere prima di intervenire

- `src/AppShell.tsx`
- `src/types.ts`
- `src/data/seed.ts`
- `src/data/season-2026-27.ts`
- `src/services/content-store.ts`
- `src/screens/`
- `src/components/`
- `src/components/admin/`
- `src/utils/player-image.ts`
- `app.json`
- `package.json`
- `wrangler.jsonc`
- `.github/workflows/verify.yml`

Controllare anche gli ultimi commit per comprendere le modifiche più recenti.

## Identità visiva

L’interfaccia pubblica deve rimanere pulita, chiara e mobile-first:

- sfondo bianco o azzurro molto chiaro;
- testo blu scuro;
- accenti azzurri e piccoli dettagli gialli;
- card bianche con bordi leggeri;
- stile sportivo moderno ma leggibile;
- niente ritorno al precedente tema scuro.

Il marchio dell’app è il logo personalizzato **APPrato con il Duomo di Prato**, non lo stemma ufficiale AC Prato.

Il logo è usato in:

- header pubblico;
- area amministrativa;
- articoli;
- profili giocatori;
- favicon web;
- splash screen;
- icone iOS e Android.

Non rimuovere `scripts/apply-logo-assets.cjs`: genera e verifica gli asset del logo prima degli avvii e delle build.

## Navigazione pubblica

Le sezioni principali sono:

1. Home
2. News
3. Media
4. Live
5. Stats
6. Club

Non rinominare o rimuovere queste sezioni senza richiesta esplicita.

L’admin si apre dal controllo in alto a destra. Mantenere l’area pubblica e l’area admin entrambe funzionanti su web, iOS e Android.

## News e Media

Le News devono supportare:

- immagine di copertina;
- categoria;
- titolo;
- sommario e corpo;
- data;
- fonte e relativo URL.

Media supporta:

- Highlights;
- Intervista;
- Video;
- Podcast.

Ogni elemento Media può avere thumbnail, descrizione, fonte, URL e stato in evidenza.

Non aggiungere contenuti inventati presentandoli come ufficiali. Quando si usano immagini o dati pubblici, conservare il collegamento alla fonte. Evitare dipendenze permanenti da URL instabili quando è possibile salvare asset controllati dal progetto.

## Calendario e classifica

`Stats` contiene due viste:

- Calendario
- Classifica

Il calendario è dinamico e non deve essere limitato alle sole 34 giornate di campionato. Deve accettare partite aggiunte in qualsiasi momento.

Tipi di competizione attualmente previsti:

- `Campionato`
- `Coppa Italia`
- `Amichevole`

La vista pubblica deve mantenere i filtri:

- Tutte
- Campionato
- Coppa Italia
- Amichevoli

Dall’admin deve essere possibile:

- aggiungere una singola partita;
- scegliere la competizione;
- inserire turno o descrizione;
- inserire data e ora;
- indicare casa, trasferta e stadio;
- aggiungere o modificare il risultato;
- eliminare una partita;
- importare più partite;
- riordinare e salvare il calendario.

La classifica resta riferita al campionato e deve essere modificabile dall’admin.

Non implementare scraping automatico di Transfermarkt. I dati possono essere inseriti o importati manualmente oppure ottenuti da una fonte/API autorizzata.

## Rosa e fotografie

Ogni `Player` può contenere:

- `imageUrl`;
- `imageSourceUrl`;
- `imageScale`;
- `imagePositionY`.

`imageScale` e `imagePositionY` servono a ingrandire e riposizionare il ritratto nelle card e nei profili. Usare sempre `playerImageStyle()` da `src/utils/player-image.ts` nei nuovi punti dell’interfaccia che mostrano fotografie dei giocatori.

Dall’admin devono restare disponibili:

- caricamento immagine;
- URL immagine;
- zoom;
- posizione verticale;
- anteprima del ritaglio.

Quando si cerca una fotografia sul web, verificare con attenzione che rappresenti davvero il giocatore corretto. Non associare immagini dubbie o persone omonime. Conservare sempre la fonte.

## Persistenza e migrazioni

I contenuti sono salvati localmente tramite AsyncStorage in `src/services/content-store.ts`.

Regole obbligatorie:

- non cancellare i dati degli utenti durante un aggiornamento;
- non cambiare la chiave di storage senza una migrazione esplicita;
- mantenere la lettura delle chiavi precedenti quando si incrementa la versione;
- normalizzare i nuovi campi per i dati già salvati;
- usare i dati seed solo come fallback o per completare campi mancanti;
- verificare sempre il comportamento di `loadContent`, `saveContent` e `resetContent`.

## Interfaccia pubblica

L’app deve apparire come un prodotto già pulito e utilizzabile.

Non aggiungere nell’interfaccia pubblica:

- avvisi tecnici;
- testi “demo” o “prototipo”;
- note per sviluppatori;
- spiegazioni sulle fonti dati;
- messaggi relativi a build, migrazioni o autorizzazioni;
- diciture “provvisorio” salvo richiesta esplicita.

Eventuali informazioni tecniche devono restare nel codice, nella documentazione o nell’admin.

## Compatibilità e qualità

Mantenere compatibilità con:

- Expo Web;
- iOS;
- Android.

Non usare API esclusivamente web senza una protezione adeguata. Non introdurre dipendenze pesanti se la funzione può essere realizzata con gli strumenti già presenti.

Prima di pubblicare modifiche eseguire:

```bash
npm install --no-audit --no-fund
npm run typecheck
npm run build:web
```

Il repository non usa necessariamente un `package-lock.json`: non sostituire automaticamente `npm install` con `npm ci`.

Una modifica è conclusa soltanto quando:

- TypeScript non restituisce errori;
- l’export Expo Web riesce;
- non sono state rimosse funzioni esistenti per errore;
- la migrazione dei contenuti salvati è stata considerata;
- l’interfaccia rimane utilizzabile su schermi mobili.

## Cloudflare

`wrangler.jsonc` esegue la build web e pubblica la cartella `dist`.

Non modificare la configurazione Cloudflare senza una necessità concreta e verificata. Un errore di deploy non deve portare a riprogettare l’app o a rimuovere funzionalità: leggere prima i log della build.

## Modalità di lavoro richiesta

Prima di scrivere codice:

1. leggere i file coinvolti;
2. individuare i tipi e i flussi di persistenza interessati;
3. controllare se la funzione esiste già parzialmente;
4. pianificare una modifica minima e compatibile.

Dopo il lavoro, fornire un riepilogo con:

- file modificati;
- comportamento aggiunto o corretto;
- migrazioni introdotte;
- comandi di test eseguiti;
- eventuali limiti o dati ancora da verificare.
