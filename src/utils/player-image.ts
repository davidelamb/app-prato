import { ImageStyle } from 'react-native';
import { Player } from '../types';

type ImageTransform = { imageScale?: number; imagePositionX?: number; imagePositionY?: number };

export function imageTransformStyle(source: ImageTransform): ImageStyle {
  const scale = Math.max(1, Number(source.imageScale) || 1);
  const translateX = Number(source.imagePositionX) || 0;
  const translateY = Number(source.imagePositionY) || 0;
  return { transform: [{ scale }, { translateX }, { translateY }] };
}

export function playerImageStyle(player: Pick<Player, 'imageScale' | 'imagePositionX' | 'imagePositionY'>): ImageStyle {
  return imageTransformStyle(player);
}
