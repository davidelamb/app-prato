import { Image, StyleSheet, Text, View } from 'react-native';

import { teamCrests } from '../data/team-crests';
import { colors } from '../theme';

const palette = ['#005A9C', '#0789D4', '#22AD78', '#E94C4C', '#FFC400', '#7C5CBF', '#C2410C', '#0F766E', '#BE185D', '#4338CA'];
const prefixes = /^(u\.?s\.?d?\.?|a\.?c\.?|f\.?c\.?|s\.?c\.?|a\.?s\.?d?\.?|g\.?s\.?d?\.?|polisportiva|unione sportiva|cittÃ  di|città di)\s+/i;

function initials(name: string): string {
  const stripped = name.replace(prefixes, '').replace(prefixes, '').trim() || name;
  const words = stripped.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return stripped.slice(0, 2).toUpperCase();
}

function hashColor(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  return palette[hash % palette.length];
}

export function TeamBadge({ name, size = 32 }: { name: string; size?: number }) {
  const isPrato = /^(AC )?Prato$/i.test(name);
  const crest = teamCrests[name];
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (crest) return <Image source={{ uri: crest }} resizeMode="contain" style={[dimension, styles.crestImage]} />;

  return <View style={[dimension, styles.badge, { backgroundColor: isPrato ? colors.accentStrong : hashColor(name) }]}>
    <Text style={[styles.text, { fontSize: size * 0.36 }]}>{initials(name)}</Text>
  </View>;
}

const styles = StyleSheet.create({
  crestImage: { backgroundColor: colors.paper },
  badge: { alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.paper, fontWeight: '900' },
});
