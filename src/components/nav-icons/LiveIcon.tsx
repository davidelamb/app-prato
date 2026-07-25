import { colors } from '../../theme';
import Svg, { Circle, Path } from 'react-native-svg';

type Props = { size?: number; active?: boolean; hovered?: boolean };

export default function LiveIcon({ size = 22, active = false, hovered = false }: Props) {
  const base = hovered ? colors.inkSoft : colors.muted;
  const mainColor = active ? colors.accent : base;
  const glowColor = active ? colors.accentSoft : base;
  const dotColor = active ? colors.live : colors.muted;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Onda esterna sinistra */}
      <Path
        d="M4 14.5a8 8 0 0 1 0-5"
        stroke={active ? colors.accentStrong : base}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={active ? 0.7 : 0.35}
      />
      {/* Onda esterna destra */}
      <Path
        d="M20 14.5a8 8 0 0 0 0-5"
        stroke={active ? colors.accentStrong : base}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={active ? 0.7 : 0.35}
      />
      {/* Onda media sinistra */}
      <Path
        d="M6.5 13.5a5.5 5.5 0 0 1 0-3"
        stroke={active ? colors.accent : base}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={active ? 0.85 : 0.5}
      />
      {/* Onda media destra */}
      <Path
        d="M17.5 13.5a5.5 5.5 0 0 0 0-3"
        stroke={active ? colors.accent : base}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={active ? 0.85 : 0.5}
      />
      {/* Cerchio di sfondo */}
      <Circle
        cx="12"
        cy="12"
        r="7"
        fill={active ? colors.accentSoft : 'transparent'}
        stroke={active ? colors.accent : base}
        strokeWidth={1.5}
        opacity={active ? 0.7 : 0.45}
      />
      {/* Animella interna */}
      <Circle
        cx="12"
        cy="12"
        r="3.5"
        fill={active ? colors.accent : 'transparent'}
        stroke={active ? colors.accentStrong : base}
        strokeWidth={1.8}
        opacity={active ? 1 : 0.5}
      />
      {/* Pallino LIVE */}
      <Circle
        cx="12"
        cy="12"
        r="2"
        fill={dotColor}
      />
    </Svg>
  );
}