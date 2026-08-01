import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../../theme';

type Props = { size?: number; active?: boolean; hovered?: boolean };

export default function StatsIcon({ size = 22, active, hovered }: Props) {
  const color = active ? colors.paper : hovered ? colors.accent : colors.accentStrong;
  return <MaterialCommunityIcons name="chart-box-outline" size={size} color={color} />;
}
