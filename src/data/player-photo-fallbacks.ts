import { Player } from '../types';

type PlayerPhotoFallback = Pick<Player, 'imageUrl' | 'imageSourceUrl' | 'imageScale' | 'imagePositionX' | 'imagePositionY'>;

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
  verde: {
    imageUrl: 'https://www.sportdiprato.it/wp-content/uploads/2026/02/verde-altopascio.jpg',
    imageSourceUrl: 'https://www.sportdiprato.it/sport/calcio/dilettanti/15814-ac-prato-in-attacco-viene-confermato-francesco-verde',
    imageScale: 1.28,
    imagePositionY: -8,
  },
};
