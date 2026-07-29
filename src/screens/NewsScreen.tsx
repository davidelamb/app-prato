import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NewsCard } from '../components/NewsCard';
import { colors } from '../theme';
import { AppContent, NewsArticle } from '../types';

export function NewsScreen({ content, wide, onNews }: { content: AppContent; wide: boolean; onNews: (item: NewsArticle) => void }) {
  const [visibleCount, setVisibleCount] = useState(3);
  const sortedNews = useMemo(() => [...content.news].sort((a, b) => publishedTimestamp(b.publishedAt) - publishedTimestamp(a.publishedAt)), [content.news]);
  const visibleNews = sortedNews.slice(0, visibleCount);
  const hasMore = visibleCount < sortedNews.length;

  return (
    <View style={styles.stack}>
      <Header />
      {visibleNews.length ? (
        <View style={[styles.grid, wide && styles.gridWide]}>
          {visibleNews.map((article) => <NewsCard key={article.id} article={article} onPress={() => onNews(article)} style={wide ? styles.half : undefined} />)}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="newspaper-variant-outline" size={38} color={colors.mutedDark} />
          <Text style={styles.emptyTitle}>Nessuna news disponibile</Text>
          <Text style={styles.emptyCopy}>Le prossime notizie appariranno qui.</Text>
        </View>
      )}
      {hasMore ? (
        <Pressable onPress={() => setVisibleCount((count) => count + 5)} style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}>
          <Text style={styles.moreText}>Altre news</Text>
          <MaterialCommunityIcons name="chevron-down" size={21} color={colors.paper} />
        </Pressable>
      ) : null}
    </View>
  );
}
function Header() { return <View><Text style={styles.eyebrow}>NEWS</Text><Text style={styles.title}>News AC Prato</Text><Text style={styles.copy}>Gli ultimi aggiornamenti biancazzurri, in ordine cronologico.</Text></View>; }

const monthIndexes: Record<string, number> = { GEN: 0, FEB: 1, MAR: 2, APR: 3, MAG: 4, GIU: 5, LUG: 6, AGO: 7, SET: 8, OTT: 9, NOV: 10, DIC: 11 };
function publishedTimestamp(value: string) {
  const [day, month, year] = value.trim().split(/\s+/);
  const monthIndex = monthIndexes[month?.toUpperCase() ?? ''];
  return Number.isFinite(Number(day)) && monthIndex !== undefined && Number.isFinite(Number(year))
    ? new Date(Number(year), monthIndex, Number(day)).getTime()
    : 0;
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  eyebrow: { color: colors.yellow, fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: colors.ink, fontSize: 32, lineHeight: 38, fontWeight: '900', marginTop: 4 },
  copy: { color: colors.muted, fontSize: 14, lineHeight: 20, fontWeight: '700', marginTop: 6 },
  grid: { gap: 12 },
  gridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  half: { width: '49%' },
  emptyState: { alignItems: 'center', paddingVertical: 42, gap: 8 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  emptyCopy: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  moreButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 18, borderRadius: 14, backgroundColor: colors.accentStrong },
  moreText: { color: colors.paper, fontSize: 15, fontWeight: '900' },
  pressed: { opacity: 0.86 },
});
