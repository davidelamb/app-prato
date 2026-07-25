import { colors } from '../../theme';
import Svg, { Path } from 'react-native-svg';

type Props = { size?: number; active?: boolean; hovered?: boolean };

export default function NewsIcon({ size = 22, active = false, hovered = false }: Props) {
  const base = hovered ? colors.inkSoft : colors.muted;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Newspaper body */}
      <Path
        d="M2 4h16v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4z"
        fill={active ? colors.blue : base}
      />
      {/* Yellow accent stripe (solo attivo) */}
      {active && (
        <Path
          d="M8 10h8v1.5H8z"
          fill={colors.yellow}
        />
      )}
      {/* Text lines */}
      <Path d="M6 13h8v1H6zm0 3h6v1H6z" fill={active ? colors.paper : base} opacity={active ? 1 : 0.5} />
      {/* Folded corner */}
      <Path
        d="M16 4l4 4h-4V4z"
        fill={active ? colors.accentStrong : base}
        opacity={active ? 1 : 0.6}
      />
    </Svg>
  );
}