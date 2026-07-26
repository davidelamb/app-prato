import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../../theme';

type Props = { size?: number; active?: boolean; hovered?: boolean };

export default function MediaIcon({ size = 22 }: Props) {
  return <MaterialCommunityIcons name="play-box-multiple-outline" size={size} color={colors.accent} />;
}
