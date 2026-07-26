import { ImageStyle } from 'react-native';
import { Player } from '../types';

type ImageTransform = { imageScale?: number; imagePositionX?: number; imagePositionY?: number };

// Crop coordinates are stored in the admin editor's reference frame so the
// same focal point can be reproduced in cards and profiles of any size.
const EDITOR_FRAME_WIDTH = 260;
const EDITOR_FRAME_HEIGHT = 310;

export function imageTransformStyle(source: ImageTransform): ImageStyle {
  const scale = Math.max(1, Number(source.imageScale) || 1);
  const translateX = Number(source.imagePositionX) || 0;
  const translateY = Number(source.imagePositionY) || 0;
  return {
    transform: [
      { scale },
      { translateX: `${(translateX / EDITOR_FRAME_WIDTH) * 100}%` },
      { translateY: `${(translateY / EDITOR_FRAME_HEIGHT) * 100}%` },
    ],
  };
}

export function playerImageStyle(player: Pick<Player, 'imageScale' | 'imagePositionX' | 'imagePositionY'>): ImageStyle {
  return imageTransformStyle(player);
}
