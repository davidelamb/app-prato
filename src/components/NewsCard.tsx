import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, radii } from '../theme';
import { NewsArticle } from '../types';

export function NewsCard({ article, onPress, featured = false, style }: { article: NewsArticle; onPress: () => void; featured?: boolean; style?: ViewStyle }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, featured && styles.featured, style, pressed && styles.pressed]}>
      <View style={[styles.imageWrap, featured && styles.imageFeatured]}>
        {article.imageUrl ? <Image source={{ uri: article.imageUrl }} resizeMode="cover" style={styles.image} /> : <LinearGradient colors={[colors.navy, '#123A64', colors.accentStrong]} style={styles.placeholder}><MaterialCommunityIcons name="newspaper-variant-outline" size={46} color={colors.paper} /></LinearGradient>}
        {featured ? <LinearGradient colors={['transparent', 'rgba(7,20,38,0.94)']} style={styles.imageShade} /> : null}
        <View style={styles.categoryPill}><Text style={styles.category}>{article.category}</Text></View>
        {featured ? <View style={styles.featuredCopy}><Text numberOfLines={3} style={styles.featuredTitle}>{article.title}</Text><Text style={styles.featuredDate}>{article.publishedAt}</Text></View> : null}
      </View>
      {!featured ? <View style={styles.body}>
        <Text style={styles.date}>{article.publishedAt}</Text>
        <Text numberOfLines={3} style={styles.title}>{article.title}</Text>
        <Text numberOfLines={2} style={styles.summary}>{article.summary}</Text>
        <View style={styles.readRow}><Text style={styles.readText}>Apri articolo</Text><MaterialCommunityIcons name="arrow-right" size={18} color={colors.accentStrong} /></View>
      </View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineSoft, shadowColor: colors.shadow, shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  featured: { minHeight: 430, backgroundColor: colors.navy },
  pressed: { opacity: 0.91, transform: [{ scale: 0.995 }] },
  imageWrap: { height: 168, backgroundColor: colors.canvasRaised },
  imageFeatured: { height: 430 },
  image: { width: '100%', height: '100%' },
  imageShade: { ...StyleSheet.absoluteFillObject },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  categoryPill: { position: 'absolute', left: 16, top: 16, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.xs, backgroundColor: colors.accentStrong },
  category: { color: colors.paper, fontWeight: '900', textTransform: 'uppercase', fontSize: 10, letterSpacing: 1.1 },
  featuredCopy: { position: 'absolute', left: 20, right: 20, bottom: 22 },
  featuredTitle: { color: colors.paper, fontSize: 28, lineHeight: 32, fontWeight: '900', letterSpacing: -0.6 },
  featuredDate: { color: colors.accentSoft, fontSize: 11, fontWeight: '800', marginTop: 10, textTransform: 'uppercase' },
  body: { padding: 18 },
  date: { color: colors.accentStrong, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.9 },
  title: { color: colors.ink, fontSize: 20, lineHeight: 24, fontWeight: '900', marginTop: 7, letterSpacing: -0.25 },
  summary: { color: colors.inkSoft, lineHeight: 20, marginTop: 9 },
  readRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 17, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.lineSoft },
  readText: { color: colors.accentStrong, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.7 },
});
