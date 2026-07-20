import { Linking, StyleSheet, Text, View } from 'react-native';
import { MediaCard } from '../components/MediaCard';
import { colors } from '../theme';
import { AppContent, MediaItem } from '../types';

const open = async (item: MediaItem) => { try { await Linking.openURL(item.url); } catch (error) { console.warn('Impossibile aprire il media', error); } };
export function MediaScreen({ content, wide }: { content: AppContent; wide: boolean }) {
  const featured = content.media.find((item) => item.featured) ?? content.media[0];
  const others = content.media.filter((item) => item.id !== featured?.id);
  return <View style={styles.stack}><View><Text style={styles.eyebrow}>VIDEO BIANCAZZURRI</Text><Text style={styles.title}>Media</Text><Text style={styles.copy}>Highlights, interviste, video e podcast dedicati all’AC Prato.</Text></View>{featured ? <MediaCard item={featured} featured onPress={() => void open(featured)} /> : null}<View style={[styles.grid, wide && styles.gridWide]}>{others.map((item) => <MediaCard key={item.id} item={item} onPress={() => void open(item)} style={wide ? styles.half : undefined} />)}</View></View>;
}
const styles = StyleSheet.create({ stack: { gap: 18 }, eyebrow: { color: colors.yellow, fontSize: 11, fontWeight: '900' }, title: { color: colors.ink, fontSize: 37, fontWeight: '900', marginTop: 4 }, copy: { color: colors.muted, fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 8 }, grid: { gap: 12 }, gridWide: { flexDirection: 'row', flexWrap: 'wrap' }, half: { width: '49%' } });
