#!/usr/bin/env node

/**
 * scripts/import-team-rosters.cjs
 *
 * Strumento di sviluppo per importare rose delle squadre da fonti statiche.
 * Usa solo API Node.js built-in (fs, path, https, http).
 * Non fa scraping automatico a runtime dell'app.
 *
 * Utilizzo:
 *   node scripts/import-team-rosters.cjs [--config <path>] [--team <name>] [--delay <ms>] [--output <path>]
 *
 *   --config   Percorso del file JSON di configurazione (default: scripts/rosters-config.json)
 *   --team     Nome esatto di una squadra da importare (se omesso, importa tutte)
 *   --delay    Pausa in millisecondi tra una squadra e l'altra (default: 3000)
 *   --output   Percorso del file TypeScript generato (default: src/data/imported-rosters.ts)
 *
 * Configurazione:
 *   Ogni voce nel JSON di configurazione deve avere:
 *     - name:        nome ufficiale della squadra (obbligatorio)
 *     - sourceUrl:   URL della pagina con la rosa (opzionale)
 *     - manualPlayers: array di giocatori come fallback (opzionale)
 *
 *   Esempio: vedi scripts/rosters-config.example.json
 *
 * Output:
 *   - src/data/imported-rosters.ts: file TypeScript generato con le rose importate
 *   - scripts/rosters-errors.log:   report degli errori (solo se ci sono fallimenti)
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// ---------------------------------------------------------------------------
// CLI arguments
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const raw = argv[i];
    if (raw === "--help" || raw === "-h") {
      args.help = true;
    } else if (raw === "--config" && i + 1 < argv.length) {
      args.config = argv[++i];
    } else if (raw === "--team" && i + 1 < argv.length) {
      args.team = argv[++i];
    } else if (raw === "--delay" && i + 1 < argv.length) {
      args.delay = Math.max(0, Number(argv[++i]) || 3000);
    } else if (raw === "--output" && i + 1 < argv.length) {
      args.output = argv[++i];
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// HTTP helpers (built-in only)
// ---------------------------------------------------------------------------

function fetchText(url, timeoutMs = 15000, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    const MAX_REDIRECTS = 5;
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return reject(new Error(`Schema non supportato: ${parsed.protocol}`));
    }
    const transport = parsed.protocol === "https:" ? https : http;
    const req = transport.get(
      url,
      { headers: { "User-Agent": "APPrato-RosterImporter/1.0 (dev-tool)" }, timeout: timeoutMs },
      (res) => {
        // Follow redirects (up to MAX_REDIRECTS)
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          if (redirectCount >= MAX_REDIRECTS) {
            res.resume();
            return reject(new Error(`Troppi redirect (max ${MAX_REDIRECTS})`));
          }
          const redirectUrl = new URL(res.headers.location, url).href;
          res.resume();
          return fetchText(redirectUrl, timeoutMs, redirectCount + 1).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}${res.statusMessage ? " " + res.statusMessage : ""}`));
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        res.on("error", reject);
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout richiesta"));
    });
  });
}

// ---------------------------------------------------------------------------
// HTML parsing (regex-based, no DOM)
// ---------------------------------------------------------------------------

/**
 * Tenta di estrarre dati giocatore da HTML di una pagina Transfermarkt-like.
 * Restituisce un array di oggetti parziali TeamPlayer o [] se non riconosciuto.
 *
 * Pattern cercati:
 *  1. JSON-LD con @type SportsTeam → athlete
 *  2. Tabella classica Transfermarkt con class="items" → righe <tr> con <td>
 *  3. Blocco manualPlayers dal config (gestito esternamente)
 */
function parsePlayersFromHtml(html) {
  const players = [];

  // ---- Pattern 1: JSON-LD SportsTeam ----
  const ldJsonRegex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let ldMatch;
  while ((ldMatch = ldJsonRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(ldMatch[1]);
      const athletes = extractAthletesFromLD(data);
      if (athletes.length) players.push(...athletes);
    } catch {
      // JSON non valido, ignora
    }
  }

  // ---- Pattern 2: Tabella Transfermarkt (items) ----
  if (players.length === 0) {
    const parsed = parseTmTable(html);
    if (parsed.length) players.push(...parsed);
  }

  // ---- Pattern 3: Qualsiasi tabella con righe contenenti numero + nome ----
  if (players.length === 0) {
    const parsed = parseGenericTable(html);
    if (parsed.length) players.push(...parsed);
  }

  return players;
}

function extractAthletesFromLD(data, collected = []) {
  if (!data) return collected;
  if (Array.isArray(data)) {
    for (const item of data) extractAthletesFromLD(item, collected);
    return collected;
  }
  if (typeof data !== "object") return collected;

  if (data["@type"] === "SportsTeam" && Array.isArray(data.athlete)) {
    for (const athlete of data.athlete) {
      if (athlete && athlete.name) {
        collected.push({
          name: athlete.name.trim(),
          number: athlete.jerseyNumber ? Number(athlete.jerseyNumber) : undefined,
          nationality: athlete.nationality || undefined,
          role: athlete.position || undefined,
        });
      }
    }
  }

  for (const value of Object.values(data)) {
    extractAthletesFromLD(value, collected);
  }
  return collected;
}

function parseTmTable(html) {
  // Cerca una tabella con class contenente "items"
  const tableRegex = /<table[^>]*class=["'][^"']*items[^"']*["'][^>]*>([\s\S]*?)<\/table>/gi;
  const players = [];
  let tableMatch;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tbody = tableMatch[1];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tbody)) !== null) {
      const row = rowMatch[1];
      // Salta header
      if (/<th/i.test(row)) continue;

      const cells = [];
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let tdMatch;
      while ((tdMatch = tdRegex.exec(row)) !== null) {
        cells.push(tdMatch[1].replace(/<[^>]+>/g, "").trim());
      }

      if (cells.length >= 2) {
        // Tipica struttura TM: numero | immagine | nome | posizione | età | nazionalità | ...
        const numberCell = cells[0];
        const number = /^\d{1,3}$/.test(numberCell) ? Number(numberCell) : undefined;
        // Cerca nome (cella dopo numero o nelle prime 3 celle)
        let nameCell = "";
        let nameIdx = number !== undefined ? 1 : 0;
        // Salta eventuale cella immagine (vuota dopo strip tag)
        for (let i = nameIdx; i < Math.min(cells.length, nameIdx + 3); i++) {
          if (cells[i] && cells[i].length > 2 && !/^\d+$/.test(cells[i]) && !/^(kg|cm|m|%)/i.test(cells[i])) {
            nameCell = cells[i];
            nameIdx = i;
            break;
          }
        }
        if (!nameCell) continue;

        // Ruolo: cerca nelle celle successive
        let role = "";
        for (let i = nameIdx + 1; i < cells.length; i++) {
          const c = cells[i];
          if (/portiere|difensore|centrocampista|attaccante/i.test(c)) {
            role = c.trim();
            break;
          }
          if (/portiere|difensore|centrocampista|attaccante/i.test(c)) {
            role = c.trim();
            break;
          }
        }

        // Nazionalità: ultima cella testuale prima di valore mercato
        let nationality = "";
        for (let i = cells.length - 1; i > nameIdx; i--) {
          const c = cells[i];
          if (c && !/^[€\d.,mln ]+$/i.test(c) && !/^\d+$/.test(c) && !/^(kg|cm|m)/i.test(c) && c.length < 40) {
            nationality = c;
            break;
          }
        }

        // Market value: cerca pattern € o mln
        let marketValue = "";
        for (const c of cells) {
          if (/[€]|mln|mio/i.test(c)) {
            marketValue = c.replace(/\s+/g, " ").trim();
            break;
          }
        }

        players.push({
          name: nameCell,
          number,
          role: role || undefined,
          nationality: nationality || undefined,
          marketValue: marketValue || undefined,
        });
      }
    }
  }
  return players;
}

function parseGenericTable(html) {
  // Fallback: cerca qualsiasi <tr> con almeno 2 <td>, dove il primo è un numero 1-99
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const players = [];
  let rowMatch;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const row = rowMatch[1];
    if (/<th/i.test(row)) continue;
    const cells = [];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let tdMatch;
    while ((tdMatch = tdRegex.exec(row)) !== null) {
      cells.push(tdMatch[1].replace(/<[^>]+>/g, "").trim());
    }
    if (cells.length >= 2 && /^\d{1,2}$/.test(cells[0])) {
      players.push({
        name: cells[1],
        number: Number(cells[0]),
        role: cells[2] || undefined,
      });
    }
  }
  return players;
}

// ---------------------------------------------------------------------------
// Block detection
// ---------------------------------------------------------------------------

function isBlocked(html) {
  const lower = html.toLowerCase();
  const blockSignals = [
    "captcha",
    "access denied",
    "blocked",
    "cf-challenge",
    "cf-browser-verification",
    "verify you are a human",
    "please enable javascript",
    "attention required!",
    "cloudflare",
    "403 forbidden",
    "ip address has been",
  ];
  return blockSignals.some((signal) => lower.includes(signal));
}

// ---------------------------------------------------------------------------
// Normalizzazione e deduplica
// ---------------------------------------------------------------------------

const ROLE_ORDER = ["Portiere", "Difensore", "Centrocampista", "Attaccante"];

/**
 * Normalizza il nome di un giocatore:
 * - trim e riduzione spazi multipli
 * - title case (prima lettera maiuscola per ogni parola)
 * - rimuove suffissi comuni tra parentesi
 */
function normalizePlayerName(raw) {
  if (!raw) return "";
  let name = raw
    .replace(/\s+/g, " ")
    .replace(/\s*\([^)]*\)\s*/g, " ") // rimuove contenuto tra parentesi
    .replace(/["']/g, "")
    .trim();

  // Title case rispettando prefissi come Di, De, La, Lo, Del, Degli, etc.
  const lowerPrefixes = new Set(["di", "de", "la", "lo", "del", "degli", "dei", "della", "delle", "da", "dal", "dai"]);
  name = name.replace(/\b\w+/g, (word, offset) => {
    const lower = word.toLowerCase();
    if (offset > 0 && lowerPrefixes.has(lower)) return lower;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });

  return name;
}

function normalizeRole(raw) {
  if (!raw) return undefined;
  const r = raw.trim().toLowerCase();
  if (/portiere/i.test(r)) return "Portiere";
  if (/difensore|difesa|terzino|centrale/i.test(r)) return "Difensore";
  if (/centrocampista|centrocampo|mediano|trequartista|ala/i.test(r)) return "Centrocampista";
  if (/attaccante|attacco|punta|centravanti/i.test(r)) return "Attaccante";
  return undefined;
}

function playerIdFromName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sortPlayers(players) {
  return [...players].sort((a, b) => {
    const roleA = ROLE_ORDER.indexOf(a.role || "") !== -1 ? ROLE_ORDER.indexOf(a.role) : ROLE_ORDER.length;
    const roleB = ROLE_ORDER.indexOf(b.role || "") !== -1 ? ROLE_ORDER.indexOf(b.role) : ROLE_ORDER.length;
    if (roleA !== roleB) return roleA - roleB;
    if (a.number && b.number) return a.number - b.number;
    if (a.number) return -1;
    if (b.number) return 1;
    return (a.name || "").localeCompare(b.name || "", "it");
  });
}

function deduplicatePlayers(players) {
  const seen = new Map();
  for (const p of players) {
    const key = p.id || playerIdFromName(p.name);
    if (!seen.has(key)) {
      seen.set(key, p);
    } else {
      // Merge: non sovrascrivere campi esistenti con valori vuoti
      const existing = seen.get(key);
      const merged = { ...p, ...existing };
      for (const field of ["name", "number", "role", "nationality", "birthDate", "marketValue", "imageUrl", "sourceUrl"]) {
        if (!merged[field] && existing[field]) merged[field] = existing[field];
        if (!merged[field] && p[field]) merged[field] = p[field];
      }
      seen.set(key, merged);
    }
  }
  return Array.from(seen.values());
}

function cleanPlayer(player) {
  const cleaned = {};
  if (player.id) cleaned.id = player.id;
  else cleaned.id = playerIdFromName(player.name);
  cleaned.name = normalizePlayerName(player.name) || player.name;
  if (player.number != null) {
    const num = Number(player.number);
    if (Number.isFinite(num) && Number.isInteger(num) && num >= 1 && num <= 99) {
      cleaned.number = num;
    }
  }
  const role = normalizeRole(player.role);
  if (role) cleaned.role = role;
  if (player.nationality && player.nationality.trim()) cleaned.nationality = player.nationality.trim();
  if (player.birthDate && player.birthDate.trim()) cleaned.birthDate = player.birthDate.trim();
  if (player.marketValue && player.marketValue.trim()) cleaned.marketValue = player.marketValue.trim();
  if (player.imageUrl && player.imageUrl.trim()) cleaned.imageUrl = player.imageUrl.trim();
  if (player.sourceUrl && player.sourceUrl.trim()) cleaned.sourceUrl = player.sourceUrl.trim();
  return cleaned;
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function importTeam(config, index, total, options) {
  const { name, sourceUrl, manualPlayers } = config;
  console.log(`\n[${index + 1}/${total}] "${name}"`);

  let players = [];
  let source = "manual";
  let error = null;

  // 1. Try HTTP fetch
  if (sourceUrl) {
    console.log(`  → Richiesta HTTP: ${sourceUrl}`);
    try {
      const html = await fetchText(sourceUrl);
      if (isBlocked(html)) {
        throw new Error("Rilevato blocco (CAPTCHA / Cloudflare / Access Denied)");
      }
      const parsed = parsePlayersFromHtml(html);
      if (parsed.length === 0) {
        throw new Error("HTML ricevuto ma nessun giocatore riconosciuto (formato non supportato)");
      }
      players = parsed;
      source = "http";
      console.log(`  ✓ Estratti ${players.length} giocatori dalla pagina`);
    } catch (err) {
      error = err.message;
      console.log(`  ⚠ Fallimento HTTP: ${err.message}`);
    }
  }

  // 2. Fallback to manualPlayers
  if (players.length === 0 && Array.isArray(manualPlayers) && manualPlayers.length > 0) {
    players = manualPlayers;
    if (error) {
      source = "fallback";
      console.log(`  ↳ Fallback: uso ${players.length} giocatori da manualPlayers`);
    } else {
      source = "manual";
      console.log(`  ✓ Usati ${players.length} giocatori da manualPlayers`);
    }
  }

  if (players.length === 0) {
    console.log(`  ✗ Nessun giocatore disponibile per "${name}"`);
    return { name, players: [], source: "none", error: error || "Nessuna fonte configurata", sourceUrl: sourceUrl || null };
  }

  // 3. Clean, normalize, deduplicate, sort
  const cleaned = players.map(cleanPlayer).filter((p) => p.name);
  const deduped = deduplicatePlayers(cleaned);
  const sorted = sortPlayers(deduped);

  console.log(`  ✓ Finale: ${sorted.length} giocatori (${source})`);
  return { name, players: sorted, source, error, sourceUrl: sourceUrl || null };
}

// ---------------------------------------------------------------------------
// Output generation
// ---------------------------------------------------------------------------

function generateTypeScript(teams, outputPath) {
  const root = path.resolve(__dirname, "..");

  // Normalize team key using same logic as team-names.ts
  const keyCache = {};
  function teamKey(name) {
    if (keyCache[name]) return keyCache[name];
    const key = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\b(a\s*c|a\s*s\s*d|s\s*s\s*d|g\s*s\s*d|u\s*s|f\s*c|s\s*c)\b/g, " ")
      .replace(/\b(calcio|football club)\b/g, " ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    keyCache[name] = key;
    return key;
  }

  const entries = [];
  for (const team of teams) {
    if (!team.players.length) continue;
    const key = teamKey(team.name);
    const playerLines = team.players.map((p) => {
      const fields = [`    id: ${JSON.stringify(p.id)}`, `name: ${JSON.stringify(p.name)}`];
      if (p.number != null) fields.push(`number: ${p.number}`);
      if (p.role) fields.push(`role: ${JSON.stringify(p.role)}`);
      if (p.nationality) fields.push(`nationality: ${JSON.stringify(p.nationality)}`);
      if (p.birthDate) fields.push(`birthDate: ${JSON.stringify(p.birthDate)}`);
      if (p.marketValue) fields.push(`marketValue: ${JSON.stringify(p.marketValue)}`);
      if (p.imageUrl) fields.push(`imageUrl: ${JSON.stringify(p.imageUrl)}`);
      if (p.sourceUrl) fields.push(`sourceUrl: ${JSON.stringify(p.sourceUrl)}`);
      return `  { ${fields.join(", ")} },`;
    });
    entries.push(`  ${JSON.stringify(key)}: [\n${playerLines.join("\n")}\n  ],`);
  }

  const timestamp = new Date().toISOString();
  const sourceCount = teams.filter((t) => t.players.length > 0).length;

  return [
    `/**`,
    ` * src/data/imported-rosters.ts`,
    ` * Generato automaticamente da scripts/import-team-rosters.cjs`,
    ` * Data: ${timestamp}`,
    ` * Squadre importate: ${sourceCount}`,
    ` *`,
    ` * NON MODIFICARE MANUALMENTE — usa lo script per rigenerare.`,
    ` * Per aggiungere giocatori, modifica scripts/rosters-config.json ed esegui:`,
    ` *   npm run import-rosters`,
    ` */`,
    ``,
    `import { TeamPlayer } from "../types";`,
    ``,
    `export const importedTeamRosters: Record<string, TeamPlayer[]> = {`,
    ...entries,
    `};`,
    ``,
  ].join("\n");
}

function generateErrorReport(errors, outputPath) {
  if (errors.length === 0) return null;
  const reportDir = path.dirname(path.resolve(outputPath));
  const reportPath = path.join(path.dirname(reportDir), "scripts", "rosters-errors.log");
  const lines = [
    `Report errori importazione rose — ${new Date().toISOString()}`,
    `============================================================`,
    "",
  ];
  for (const err of errors) {
    lines.push(`Squadra: ${err.name}`);
    lines.push(`Errore:  ${err.error}`);
    if (err.sourceUrl) lines.push(`URL sorgente: ${err.sourceUrl}`);
    if (err.source) lines.push(`Esito:   ${err.source}`);
    lines.push("");
  }
  lines.push(`Suggerimenti:`);
  lines.push(`- Verifica che gli URL in scripts/rosters-config.json siano accessibili`);
  lines.push(`- Usa manualPlayers come fallback per squadre non raggiungibili`);
  lines.push(`- Aggiungi manualPlayers nell'array della squadra interessata`);
  lines.push(`- Esegui di nuovo con: npm run import-rosters`);
  return { path: reportPath, content: lines.join("\n") };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const root = path.resolve(__dirname, "..");
  const args = parseArgs(process.argv);

  if (args.help) {
    console.log(fs.readFileSync(__filename, "utf-8").split("/**")[1].split("*/")[0]);
    return;
  }

  const configPath = path.resolve(args.config || path.join(root, "scripts", "rosters-config.json"));
  const outputPath = path.resolve(args.output || path.join(root, "src", "data", "imported-rosters.ts"));
  const delayMs = args.delay ?? 3000;

  console.log("========================================");
  console.log("  APPrato — Importatore Rose Statico");
  console.log("========================================");
  console.log(`Config:  ${configPath}`);
  console.log(`Output:  ${outputPath}`);
  console.log(`Delay:   ${delayMs}ms`);
  console.log("");

  // Read config
  if (!fs.existsSync(configPath)) {
    console.error(`✗ File di configurazione non trovato: ${configPath}`);
    console.error(`  Crea un file JSON seguendo l'esempio in scripts/rosters-config.example.json`);
    console.error(`  Oppure copia l'esempio: copy scripts\\rosters-config.example.json scripts\\rosters-config.json`);
    process.exit(1);
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch (e) {
    console.error(`✗ Errore nel parsing del file di configurazione: ${e.message}`);
    process.exit(1);
  }

  const teams = Array.isArray(config.teams) ? config.teams : [];
  if (teams.length === 0) {
    console.error("✗ Nessuna squadra configurata. Aggiungi voci all'array 'teams' nel file di configurazione.");
    process.exit(1);
  }

  // Filter by --team
  let selectedTeams = teams;
  if (args.team) {
    selectedTeams = teams.filter((t) => t.name === args.team);
    if (selectedTeams.length === 0) {
      console.error(`✗ Squadra "${args.team}" non trovata nella configurazione.`);
      console.error(`  Squadre disponibili: ${teams.map((t) => t.name).join(", ")}`);
      process.exit(1);
    }
  }

  // Import each team
  const results = [];
  const errors = [];
  const httpErrors = []; // HTTP failures with fallback — logged but not blocking

  for (let i = 0; i < selectedTeams.length; i++) {
    const result = await importTeam(selectedTeams[i], i, selectedTeams.length, { delayMs });
    results.push(result);
    if (result.error) {
      if (result.source === "fallback") {
        // HTTP failure but fallback saved the team — log as warning
        httpErrors.push(result);
      } else if (!result.players.length) {
        // Truly no players
        errors.push(result);
      }
    }
    // Delay between teams
    if (i < selectedTeams.length - 1 && delayMs > 0) {
      console.log(`  ⏳ Pausa ${delayMs}ms...`);
      await sleep(delayMs);
    }
  }

  // Generate output
  const tsContent = generateTypeScript(results, outputPath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, tsContent, "utf-8");
  console.log(`\n✓ File generato: ${path.relative(root, outputPath)}`);

  // Error report (includes HTTP failures with fallback + teams without players)
  const allErrors = [...errors, ...httpErrors];
  if (allErrors.length > 0) {
    const report = generateErrorReport(allErrors, outputPath);
    if (report) {
      fs.mkdirSync(path.dirname(report.path), { recursive: true });
      fs.writeFileSync(report.path, report.content, "utf-8");
      console.log(`⚠ Report errori: ${path.relative(root, report.path)}`);
      if (errors.length > 0) {
        console.log(`  ${errors.length} squadra/e senza giocatori.`);
      }
      if (httpErrors.length > 0) {
        console.log(`  ${httpErrors.length} fallimento/i HTTP con fallback manualPlayers.`);
      }
      console.log(`  Consulta il report per i dettagli.`);
    }
  }

  // Summary
  const withPlayers = results.filter((r) => r.players.length > 0);
  const withoutPlayers = results.filter((r) => r.players.length === 0);
  console.log(`\n========================================`);
  console.log(`  Riepilogo`);
  console.log(`========================================`);
  console.log(`  Squadre processate:          ${results.length}`);
  console.log(`  Con giocatori:               ${withPlayers.length}`);
  console.log(`  Di cui HTTP fallito↳fallback: ${httpErrors.length}`);
  console.log(`  Senza giocatori:             ${withoutPlayers.length}`);
  if (withPlayers.length > 0) {
    const totalPlayers = withPlayers.reduce((sum, r) => sum + r.players.length, 0);
    console.log(`  Giocatori totali:            ${totalPlayers}`);
  }
  console.log("");

  if (withoutPlayers.length > 0) {
    console.log("Come usare manualPlayers:");
    console.log("  1. Apri scripts/rosters-config.json");
    console.log("  2. Per ogni squadra senza giocatori, compila l'array manualPlayers:");
    console.log('     { "id": "nome-cognome", "name": "Nome Cognome", "number": 10, "role": "Centrocampista" }');
    console.log("  3. Esegui di nuovo: npm run import-rosters");
    console.log("");
  }

  console.log("Per integrare le rose nell'app, il file generato è già importato da src/data/teams.ts");
  console.log("Esegui 'npm run typecheck' per verificare la compatibilità.");
}

main().catch((err) => {
  console.error("Errore fatale:", err.message || err);
  process.exit(1);
});