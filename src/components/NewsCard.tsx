import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '../theme';
import { NewsArticle } from '../types';

export function NewsCard({ article, onPress }: { article: NewsArticle; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      {article.imageUrl ? <Image source={{ uri: article.imageUrl }} style={styles.image} /> : null}
      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={styles.category}>{article.category}</Text>
          <Text style={styles.date}>{article.publishedAt}</Text>
        </View>
        <Text style={styles.title}>{article.title}</Text>
        <Text numberOfLines={3} style={styles.summary}>{article.summary}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  image: { width: '100%', height: 180, backgroundColor: colors.sky },
  body: { padding: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  category: { color: colors.blue, fontWeight: '900', textTransform: 'uppercase', fontSize: 12 },
  date: { color: colors.muted, fontSize: 12 },
  title: { color: colors.ink, fontSize: 20, lineHeight: 24, fontWeight: '900', marginTop: 8 },
  summary: { color: colors.inkSoft, lineHeight: 20, marginTop: 8 },
});
