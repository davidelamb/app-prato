# AC Prato App

Prototipo Expo per iOS, Android e web, con palette blu, giallo e bianco ispirata allo stemma fornito.

## Cosa e gia pronto

- Home con prossima partita, classifica e notizia in evidenza.
- Calendario, risultati e rosa.
- Sezione News con dettaglio articolo.
- Centro Live con diretta, formazione e tabellino dimostrativi.
- Club con rosa, media, tifosi e stadio, ispirato alla precedente idea grafica.
- Area admin usabile sia sul web sia da Expo Go: pubblica notizie, modifica il risultato live e aggiunge calciatori.
- Salvataggio persistente nel browser o nel dispositivo che sta eseguendo l'app.

## Test con Expo Go

1. Installa Expo Go sul telefono.
2. Collega telefono e PC alla stessa rete Wi-Fi.
3. Nel terminale che esegue Expo comparira un QR code: scansionalo con Expo Go su Android oppure con la fotocamera su iPhone.

Per riavviarlo dalla cartella del progetto:

```powershell
npx.cmd expo start --lan
```

Per provare la versione web:

```powershell
npx.cmd expo start --web
```

## Dati e pubblicazione

Calendario, classifica e live sono dati demo. La rosa e una fotografia pubblica della stagione 2025/26 tratta da Transfermarkt, senza fotografie o scraping automatico; prima del rilascio va sostituita da una fonte autorizzata o dal dato editoriale del club. L'area admin dimostra il flusso editoriale ma non deve essere esposta in produzione senza autenticazione e un database condiviso.

Per la fase successiva consiglio Supabase: Auth per gli amministratori, Postgres per `fixtures`, `standings`, `players` e `news`, e una funzione schedulata che aggiorni i dati sportivi. Per Transfermarkt serve un utilizzo autorizzato o un inserimento editoriale: il prototipo non effettua scraping del sito.

Le news ufficiali possono essere importate dal feed WordPress di AC Prato, lasciando il pannello admin libero per comunicati e contenuti esclusivi.
