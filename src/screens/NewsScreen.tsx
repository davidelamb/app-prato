import { StyleSheet, Text, View } from 'react-native';
import { NewsCard } from '../components/NewsCard';
import { colors } from '../theme';
import { AppContent, NewsArticle } from '../types';

export function NewsScreen({ content, wide, onNews }: { content: AppContent; wide: boolean; onNews: (item: NewsArticle) => void }) {
  const featured = content.news.find((item) => item.featured) ?? content.news[0];
  const others = content.news.filter((item) => item.id !== featured?.id);
  return <View style={styles.stack}><Header />{featured ? <NewsCard article={featured} featured onPress={() => onNews(featured)} /> : null}<Text style={styles.section}>Altre news</Text><View style={[styles.grid, wide && styles.gridWide]}>{others.map((article) => <NewsCard key={article.id} article={article} onPress={() => onNews(article)} style={wide ? styles.half : undefined} />)}</View></View>;
}
function Header() { return <View><Text style={styles.eyebrow}>REDAZIONE</Text><Text style={styles.title}>News AC Prato</Text></View>; }
const styles = StyleSheet.create({ stack: { gap: 18 }, eyebrow: { color: colors.yellow, fontSize: 11, fontWeight: '900' }, title: { color: colors.ink, fontSize: 37, fontWeight: '900', marginTop: 4 }, section: { color: colors.ink, fontSize: 25, fontWeight: '900' }, grid: { gap: 12 }, gridWide: { flexDirection: 'row', flexWrap: 'wrap' }, half: { width: '49%' } });
