import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '../theme';
import { flagFor, nationalityList } from '../utils/nationality';

function NationFlag({ nation }: { nation: string }) {
  if (nation === 'Italia') {
    return (
      <View accessibilityLabel="Bandiera Italia" style={styles.flagFrame}>
        <View style={[styles.verticalStripe, { backgroundColor: '#009246' }]} />
        <View style={[styles.verticalStripe, { backgroundColor: '#FFFFFF' }]} />
        <View style={[styles.verticalStripe, { backgroundColor: '#CE2B37' }]} />
      </View>
    );
  }
  if (nation === 'Marocco') {
    return (
      <View accessibilityLabel="Bandiera Marocco" style={[styles.flagFrame, styles.moroccoFlag]}>
        <Text style={styles.moroccoStar}>★</Text>
      </View>
    );
  }
  if (nation === 'Montenegro') {
    return (
      <View accessibilityLabel="Bandiera Montenegro" style={[styles.flagFrame, styles.montenegroFlag]}>
        <View style={styles.montenegroEmblem}>
          <Text style={styles.montenegroMark}>◆</Text>
        </View>
      </View>
    );
  }
  return <Text style={styles.flags}>{flagFor(nation) ?? '🌐'}</Text>;
}

export function NationalityBadge({ value, compact = false }: { value?: string | string[]; compact?: boolean }) {
  const nations = nationalityList(value);
  const visibleNations = nations.length ? nations : ['Italia'];

  return (
    <View style={[styles.badge, compact && styles.badgeCompact]}>
      <View style={styles.flagRow}>
        {visibleNations.map((nation) => <NationFlag key={nation} nation={nation} />)}
      </View>
      {!compact ? <Text numberOfLines={1} style={styles.label}>{visibleNations.join(' / ')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    maxWidth: 150,
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  badgeCompact: {
    minWidth: 34,
    minHeight: 28,
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  flagRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  flagFrame: {
    width: 22,
    height: 15,
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(2, 28, 81, 0.24)',
  },
  verticalStripe: { flex: 1 },
  moroccoFlag: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#C1272D' },
  moroccoStar: { color: '#006233', fontSize: 10, lineHeight: 11, fontWeight: '900' },
  montenegroFlag: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C40308',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
  },
  montenegroEmblem: {
    width: 7,
    height: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: '#D4AF37',
  },
  montenegroMark: { color: '#1F4E79', fontSize: 5, lineHeight: 6 },
  flags: { fontSize: 16, lineHeight: 19 },
  label: { flexShrink: 1, color: colors.ink, fontSize: 10, fontWeight: '800' },
});
