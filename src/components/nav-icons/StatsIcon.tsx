import { colors } from '../../theme';
import Svg, { Rect } from 'react-native-svg';

type Props = { size?: number; active?: boolean; hovered?: boolean };

const BAR_W = 3.5;
const GAP = 1.5;
const BASE_X = 3;

type BarDef = { h: number; opacity: number };
const bars: BarDef[] = [
  { h: 8,  opacity: 0.6 },
  { h: 13, opacity: 0.75 },
  { h: 6,  opacity: 0.55 },
  { h: 16, opacity: 0.9 },
  { h: 10, opacity: 0.7 },
];

export default function StatsIcon({ size = 22, active = false, hovered = false }: Props) {
  const base = hovered ? colors.inkSoft : colors.muted;

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
            fill={active ? colors.accent : base}
            opacity={active ? bar.opacity : 0.5 + 0.1 * i}
          />
        );
      })}
    </Svg>
  );
}