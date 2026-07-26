import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../../theme';

type Props = { size?: number; active?: boolean; hovered?: boolean };

export default function LiveIcon({ size = 22 }: Props) {
  return <MaterialCommunityIcons name="access-point" size={size} color={colors.live} />;
}
