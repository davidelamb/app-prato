# Pubblica APPrato su GitHub e Cloudflare

Esegui questo flusso soltanto quando l'utente chiede esplicitamente di pubblicare le modifiche correnti.

1. Leggi `AGENTS.md` e rispetta tutte le istruzioni del repository.
2. Non cercare, mostrare, copiare o stampare chiavi API, token, credenziali o file di segreti.
3. Controlla `git status --short`, `git branch --show-current` e `git remote -v`. Riassumi esattamente i file che verrebbero pubblicati. Non includere modifiche estranee alla richiesta.
4. Non usare mai `git reset --hard`, `git clean`, force push, eliminazioni di file o riscritture della cronologia. Il force push non è necessario per questa automazione.
5. Esegui, usando gli script già presenti nel progetto:
   - `cmd /c "npm run typecheck"`
   - `cmd /c "npm run build:web"`
6. Se uno dei controlli fallisce, fermati: non creare commit e non eseguire push. Riporta l'errore in modo conciso.
7. Per modifiche non banali, se il branch corrente è `main`, crea un branch descrittivo con prefisso `cline/`. Non modificare direttamente la cronologia di `main`.
8. Aggiungi allo staging soltanto i file elencati e pertinenti. Mostra il diff staged sintetico e verifica che non contenga segreti.
9. Crea un singolo commit con messaggio chiaro in italiano e pubblica il branch su `origin` senza force push.
10. Se GitHub CLI è disponibile e autenticato, apri una pull request verso `main` con riepilogo e risultati dei controlli. Abilita subito il merge automatico con strategia squash (`gh pr merge --auto --squash`), così GitHub eseguirà il merge appena tutti i controlli e le regole di protezione risultano soddisfatti. Se il repository non supporta auto-merge ma tutti i controlli obbligatori sono già superati, esegui il merge squash della pull request senza chiedere una seconda conferma. Non ignorare o aggirare controlli falliti e non usare opzioni amministrative per scavalcare le protezioni.
11. Attendi e verifica che la pull request sia stata effettivamente integrata in `main`. Se il merge non riesce, fermati e comunica il motivo senza forzarlo.
12. Il deploy Cloudflare è collegato agli aggiornamenti di `main`: dopo il merge, verifica lo stato del deploy con gli strumenti già configurati, senza creare o modificare token e senza duplicare la pipeline. Se non puoi verificarlo, comunica chiaramente che il deploy è stato avviato dall'integrazione Git e fornisci l'URL beta indicato in `AGENTS.md`.
13. Al termine restituisci branch, commit, URL della pull request, esito dei controlli, stato del merge e stato Cloudflare.
