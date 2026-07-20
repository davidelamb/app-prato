import { ImageStyle } from 'react-native';
import { Player } from '../types';

export function playerImageStyle(player: Pick<Player, 'imageScale' | 'imagePositionY'>): ImageStyle {
  const scale = Math.max(1, Number(player.imageScale) || 1);
  const translateY = Number(player.imagePositionY) || 0;
  return { transform: [{ scale }, { translateY }] };
}
