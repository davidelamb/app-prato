import { MatchLineup } from '../types';

export type LineupRosterSelection = {
  starters: string[];
  substitutes: string[];
};

function uniqueValidPlayerIds(playerIds: string[], validIds: Set<string>, excludedIds = new Set<string>()): string[] {
  const seen = new Set<string>();
  return playerIds.filter((playerId) => {
    if (!validIds.has(playerId) || excludedIds.has(playerId) || seen.has(playerId)) return false;
    seen.add(playerId);
    return true;
  });
}

/** Riconcilia una formazione salvata con i giocatori presenti nella rosa corrente. */
export function lineupSelectionForRoster(lineup: MatchLineup | undefined, rosterPlayerIds: string[]): LineupRosterSelection {
  const validIds = new Set(rosterPlayerIds);
  const starters = uniqueValidPlayerIds(lineup?.starters.map((item) => item.playerId) ?? [], validIds);
  const substitutes = uniqueValidPlayerIds(
    lineup?.substitutes.map((item) => item.playerId) ?? [],
    validIds,
    new Set(starters),
  );
  return { starters, substitutes };
}
