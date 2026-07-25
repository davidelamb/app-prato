import { colors } from '../../theme';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

type Props = { size?: number; active?: boolean; hovered?: boolean };

export default function MediaIcon({ size = 22, active = false, hovered = false }: Props) {
  const base = hovered ? colors.inkSoft : colors.muted;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Outer rounded rect */}
      <Path
        d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
        fill={base}
      />
      {active ? (
        <>
          <Defs>
            <LinearGradient id="mediaGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.accent} />
              <Stop offset="1" stopColor={colors.accentStrong} />
            </LinearGradient>
          </Defs>
          <Path
            d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
            fill="url(#mediaGrad)"
          />
        </>
      ) : null}
      {/* Play triangle */}
      <Path
        d="M9.5 8l7 4-7 4V8z"
        fill={active ? colors.paper : base}
        opacity={active ? 1 : 0.5}
      />
    </Svg>
  );
}