import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NewsCard } from '../components/NewsCard';
import { colors, radii } from '../theme';
import { AppContent, NewsArticle } from '../types';
import { sortNewsByDate } from '../utils/news';

const INITIAL_NEWS = 3;
const NEWS_STEP = 5;

export function NewsScreen({ content, wide, onNews }: { content: AppContent; wide: boolean; onNews: (item: NewsArticle) => void }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_NEWS);
  const sortedNews = useMemo(() => sortNewsByDate(content.news), [content.news]);
  const visibleNews = sortedNews.slice(0, visibleCount);
  const hasMore = visibleCount < sortedNews.length;

  return <View style={styles.stack}>
    <Header />
    <View style={[styles.grid, wide && styles.gridWide]}>
      {visibleNews.map((article) => <NewsCard key={article.id} article={article} onPress={() => onNews(article)} style={wide ? styles.half : undefined} />)}
    </View>
    {hasMore ? <Pressable onPress={() => setVisibleCount((count) => Math.min(count + NEWS_STEP, sortedNews.length))} style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}>
      <MaterialCommunityIcons name="newspaper-plus" size={20} color={colors.paper} />
      <Text style={styles.moreText}>Altre news</Text>
    </Pressable> : null}
  </View>;
}

function Header() { return <View><Text style={styles.eyebrow}>REDAZIONE</Text><Text style={styles.title}>News AC Prato</Text></View>; }

const styles = StyleSheet.create({
  stack: { gap: 18 },
  eyebrow: { color: colors.yellow, fontSize: 11, fontWeight: '900' },
  title: { color: colors.ink, fontSize: 37, fontWeight: '900', marginTop: 4 },
  grid: { gap: 12 },
  gridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  half: { width: '49%' },
  moreButton: { alignSelf: 'center', minWidth: 180, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 20, borderRadius: radii.md, backgroundColor: colors.accentStrong },
  moreText: { color: colors.paper, fontSize: 13, fontWeight: '900' },
  pressed: { opacity: 0.86 },
});
