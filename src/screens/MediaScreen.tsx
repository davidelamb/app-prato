import { Linking, StyleSheet, View } from 'react-native';
import { MediaCard } from '../components/MediaCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { AppContent, MediaItem } from '../types';

const open = async (item: MediaItem) => { try { await Linking.openURL(item.url); } catch (error) { console.warn('Impossibile aprire il media', error); } };
export function MediaScreen({ content, wide }: { content: AppContent; wide: boolean }) {
  const featured = content.media.find((item) => item.featured) ?? content.media[0];
  const others = content.media.filter((item) => item.id !== featured?.id);
  return <View style={styles.stack}><ScreenHeader eyebrow="VIDEO BIANCAZZURRI" title="Media" copy="Highlights, interviste, video e podcast dedicati all'AC Prato." wide={wide} />{featured ? <MediaCard item={featured} featured onPress={() => void open(featured)} /> : null}<View style={[styles.grid, wide && styles.gridWide]}>{others.map((item) => <MediaCard key={item.id} item={item} onPress={() => void open(item)} style={wide ? styles.half : undefined} />)}</View></View>;
}
const styles = StyleSheet.create({ stack: { gap: 16 }, grid: { gap: 10 }, gridWide: { flexDirection: 'row', flexWrap: 'wrap' }, half: { width: '49%' } });
