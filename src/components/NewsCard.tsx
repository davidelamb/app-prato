import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, radii } from '../theme';
import { NewsArticle } from '../types';

export function NewsCard({
  article,
  onPress,
  featured = false,
  style,
}: {
  article: NewsArticle;
  onPress: () => void;
  featured?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  if (featured) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.featured, style, pressed && styles.pressed]}>
        {article.imageUrl ? (
          <Image source={{ uri: article.imageUrl }} resizeMode="cover" style={styles.featuredImage} />
        ) : (
          <LinearGradient colors={[colors.accentStrong, colors.accent, colors.blue]} style={styles.placeholder}>
            <MaterialCommunityIcons name="newspaper-variant-outline" size={60} color={colors.paper} />
          </LinearGradient>
        )}
        <LinearGradient colors={['transparent', 'rgba(5, 24, 42, 0.92)']} style={styles.featuredShade} />
        <View style={styles.featuredBody}>
          <Text style={styles.featuredCategory}>{article.category}</Text>
          <Text numberOfLines={3} style={styles.featuredTitle}>{article.title}</Text>
          <View style={styles.featuredMetaRow}>
            <Text style={styles.featuredMeta}>{article.publishedAt}</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color={colors.yellow} />
          </View>
        </View>
      </Pressable>
    );
  }

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
  featured: {
    minHeight: 330,
    overflow: 'hidden',
    borderRadius: radii.lg,
    backgroundColor: colors.accentStrong,
    borderWidth: 1,
    borderColor: colors.line,
  },
  featuredImage: { width: '100%', height: 330 },
  placeholder: { height: 330, alignItems: 'center', justifyContent: 'center' },
  featuredShade: { ...StyleSheet.absoluteFillObject },
  featuredBody: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20 },
  featuredCategory: { color: colors.yellow, fontSize: 11, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
  featuredTitle: { color: colors.paper, fontSize: 28, lineHeight: 32, fontWeight: '900', letterSpacing: -0.5, marginTop: 6 },
  featuredMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 13 },
  featuredMeta: { color: '#D9E8F2', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
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
