import { useState } from 'react';
import { Image, ImageStyle, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { resolveTeamLogo } from '../data/team-logos';
import { colors } from '../theme';

interface TeamLogoProps {
  /** Nome della squadra (qualsiasi variante: canonico o alias) */
  name: string;
  /** Dimensione del logo (larghezza e altezza). Default: 28 */
  size?: number;
  /** Stile aggiuntivo per il contenitore */
  style?: ViewStyle;
  /** Stile aggiuntivo per l'immagine (solo se logo visibile) */
  imageStyle?: ImageStyle;
}

/** Genera un colore deterministico dall'hash del nome squadra */
function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = [
    '#1D4ED8', '#B91C1C', '#047857', '#7C3AED', '#0D9488',
    '#D97706', '#DC2626', '#2563EB', '#059669', '#9333EA',
    '#0891B2', '#CA8A04', '#DB2777', '#4F46E5', '#16A34A',
    '#C2410C', '#6366F1', '#0E7490', '#A21CAF', '#15803D',
    '#E11D48', '#7E22CE', '#0284C7', '#65A30D',
  ];
  return palette[Math.abs(hash) % palette.length];
}

export function TeamLogo({ name, size = 28, style, imageStyle }: TeamLogoProps) {
  const info = resolveTeamLogo(name);
  const [errored, setErrored] = useState(false);

  // Logo disponibile e non ancora fallito
  if (info?.logoSource && !errored) {
    return (
      <View
        style={[
          styles.wrapper,
          { width: size, height: size, borderRadius: size * 0.3 },
          style,
        ]}
      >
        <Image
          source={info.logoSource}
          style={[
            { width: size, height: size, borderRadius: size * 0.3 },
            imageStyle,
          ]}
          accessibilityLabel={`Stemma ${name}`}
          resizeMode="contain"
          onError={() => setErrored(true)}
        />
      </View>
    );
  }

  // Fallback: iniziale in un cerchio colorato
  const initial = name.trim().charAt(0).toUpperCase();
  const bgColor = hashColor(name);

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size * 0.3, backgroundColor: bgColor },
        style,
      ]}
      accessibilityLabel={`Stemma ${name}`}
      accessibilityRole="image"
    >
      <Text
        style={[
          styles.initial,
          { fontSize: size * 0.48, lineHeight: size * 0.52 },
        ]}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: colors.paper,
    fontWeight: '900',
    textAlign: 'center',
  },
});
