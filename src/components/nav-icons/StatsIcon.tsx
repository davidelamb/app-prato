import { colors } from '../../theme';
import Svg, { Rect } from 'react-native-svg';

type Props = { size?: number; active?: boolean; hovered?: boolean };

const BAR_W = 3.5;
const GAP = 1.5;
const BASE_X = 3;

type BarDef = { h: number; color: string; activeColor: string };
const bars: BarDef[] = [
  { h: 8,  color: colors.live,   activeColor: colors.live },    // rosso
  { h: 13, color: colors.success, activeColor: colors.success }, // verde
  { h: 6,  color: colors.live,   activeColor: colors.live },    // rosso
  { h: 16, color: colors.success, activeColor: colors.success }, // verde
  { h: 10, color: colors.live,   activeColor: colors.live },    // rosso
];

export default function StatsIcon({ size = 22, active = false, hovered = false }: Props) {
  const base = hovered ? colors.inkSoft : colors.muted;
  const maxH = Math.max(...bars.map((b) => b.h));

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {bars.map((bar, i) => {
        const x = BASE_X + i * (BAR_W + GAP);
        const y = 22 - bar.h - 2;
        return (
          <Rect
            key={i}
            x={x}
            y={y}
            width={BAR_W}
            height={bar.h}
            rx={1.5}
            fill={active ? bar.activeColor : base}
            opacity={active ? 1 : 0.5 + 0.1 * i}
          />
        );
      })}
    </Svg>
  );
}