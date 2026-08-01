import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../../theme';

type Props = { size?: number; active?: boolean; hovered?: boolean };

export default function LiveIcon({ size = 22, active, hovered }: Props) {
  const color = active ? colors.paper : hovered ? colors.accent : colors.accentStrong;
  return <MaterialCommunityIcons name="access-point" size={size} color={color} />;
}
