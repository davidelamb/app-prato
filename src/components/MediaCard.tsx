import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, radii } from '../theme';
import { MediaItem } from '../types';

export function MediaCard({ item, onPress, featured = false, style }: { item: MediaItem; onPress: () => void; featured?: boolean; style?: ViewStyle }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, featured && styles.featured, style, pressed && styles.pressed]}>
      <View style={[styles.imageWrap, featured && styles.imageFeatured]}>
        <Image source={{ uri: item.thumbnailUrl }} resizeMode="cover" style={styles.image} />
        <View style={styles.shade} />
        <View style={styles.play}><MaterialCommunityIcons name="play" size={featured ? 34 : 26} color={colors.paper} /></View>
        <View style={styles.kind}><Text style={styles.kindText}>{item.kind}</Text></View>
        {featured ? <View style={styles.featuredCopy}><Text style={styles.featuredTitle}>{item.title}</Text><Text numberOfLines={2} style={styles.featuredDescription}>{item.description}</Text></View> : null}
      </View>
      {!featured ? (
        <View style={styles.body}>
          <Text style={styles.meta}>{item.source} · {item.publishedAt}</Text>
          <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
          <Text numberOfLines={2} style={styles.description}>{item.description}</Text>
          <View style={styles.openRow}><Text style={styles.openText}>Guarda ora</Text><MaterialCommunityIcons name="open-in-new" size={17} color={colors.accentStrong} /></View>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, shadowColor: colors.shadow, shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  featured: { minHeight: 390, backgroundColor: colors.navy },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  imageWrap: { height: 176, backgroundColor: colors.navy },
  imageFeatured: { height: 390 },
  image: { width: '100%', height: '100%' },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,29,50,0.28)' },
  play: { position: 'absolute', alignSelf: 'center', top: '41%', width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,90,156,0.9)', borderWidth: 2, borderColor: colors.paper },
  kind: { position: 'absolute', left: 14, top: 14, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.sm, backgroundColor: colors.yellow },
  kindText: { color: colors.ink, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  featuredCopy: { position: 'absolute', left: 20, right: 20, bottom: 20 },
  featuredTitle: { color: colors.paper, fontSize: 28, lineHeight: 33, fontWeight: '900', letterSpacing: -0.5 },
  featuredDescription: { color: colors.accentSoft, fontSize: 14, lineHeight: 20, fontWeight: '700', marginTop: 8 },
  body: { padding: 16 },
  meta: { color: colors.accentStrong, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 19, lineHeight: 23, fontWeight: '900', marginTop: 7 },
  description: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 7 },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.lineSoft },
  openText: { color: colors.accentStrong, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
});
