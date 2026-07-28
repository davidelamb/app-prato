// Merge generico "seed + salvato" con supporto ai tombstone: un elemento
// il cui id è nella lista dei cancellati non viene mai resuscitato dal
// seed, né incluso se ancora presente nei dati salvati (cancellazione
// esplicita dall'admin). Usato per news, media e altre liste editoriali
// dove — a differenza del calendario/girone — non ha senso "completare"
// automaticamente un elemento mancante: se l'admin l'ha cancellato, deve
// restare cancellato.
export function mergeListWithTombstones<T extends { id: string }>(
  seedList: T[],
  savedList: T[],
  deletedIds: string[],
): T[] {
  const deletedSet = new Set(deletedIds);
  const filteredSeed = seedList.filter((item) => !deletedSet.has(item.id));
  const filteredSaved = savedList.filter((item) => !deletedSet.has(item.id));
  const savedMap = new Map(filteredSaved.map((item) => [item.id, item]));
  const merged = filteredSeed.map((seed) => savedMap.get(seed.id) ?? seed);
  for (const saved of filteredSaved) {
    if (!merged.some((item) => item.id === saved.id)) merged.push(saved);
  }
  return merged;
}
