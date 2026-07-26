import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../../theme';

type Props = { size?: number; active?: boolean; hovered?: boolean };

export default function StatsIcon({ size = 22 }: Props) {
  return <MaterialCommunityIcons name="chart-box-outline" size={size} color={colors.accent} />;
}
