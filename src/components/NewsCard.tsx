import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, radii } from '../theme';
import { NewsArticle } from '../types';

export function NewsCard({
  article,
  onPress,
  style,
}: {
  article: NewsArticle;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
      <View style={styles.thumbWrap}>
        {article.imageUrl ? (
          <Image source={{ uri: article.imageUrl }} resizeMode="cover" style={styles.thumb} />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <MaterialCommunityIcons name="newspaper-variant-outline" size={34} color={colors.accent} />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.category}>{article.category}</Text>
        <Text numberOfLines={2} style={styles.title}>{article.title}</Text>
        <Text numberOfLines={2} style={styles.summary}>{article.summary}</Text>
        <Text style={styles.date}>{article.publishedAt}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.88 },
  card: {
    minHeight: 126,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  thumbWrap: { width: 116, height: 100, borderRadius: radii.sm, overflow: 'hidden', backgroundColor: colors.surfaceSoft },
  thumb: { width: '100%', height: '100%' },
  thumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  body: { flex: 1, minWidth: 0 },
  category: { color: colors.accentStrong, fontSize: 10, fontWeight: '900', letterSpacing: 0.9, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 17, lineHeight: 21, fontWeight: '900', marginTop: 4 },
  summary: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 5 },
  date: { color: colors.mutedDark, fontSize: 10, fontWeight: '700', marginTop: 7, textTransform: 'uppercase' },
});
