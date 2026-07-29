import { AppContent } from '../types';

function managedItemCount(content: AppContent): number {
  const liveEvents = content.fixtures.reduce((total, fixture) => total + (fixture.liveEvents?.length ?? 0), 0);
  return content.players.length
    + content.news.length
    + content.media.length
    + content.fixtures.length
    + (content.schedule?.length ?? 0)
    + (content.groupMatches?.length ?? 0)
    + liveEvents;
}

export function adminSuccessMessage(previous: AppContent, next: AppContent): string {
  if (managedItemCount(next) < managedItemCount(previous)) {
    return 'Eliminazione completata e salvata nel cloud.';
  }
  if (managedItemCount(next) > managedItemCount(previous)) {
    return 'Contenuto aggiunto e salvato nel cloud.';
  }
  return 'Modifiche salvate correttamente nel cloud.';
}
