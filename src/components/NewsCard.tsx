import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, radii } from '../theme';
import { NewsArticle } from '../types';

export function NewsCard({ article, onPress, featured = false, style }: { article: NewsArticle; onPress: () => void; featured?: boolean; style?: ViewStyle }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, featured && styles.featured, style, pressed && styles.pressed]}>
      <View style={[styles.imageWrap, featured && styles.imageFeatured]}>
        {article.imageUrl ? <Image source={{ uri: article.imageUrl }} resizeMode="cover" style={styles.image} /> : <LinearGradient colors={['#164466', '#0D2740', '#091827']} style={styles.placeholder}><MaterialCommunityIcons name="newspaper-variant-outline" size={42} color={colors.accent} /></LinearGradient>}
        <View style={styles.categoryPill}><Text style={styles.category}>{article.category}</Text></View>
      </View>
      <View style={styles.body}>
        <Text style={styles.date}>{article.publishedAt}</Text>
        <Text numberOfLines={featured ? 3 : 2} style={[styles.title, featured && styles.titleFeatured]}>{article.title}</Text>
        <Text numberOfLines={featured ? 3 : 2} style={styles.summary}>{article.summary}</Text>
        <View style={styles.readRow}><Text style={styles.readText}>Leggi la notizia</Text><MaterialCommunityIcons name="arrow-right" size={18} color={colors.accent} /></View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineSoft },
  featured: { minHeight: 430 },
  pressed: { opacity: 0.9 },
  imageWrap: { height: 150, backgroundColor: colors.canvasRaised },
  imageFeatured: { height: 220 },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  categoryPill: { position: 'absolute', left: 14, bottom: 14, paddingHorizontal: 11, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: 'rgba(3,15,26,0.82)' },
  category: { color: colors.accentSoft, fontWeight: '900', textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 },
  body: { padding: 17 },
  date: { color: colors.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { color: colors.ink, fontSize: 19, lineHeight: 23, fontWeight: '900', marginTop: 7 },
  titleFeatured: { fontSize: 25, lineHeight: 30 },
  summary: { color: colors.inkSoft, lineHeight: 20, marginTop: 9 },
  readRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 16 },
  readText: { color: colors.accent, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
});
