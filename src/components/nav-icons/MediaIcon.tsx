import { colors } from '../../theme';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

type Props = { size?: number; active?: boolean; hovered?: boolean };

export default function MediaIcon({ size = 22 }: Props) {
  const base = colors.accent;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Outer rounded rect */}
      <Path
        d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
        fill={base}
      />
      {/* Play triangle */}
      <Path
        d="M9.5 8l7 4-7 4V8z"
        fill={colors.paper}
      />
    </Svg>
  );
}