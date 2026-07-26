import { Image } from 'react-native';

import { Player } from '../types';

type PlayerPhotoFallback = Pick<Player, 'imageUrl' | 'imageSourceUrl' | 'imageScale' | 'imagePositionX' | 'imagePositionY'>;

type StaticAsset = number | string | { uri?: string };
const localPhotoUri = (source: StaticAsset): string => {
  if (typeof source === 'string') return source;
  if (typeof source === 'object' && source?.uri) return source.uri;
  const resolver = (Image as typeof Image & { resolveAssetSource?: (asset: number) => { uri?: string } }).resolveAssetSource;
  return resolver?.(source)?.uri ?? '';
};
const localPucci = localPhotoUri(require('../../assets/players/pucci.jpg'));
const localVerde = localPhotoUri(require('../../assets/players/verde.jpg'));
const localBenedetti = localPhotoUri(require('../../assets/players/benedetti-user.jpg'));
const localEleuteri = localPhotoUri(require('../../assets/players/eleuteri-user.jpg'));
const localBajic = localPhotoUri(require('../../assets/players/bajic-user.jpg'));

export const playerPhotoFallbacks: Record<string, PlayerPhotoFallback> = {
  biguzzi: {
    imageUrl: 'https://www.sportdiprato.it/wp-content/uploads/2026/07/riccardo-biguzzi.png',
    imageSourceUrl: 'https://www.sportdiprato.it/sport/calcio/dilettanti/15965-ac-prato-ufficiale-laccordo-con-il-classe-2007-biguzzi',
    imageScale: 1.18,
    imagePositionY: -7,
  },
  limberti: {
    imageUrl: 'https://www.acprato.it/site/wp-content/uploads/ROSA_23-24_15.jpg',
    imageSourceUrl: 'https://www.acprato.it/site/player/francesco-limberti/',
    imageScale: 1.14,
    imagePositionY: -6,
  },
  pucci: {
    imageUrl: localPucci,
    imageSourceUrl: 'Fotografia fornita dall\'utente',
    imageScale: 1.05,
    imagePositionY: -2,
  },
  verde: {
    imageUrl: localVerde,
    imageSourceUrl: 'Fotografia fornita dall\'utente',
    imageScale: 1.05,
    imagePositionY: -2,
  },
  benedetti: {
    imageUrl: localBenedetti,
    imageSourceUrl: 'Fotografia fornita dall\'utente',
    imageScale: 1.02,
    imagePositionY: 12,
  },
  eleuteri: {
    imageUrl: localEleuteri,
    imageSourceUrl: 'Fotografia fornita dall\'utente',
    imageScale: 1.02,
    imagePositionY: 10,
  },
  bajic: {
    imageUrl: localBajic,
    imageSourceUrl: 'Fotografia fornita dall\'utente',
    imageScale: 1.04,
    imagePositionY: 42,
  },
};
