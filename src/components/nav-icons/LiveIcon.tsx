import { colors } from '../../theme';
import Svg, { Circle, Path } from 'react-native-svg';

type Props = { size?: number; active?: boolean; hovered?: boolean };

export default function LiveIcon({ size = 22, active = false, hovered = false }: Props) {
  const base = hovered ? colors.inkSoft : colors.muted;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Antenna base */}
      <Path
        d="M12 18v3m0-3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2m0 8a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2m0 0a4 4 0 0 1 4 4v1m-4-5a4 4 0 0 0-4 4v1"
        fill={active ? colors.accentStrong : base}
      />
      {/* Radio waves */}
      <Path
        d="M7 8a5 5 0 0 1 10 0"
        stroke={active ? colors.success : base}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M5 5a7 7 0 0 1 14 0"
        stroke={active ? colors.live : base}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        opacity={active ? 1 : 0.5}
      />
      {/* Live dot (solo attivo) */}
      {active && (
        <Circle cx="12" cy="9" r="2.5" fill={colors.live} />
      )}
      {!active && (
        <Circle cx="12" cy="9" r="2" fill={base} opacity={0.6} />
      )}
    </Svg>
  );
}