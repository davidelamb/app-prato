import { Player } from '../types';

type PlayerPhotoFallback = Pick<Player, 'imageUrl' | 'imageSourceUrl' | 'imageScale' | 'imagePositionX' | 'imagePositionY'>;

const localPucci = require('../../assets/players/pucci.jpg') as { uri: string };
const localVerde = require('../../assets/players/verde.jpg') as { uri: string };

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
    imageUrl: localPucci.uri,
    imageSourceUrl: 'Fotografia fornita dall\'utente',
    imageScale: 1.05,
    imagePositionY: -2,
  },
  verde: {
    imageUrl: localVerde.uri,
    imageSourceUrl: 'Fotografia fornita dall\'utente',
    imageScale: 1.05,
    imagePositionY: -2,
  },
};
