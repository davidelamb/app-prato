import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AdminDashboard } from './src/components/AdminDashboard';
import { LivePanel } from './src/components/LivePanel';
import { NewsCard } from './src/components/NewsCard';
import { PlayerCard } from './src/components/PlayerCard';
import { PlayerProfileModal } from './src/components/PlayerProfileModal';
import { seedContent } from './src/data/seed';
import { loadContent, resetContent, saveContent } from './src/services/content-store';
import { colors, radii } from './src/theme';
import { AppContent, NewsArticle, Player, PlayerRole } from './src/types';

type Tab = 'home' | 'news' | 'live' | 'club' | 'admin';
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const tabs: Array<{ key: Exclude<Tab, 'admin'>; label: string; icon: IconName }> = [
  { key: 'home', label: 'Home', icon: 'home-variant-outline' },
  { key: 'news', label: 'News', icon: 'newspaper-variant-outline' },
  { key: 'live', label: 'Live', icon: 'broadcast' },
  { key: 'club', label: 'Rosa', icon: 'account-group-outline' },
];

const roleOrder: PlayerRole[] = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante'];
const stamp = () => new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date());

export default function App() {
  const [content, setContent] = useState<AppContent>(seedContent);
  const [tab, setTab] = useState<Tab>('home');
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const { width } = useWindowDimensions();
  const wide = width >= 820;

  useEffect(() => { loadContent().then(setContent); }, []);
  const commit = async (next: AppContent) => { const stamped = { ...next, updatedAt: stamp() }; setContent(stamped); await saveContent(stamped); };
  const liveFixture = useMemo(() => content.fixtures.find((fixture) => fixture.status === 'live') ?? content.fixtures[0], [content.fixtures]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Pressable onPress={() => setTab('home')} style={styles.brand}>
            <Image source={require('./assets/ac-prato-crest.png')} resizeMode="contain" style={styles.logo} />
            <View><Text style={styles.brandName}>AC PRATO</Text><Text style={styles.brandTag}>1908 · APP UFFICIALE DEMO</Text></View>
          </Pressable>
          <View style={styles.headerActions}>
            <View style={styles.seasonPill}><View style={styles.seasonDot} /><Text style={styles.seasonText}>2026/27</Text></View>
            <Pressable accessibilityLabel="Apri pannello admin" onPress={() => setTab(tab === 'admin' ? 'home' : 'admin')} style={[styles.adminButton, tab === 'admin' && styles.adminButtonActive]}><MaterialCommunityIcons name={tab === 'admin' ? 'close' : 'tune-variant'} size={21} color={colors.ink} /></Pressable>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.container, wide && styles.containerWide]}>
          {tab === 'home' ? <Home content={content} wide={wide} onTab={setTab} onNews={setSelectedNews} onPlayer={setSelectedPlayer} /> : null}
          {tab === 'news' ? <NewsScreen content={content} wide={wide} onNews={setSelectedNews} /> : null}
          {tab === 'live' && liveFixture ? <PageHeader eyebrow="MATCH CENTER" title="Diretta" copy="Risultato, marcatori e cronaca essenziale della partita." /> : null}
          {tab === 'live' && liveFixture ? <LivePanel fixture={liveFixture} /> : null}
          {tab === 'club' ? <RosterScreen content={content} wide={wide} onPlayer={setSelectedPlayer} /> : null}
          {tab === 'admin' ? <AdminDashboard content={content} onChange={commit} onReset={async () => setContent(await resetContent())} onClose={() => setTab('home')} /> : null}
        </View>
      </ScrollView>

      {tab !== 'admin' ? <View style={styles.nav}><View style={styles.navInner}>{tabs.map((item) => <Pressable key={item.key} onPress={() => setTab(item.key)} style={[styles.navItem, tab === item.key && styles.navItemActive]}><MaterialCommunityIcons name={item.icon} size={22} color={tab === item.key ? colors.canvas : colors.muted} /><Text style={[styles.navText, tab === item.key && styles.navTextActive]}>{item.label}</Text></Pressable>)}</View></View> : null}

      <PlayerProfileModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      <ArticleModal article={selectedNews} onClose={() => setSelectedNews(null)} />
    </SafeAreaView>
  );
}

function Home({ content, wide, onTab, onNews, onPlayer }: { content: AppContent; wide: boolean; onTab: (tab: Tab) => void; onNews: (item: NewsArticle) => void; onPlayer: (item: Player) => void }) {
  const fixture = content.fixtures.find((item) => item.status === 'live') ?? content.fixtures[0];
  const article = content.news.find((item) => item.featured) ?? content.news[0];
  const featuredPlayer = content.players.find((item) => !!item.imageUrl) ?? content.players[0];
  return <View style={styles.stack}>
    <LinearGradient colors={['#164B70', '#0C2A43', '#071827']} style={styles.hero}>
      <View style={styles.heroGlow} />
      <View style={styles.heroContent}>
        <Text style={styles.heroKicker}>LA CITTÀ · LA MAGLIA · LA PASSIONE</Text>
        <Text style={styles.heroTitle}>Il Prato, sempre con te.</Text>
        <Text style={styles.heroCopy}>News, squadra e match center in un'esperienza più moderna, veloce e biancazzurra.</Text>
        <View style={styles.heroActions}><Pressable onPress={() => onTab('live')} style={styles.primaryCta}><MaterialCommunityIcons name="broadcast" size={19} color={colors.canvas} /><Text style={styles.primaryCtaText}>Apri la diretta</Text></Pressable><Pressable onPress={() => onTab('club')} style={styles.secondaryCta}><Text style={styles.secondaryCtaText}>Scopri la rosa</Text><MaterialCommunityIcons name="arrow-right" size={18} color={colors.ink} /></Pressable></View>
      </View>
      <Image source={require('./assets/ac-prato-crest.png')} resizeMode="contain" style={styles.heroCrest} />
    </LinearGradient>

    <View style={[styles.homeGrid, wide && styles.homeGridWide]}>
      <View style={styles.homeMain}>
        <SectionTitle eyebrow="PROSSIMA PARTITA" title={fixture?.status === 'live' ? 'In campo adesso' : 'Match center'} action="Apri" onAction={() => onTab('live')} />
        {fixture ? <Pressable onPress={() => onTab('live')}><LivePanel fixture={fixture} compact /></Pressable> : null}
        {article ? <View style={styles.sectionGap}><SectionTitle eyebrow="ULTIME DAL CLUB" title="In primo piano" action="Tutte" onAction={() => onTab('news')} /><NewsCard article={article} featured onPress={() => onNews(article)} /></View> : null}
      </View>
      <View style={styles.homeSide}>
        {featuredPlayer ? <><SectionTitle eyebrow="SQUADRA" title="Protagonista" action="Rosa" onAction={() => onTab('club')} /><FeaturedPlayer player={featuredPlayer} onPress={() => onPlayer(featuredPlayer)} /></> : null}
        <View style={styles.updateCard}><View style={styles.updateIcon}><MaterialCommunityIcons name="cloud-check-outline" size={24} color={colors.success} /></View><Text style={styles.updateTitle}>Contenuti aggiornati</Text><Text style={styles.updateCopy}>{content.updatedAt}</Text></View>
      </View>
    </View>
  </View>;
}

function FeaturedPlayer({ player, onPress }: { player: Player; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.featuredPlayer}>
    <LinearGradient colors={['#173F5F', '#0B2237']} style={StyleSheet.absoluteFillObject} />
    <Text style={styles.featuredNumber}>{player.number ?? 'AC'}</Text>
    {player.imageUrl ? <Image source={{ uri: player.imageUrl }} resizeMode="cover" style={styles.featuredImage} /> : null}
    <View style={styles.featuredOverlay}><Text style={styles.featuredRole}>{player.role}</Text><Text style={styles.featuredName}>{player.name}</Text><View style={styles.featuredLink}><Text style={styles.featuredLinkText}>Vedi profilo</Text><MaterialCommunityIcons name="arrow-top-right" size={17} color={colors.accent} /></View></View>
  </Pressable>;
}

function NewsScreen({ content, wide, onNews }: { content: AppContent; wide: boolean; onNews: (item: NewsArticle) => void }) {
  return <View style={styles.stack}><PageHeader eyebrow="NEWSROOM" title="News" copy="Comunicati, squadra, stadio e tutto ciò che riguarda il mondo biancazzurro." /><View style={[styles.newsGrid, wide && styles.newsGridWide]}>{content.news.map((article, index) => <NewsCard key={article.id} article={article} featured={index === 0 && !wide} onPress={() => onNews(article)} style={wide ? styles.newsCardWide : undefined} />)}</View></View>;
}

function RosterScreen({ content, wide, onPlayer }: { content: AppContent; wide: boolean; onPlayer: (item: Player) => void }) {
  return <View style={styles.stack}><PageHeader eyebrow="PRIMA SQUADRA" title="Rosa 2026/27" copy="Tocca un calciatore per aprire la scheda completa con informazioni e statistiche." />{roleOrder.map((role) => { const players = content.players.filter((player) => player.role === role); if (!players.length) return null; return <View key={role} style={styles.roleSection}><View style={styles.roleHeading}><Text style={styles.roleTitle}>{role === 'Portiere' ? 'Portieri' : role === 'Difensore' ? 'Difensori' : role === 'Centrocampista' ? 'Centrocampisti' : 'Attaccanti'}</Text><Text style={styles.roleCount}>{players.length}</Text></View><View style={[styles.playerGrid, wide && styles.playerGridWide]}>{players.map((player) => <PlayerCard key={player.id} player={player} onPress={() => onPlayer(player)} style={wide ? styles.playerCardWide : undefined} />)}</View></View>; })}</View>;
}

function PageHeader({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <View style={styles.pageHeader}><Text style={styles.pageEyebrow}>{eyebrow}</Text><Text style={styles.pageTitle}>{title}</Text><Text style={styles.pageCopy}>{copy}</Text></View>;
}

function SectionTitle({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  return <View style={styles.sectionTitleRow}><View><Text style={styles.sectionEyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text></View>{action && onAction ? <Pressable onPress={onAction} style={styles.sectionAction}><Text style={styles.sectionActionText}>{action}</Text><MaterialCommunityIcons name="arrow-right" size={17} color={colors.accent} /></Pressable> : null}</View>;
}

function ArticleModal({ article, onClose }: { article: NewsArticle | null; onClose: () => void }) {
  return <Modal visible={!!article} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}><SafeAreaView style={styles.articleSafe}>{article ? <ScrollView contentContainerStyle={styles.articleContent}><View style={styles.articleHero}>{article.imageUrl ? <Image source={{ uri: article.imageUrl }} resizeMode="cover" style={styles.articleImage} /> : <LinearGradient colors={['#174A6F', '#0B263D']} style={styles.articlePlaceholder}><MaterialCommunityIcons name="newspaper-variant-outline" size={70} color={colors.accent} /></LinearGradient>}<Pressable onPress={onClose} style={styles.articleClose}><MaterialCommunityIcons name="close" size={23} color={colors.paper} /></Pressable></View><View style={styles.articleBody}><Text style={styles.articleCategory}>{article.category} · {article.publishedAt}</Text><Text style={styles.articleTitle}>{article.title}</Text><Text style={styles.articleLead}>{article.summary}</Text><View style={styles.articleDivider} /><Text style={styles.articleText}>{article.body ?? article.summary}</Text><Text style={styles.articleSource}>Fonte: {article.source}</Text></View></ScrollView> : null}</SafeAreaView></Modal>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: { backgroundColor: 'rgba(6,17,31,0.98)', borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  headerInner: { width: '100%', maxWidth: 1180, alignSelf: 'center', minHeight: 72, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logo: { width: 42, height: 42 }, brandName: { color: colors.ink, fontSize: 16, fontWeight: '900', letterSpacing: 0.8 }, brandTag: { color: colors.muted, fontSize: 9, marginTop: 2, letterSpacing: 0.7 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  seasonPill: { display: 'none', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: colors.surface }, seasonDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success }, seasonText: { color: colors.inkSoft, fontSize: 11, fontWeight: '800' },
  adminButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineSoft }, adminButtonActive: { backgroundColor: colors.surfaceRaised },
  scroll: { flex: 1 }, scrollContent: { paddingBottom: 110 }, container: { width: '100%', padding: 16, gap: 22 }, containerWide: { maxWidth: 1180, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 22 }, stack: { gap: 24 },
  hero: { minHeight: 320, overflow: 'hidden', borderRadius: radii.xl, padding: 24, justifyContent: 'center', borderWidth: 1, borderColor: colors.line }, heroGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, right: -60, top: -80, backgroundColor: 'rgba(86,199,255,0.13)' }, heroContent: { maxWidth: 650, zIndex: 2 }, heroKicker: { color: colors.accentSoft, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 }, heroTitle: { color: colors.paper, fontSize: 40, lineHeight: 44, fontWeight: '900', letterSpacing: -1.3, marginTop: 11, maxWidth: 480 }, heroCopy: { color: colors.inkSoft, fontSize: 16, lineHeight: 24, maxWidth: 560, marginTop: 13 }, heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 }, primaryCta: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 17, paddingVertical: 13, borderRadius: radii.md, backgroundColor: colors.accent }, primaryCtaText: { color: colors.canvas, fontWeight: '900' }, secondaryCta: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 17, paddingVertical: 13, borderRadius: radii.md, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: colors.line }, secondaryCtaText: { color: colors.ink, fontWeight: '900' }, heroCrest: { position: 'absolute', right: -8, bottom: -32, width: 250, height: 250, opacity: 0.13 },
  homeGrid: { gap: 28 }, homeGridWide: { flexDirection: 'row', alignItems: 'flex-start' }, homeMain: { flex: 1.7, gap: 14 }, homeSide: { flex: 1, gap: 14 }, sectionGap: { marginTop: 16, gap: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }, sectionEyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, sectionTitle: { color: colors.ink, fontSize: 23, fontWeight: '900', marginTop: 3 }, sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5 }, sectionActionText: { color: colors.accent, fontSize: 12, fontWeight: '900' },
  featuredPlayer: { height: 360, overflow: 'hidden', borderRadius: radii.xl, borderWidth: 1, borderColor: colors.line }, featuredNumber: { position: 'absolute', right: -4, top: -20, color: 'rgba(255,255,255,0.06)', fontSize: 170, lineHeight: 190, fontWeight: '900' }, featuredImage: { position: 'absolute', top: 10, alignSelf: 'center', width: 250, height: 270, borderRadius: radii.xl }, featuredOverlay: { marginTop: 'auto', padding: 18, paddingTop: 55, backgroundColor: 'rgba(3,14,24,0.74)' }, featuredRole: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' }, featuredName: { color: colors.paper, fontSize: 24, fontWeight: '900', marginTop: 5 }, featuredLink: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 }, featuredLinkText: { color: colors.accent, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  updateCard: { padding: 18, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineSoft }, updateIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successSoft }, updateTitle: { color: colors.ink, fontWeight: '900', marginTop: 13 }, updateCopy: { color: colors.muted, fontSize: 12, marginTop: 4 },
  pageHeader: { paddingVertical: 10, maxWidth: 720 }, pageEyebrow: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 }, pageTitle: { color: colors.ink, fontSize: 38, lineHeight: 43, fontWeight: '900', letterSpacing: -1, marginTop: 6 }, pageCopy: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 9 },
  newsGrid: { gap: 14 }, newsGridWide: { flexDirection: 'row', flexWrap: 'wrap' }, newsCardWide: { width: '48.9%' },
  roleSection: { gap: 12 }, roleHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 }, roleTitle: { color: colors.ink, fontSize: 22, fontWeight: '900' }, roleCount: { minWidth: 28, height: 28, paddingHorizontal: 8, borderRadius: 14, textAlign: 'center', textAlignVertical: 'center', color: colors.canvas, backgroundColor: colors.accent, fontSize: 12, fontWeight: '900', overflow: 'hidden' }, playerGrid: { gap: 12 }, playerGridWide: { flexDirection: 'row', flexWrap: 'wrap' }, playerCardWide: { width: '49.1%' },
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingBottom: 12 }, navInner: { maxWidth: 520, width: '100%', alignSelf: 'center', flexDirection: 'row', padding: 6, borderRadius: radii.xl, backgroundColor: 'rgba(9,24,39,0.98)', borderWidth: 1, borderColor: colors.line }, navItem: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: radii.lg }, navItemActive: { backgroundColor: colors.accent }, navText: { color: colors.muted, fontSize: 10, fontWeight: '800' }, navTextActive: { color: colors.canvas },
  articleSafe: { flex: 1, backgroundColor: colors.canvas }, articleContent: { paddingBottom: 50 }, articleHero: { height: 300, backgroundColor: colors.canvasRaised }, articleImage: { width: '100%', height: '100%' }, articlePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' }, articleClose: { position: 'absolute', top: 16, right: 18, width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(4,16,27,0.76)' }, articleBody: { padding: 22, maxWidth: 760, width: '100%', alignSelf: 'center' }, articleCategory: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }, articleTitle: { color: colors.ink, fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -0.7, marginTop: 10 }, articleLead: { color: colors.inkSoft, fontSize: 18, lineHeight: 27, marginTop: 16 }, articleDivider: { height: 1, backgroundColor: colors.lineSoft, marginVertical: 24 }, articleText: { color: colors.inkSoft, fontSize: 16, lineHeight: 27 }, articleSource: { color: colors.muted, fontSize: 11, marginTop: 28 },
});
