import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { PublicTab } from '../AppShell';
import { LivePanel } from '../components/LivePanel';
import { NewsCard } from '../components/NewsCard';
import { colors, radii } from '../theme';
import { AppContent, NewsArticle, Player } from '../types';

export function HomeScreen({ content, wide, onTab, onNews, onPlayer }: { content: AppContent; wide: boolean; onTab: (tab: PublicTab | 'admin') => void; onNews: (item: NewsArticle) => void; onPlayer: (item: Player) => void }) {
  const fixture = content.fixtures.find((item) => item.status === 'live') ?? content.fixtures[0];
  const featuredNews = content.news.find((item) => item.featured) ?? content.news[0];
  const otherNews = content.news.filter((item) => item.id !== featuredNews?.id).slice(0, 2);
  const featuredMedia = content.media.find((item) => item.featured) ?? content.media[0];
  const featuredPlayer = content.players.find((item) => !!item.imageUrl) ?? content.players[0];

  return <View style={styles.stack}>
    {fixture ? <Pressable onPress={() => onTab('live')}><LivePanel fixture={fixture} compact /></Pressable> : null}
    {featuredMedia ? <Pressable onPress={() => onTab('media')} style={styles.mediaBanner}>
      <Image source={{ uri: featuredMedia.thumbnailUrl }} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
      <View style={styles.shade} /><View style={styles.play}><MaterialCommunityIcons name="play" size={28} color={colors.paper} /></View>
      <View style={styles.bannerBody}><Text style={styles.eyebrow}>MEDIA BIANCAZZURRI</Text><Text style={styles.bannerTitle}>{featuredMedia.title}</Text><Text numberOfLines={2} style={styles.bannerCopy}>{featuredMedia.description}</Text></View>
      <MaterialCommunityIcons name="chevron-right" size={30} color={colors.paper} />
    </Pressable> : null}

    <Pressable onPress={() => onTab('live')} style={styles.matchCard}><View style={styles.headingRow}><View><Text style={styles.eyebrow}>HOME</Text><Text style={styles.cardTitle}>Prossima partita</Text></View><MaterialCommunityIcons name="chevron-right" size={31} color={colors.accentStrong} /></View>{fixture ? <View style={styles.matchBody}><Text style={styles.matchTeams}>{fixture.home} – {fixture.away}</Text><Text style={styles.matchMeta}>{fixture.dateLabel} · {fixture.time} · {fixture.venue}</Text></View> : null}</Pressable>

    <View style={[styles.columns, wide && styles.columnsWide]}>
      <View style={styles.main}><SectionHeader eyebrow="REDAZIONE" title="Ultime notizie" action="Tutte" onPress={() => onTab('news')} />{featuredNews ? <NewsCard article={featuredNews} featured onPress={() => onNews(featuredNews)} /> : null}<View style={styles.list}>{otherNews.map((article) => <NewsCard key={article.id} article={article} onPress={() => onNews(article)} />)}</View></View>
      <View style={styles.side}>{featuredPlayer ? <><SectionHeader eyebrow="PRIMA SQUADRA" title="In evidenza" action="Rosa" onPress={() => onTab('club')} /><Pressable onPress={() => onPlayer(featuredPlayer)} style={styles.playerCard}><View style={styles.playerImageWrap}>{featuredPlayer.imageUrl ? <Image source={{ uri: featuredPlayer.imageUrl }} resizeMode="cover" style={styles.playerImage} /> : null}<View style={styles.number}><Text style={styles.numberText}>{featuredPlayer.number ? `#${featuredPlayer.number}` : 'AC'}</Text></View></View><View style={styles.playerBody}><Text style={styles.blueEyebrow}>{featuredPlayer.role}</Text><Text style={styles.playerName}>{featuredPlayer.name}</Text><Text style={styles.playerLink}>Apri il profilo ↗</Text></View></Pressable></> : null}</View>
    </View>
  </View>;
}

function SectionHeader({ eyebrow, title, action, onPress }: { eyebrow: string; title: string; action: string; onPress: () => void }) {
  return <View style={styles.sectionHeader}><View><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text></View><Pressable onPress={onPress}><Text style={styles.action}>{action} ›</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  stack: { gap: 20 }, eyebrow: { color: colors.yellow, fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }, blueEyebrow: { color: colors.accentStrong, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  mediaBanner: { minHeight: 190, overflow: 'hidden', flexDirection: 'row', alignItems: 'flex-end', gap: 12, padding: 18, borderRadius: radii.lg, backgroundColor: colors.navy }, shade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,29,50,0.68)' }, play: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentStrong, borderWidth: 2, borderColor: colors.paper, zIndex: 2 }, bannerBody: { flex: 1, zIndex: 2 }, bannerTitle: { color: colors.paper, fontSize: 22, lineHeight: 26, fontWeight: '900', marginTop: 4 }, bannerCopy: { color: colors.accentSoft, fontSize: 13, lineHeight: 18, marginTop: 5 },
  matchCard: { minHeight: 160, padding: 18, borderRadius: radii.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line }, headingRow: { flexDirection: 'row', justifyContent: 'space-between' }, cardTitle: { color: colors.ink, fontSize: 25, fontWeight: '900', marginTop: 3 }, matchBody: { marginTop: 25 }, matchTeams: { color: colors.ink, fontSize: 21, fontWeight: '900' }, matchMeta: { color: colors.muted, fontSize: 13, fontWeight: '700', marginTop: 7 },
  columns: { gap: 26 }, columnsWide: { flexDirection: 'row', alignItems: 'flex-start' }, main: { flex: 1.65, gap: 14 }, side: { flex: 1, gap: 14 }, list: { gap: 12 }, sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }, sectionTitle: { color: colors.ink, fontSize: 25, fontWeight: '900', marginTop: 3 }, action: { color: colors.accentStrong, fontSize: 12, fontWeight: '900' },
  playerCard: { overflow: 'hidden', borderRadius: radii.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line }, playerImageWrap: { height: 285, backgroundColor: colors.surfaceSoft }, playerImage: { width: '100%', height: '100%' }, number: { position: 'absolute', left: 14, bottom: 14, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.sm, backgroundColor: colors.navy }, numberText: { color: colors.paper, fontWeight: '900' }, playerBody: { padding: 17 }, playerName: { color: colors.ink, fontSize: 23, fontWeight: '900', marginTop: 5 }, playerLink: { color: colors.accentStrong, fontWeight: '900', marginTop: 14 },
});
