import { importedTeamRosters } from './imported-rosters';
import { teamLogos } from './team-logos';
import { serieDTeams2026 } from './season-2026-27';
import { Player, Team, TeamPlayer } from '../types';
import { normalizeTeamName } from '../utils/team-names';

function teamId(name: string): string {
  return normalizeTeamName(name).replace(/\s+/g, '-');
}

function teamRosterKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(a\s*c|a\s*s\s*d|s\s*s\s*d|g\s*s\s*d|u\s*s|f\s*c|s\s*c)\b/g, ' ')
    .replace(/\b(calcio|football club)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function pratoPlayer(player: Player): TeamPlayer {
  return {
    id: player.id,
    name: player.name,
    number: player.number,
    role: player.role,
    nationality: player.nationality,
    birthDate: player.birthDate,
    marketValue: player.marketValue,
    imageUrl: player.imageUrl,
    sourceUrl: player.imageSourceUrl,
  };
}

/**
 * Fusione conservativa: i giocatori importati non sovrascrivono
 * campi già popolati con valori vuoti.
 */
function mergeTeamPlayer(base: TeamPlayer, imported: TeamPlayer): TeamPlayer {
  return {
    id: base.id || imported.id,
    name: base.name || imported.name,
    number: base.number ?? imported.number,
    role: base.role || imported.role,
    nationality: base.nationality || imported.nationality,
    birthDate: base.birthDate || imported.birthDate,
    marketValue: base.marketValue || imported.marketValue,
    imageUrl: base.imageUrl || imported.imageUrl,
    sourceUrl: base.sourceUrl || imported.sourceUrl,
  };
}

export function defaultTeams(players: Player[]): Team[] {
  return serieDTeams2026.map((name) => {
    const isPrato = name === 'AC Prato';
    const pratoPlayers = isPrato ? players.map(pratoPlayer) : [];

    // Cerca rose importate per questa squadra
    const key = teamRosterKey(name);
    const importedPlayers = importedTeamRosters[key] ?? [];

    if (isPrato) {
      // AC Prato: i giocatori derivano sempre da content.players.
      // Se ci sono anche importedPlayers, fai merge conservativo
      // (non perdere dati Prato, non sovrascrivere con valori vuoti)
      if (importedPlayers.length === 0) {
        return {
          id: teamId(name),
          name,
          normalizedName: normalizeTeamName(name),
          stadium: 'Stadio Lungobisenzio',
          sourceUrl: teamLogos[name]?.sourceUrl,
          players: pratoPlayers,
        };
      }
      const pratoById = new Map(pratoPlayers.map((p) => [p.id, p]));
      const mergedPlayers = importedPlayers.map((imported) => {
        const existing = pratoById.get(imported.id);
        return existing ? mergeTeamPlayer(existing, imported) : imported;
      });
      // Aggiungi eventuali giocatori Prato non presenti nell'import
      for (const pratoP of pratoPlayers) {
        if (!mergedPlayers.some((p) => p.id === pratoP.id)) {
          mergedPlayers.push(pratoP);
        }
      }
      return {
        id: teamId(name),
        name,
        normalizedName: normalizeTeamName(name),
        stadium: 'Stadio Lungobisenzio',
        sourceUrl: teamLogos[name]?.sourceUrl,
        players: mergedPlayers,
      };
    }

    // Altre squadre: usa importedPlayers se disponibili, altrimenti vuoto
    return {
      id: teamId(name),
      name,
      normalizedName: normalizeTeamName(name),
      sourceUrl: teamLogos[name]?.sourceUrl,
      players: importedPlayers,
    };
  });
}
