# Stemmi ufficiali delle squadre

Implementa una sola funzionalità: associare a ogni squadra presente nei dati correnti di classifica, calendario e live il proprio stemma ufficiale.

Requisiti obbligatori:

1. Leggi `AGENTS.md` e individua dai dati del repository l'elenco effettivo delle squadre. Non usare elenchi di campionati ricordati dal modello e non aggiungere squadre non presenti.
2. Per ciascuna squadra cerca sul web il sito ufficiale del club. Considera ufficiale soltanto il dominio del club o una pagina ufficiale verificabile collegata dal club. Non usare Wikipedia, LoghiCalcio, blog, marketplace, siti di risultati, social non verificati o aggregatori come fonte primaria dell'immagine.
3. Dal sito ufficiale individua lo stemma usato dal club nell'intestazione, nel branding o nel media kit. Registra in una relazione l'URL della pagina ufficiale da cui proviene ogni stemma.
4. Scarica una copia dello stemma nel repository sotto `assets/team-logos/`, con nome file stabile in kebab-case. Non lasciare immagini caricate a runtime da URL esterni.
5. Conserva proporzioni e trasparenza; non deformare, ritagliare o ridisegnare gli stemmi. Ottimizza le dimensioni senza rendere il logo sfocato su schermi ad alta densità. Non usare generazione AI per ricreare stemmi.
6. Aggiorna `src/data/team-logos.ts` come unica mappa centrale: nome canonico, alias realmente presenti nei dati, asset locale tramite `require(...)` e URL della pagina ufficiale usata come fonte. Correggi anche eventuali problemi di codifica UTF-8 nei nomi italiani.
7. Usa `TeamLogo` in tutti i punti in cui compaiono squadre: classifica, calendario/prossime partite, risultati e pannelli live. Non duplicare mappe o logica nelle singole schermate.
8. Se per una squadra non riesci a verificare un'immagine sul sito ufficiale, non usare una fonte non ufficiale e non inventare lo stemma: mantieni il fallback, elenca la squadra come mancante e chiedi indicazioni.
9. Verifica che nessun URL remoto di Wikipedia, LoghiCalcio o altri aggregatori rimanga nella mappa dei loghi.
10. Esegui `cmd /c "npm run typecheck"` e `cmd /c "npm run build:web"`. Correggi gli errori introdotti dalla modifica, ma non cambiare dipendenze.
11. Non eseguire commit, push o deploy in questo workflow. Al termine mostra: squadre rilevate, sito ufficiale di ciascuna, asset aggiunto o fallback, file modificati e risultati delle verifiche.
