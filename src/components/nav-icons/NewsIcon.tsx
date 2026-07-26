import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../../theme';

type Props = { size?: number; active?: boolean; hovered?: boolean };

export default function NewsIcon({ size = 22 }: Props) {
  return <MaterialCommunityIcons name="newspaper-variant-outline" size={size} color={colors.accent} />;
}
