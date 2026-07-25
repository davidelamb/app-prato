import { colors } from '../../theme';
import Svg, { Circle, Path } from 'react-native-svg';

type Props = { size?: number; active?: boolean; hovered?: boolean };

export default function LiveIcon({ size = 22 }: Props) {
  const base = colors.accent;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Onda esterna sinistra */}
      <Path
        d="M4 14.5a8 8 0 0 1 0-5"
        stroke={base}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.7}
      />
      {/* Onda esterna destra */}
      <Path
        d="M20 14.5a8 8 0 0 0 0-5"
        stroke={base}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.7}
      />
      {/* Onda media sinistra */}
      <Path
        d="M6.5 13.5a5.5 5.5 0 0 1 0-3"
        stroke={base}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.65}
      />
      {/* Onda media destra */}
      <Path
        d="M17.5 13.5a5.5 5.5 0 0 0 0-3"
        stroke={base}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.65}
      />
      {/* Cerchio di sfondo */}
      <Circle
        cx="12"
        cy="12"
        r="7"
        fill="transparent"
        stroke={base}
        strokeWidth={1.5}
        opacity={0.65}
      />
      {/* Animella interna */}
      <Circle
        cx="12"
        cy="12"
        r="3.5"
        fill={base}
        stroke={base}
        strokeWidth={1.8}
        opacity={1}
      />
      {/* Pallino LIVE */}
      <Circle
        cx="12"
        cy="12"
        r="2"
        fill={colors.paper}
      />
    </Svg>
  );
}