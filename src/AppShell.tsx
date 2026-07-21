import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AdminDashboard } from './components/AdminDashboard';
import { ArticleModal } from './components/ArticleModal';
import { LivePanel } from './components/LivePanel';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { seedContent } from './data/seed';
import { HomeScreen } from './screens/HomeScreen';
import { MediaScreen } from './screens/MediaScreen';
import { NewsScreen } from './screens/NewsScreen';
import { RosterScreen } from './screens/RosterScreen';
import { StatsScreen } from './screens/StatsScreen';
import { loadContent, resetContent, saveContent } from './services/content-store';
import { colors, radii } from './theme';
import { AppContent, NewsArticle, Player } from './types';

export type PublicTab = 'home' | 'news' | 'media' | 'live' | 'stats' | 'club';
type Tab = PublicTab | 'admin';
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const tabs: Array<{ key: PublicTab; label: string; icon: IconName }> = [
  { key: 'home', label: 'Home', icon: 'home-outline' },
  { key: 'news', label: 'News', icon: 'newspaper-variant-outline' },
  { key: 'media', label: 'Media', icon: 'play-box-multiple-outline' },
  { key: 'live', label: 'Live', icon: 'broadcast' },
  { key: 'stats', label: 'Stats', icon: 'chart-bar' },
  { key: 'club', label: 'Club', icon: 'shield-outline' },
];

const stamp = () => new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date());

export default function AppShell() {
  const [content, setContent] = useState<AppContent>(seedContent);
  const [tab, setTab] = useState<Tab>('home');
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const { width } = useWindowDimensions();
  const wide = width >= 860;

  useEffect(() => { loadContent().then(setContent); }, []);
  const commit = async (next: AppContent) => { const stamped = { ...next, updatedAt: stamp() }; setContent(stamped); await saveContent(stamped); };
  const liveFixture = useMemo(() => content.fixtures.find((item) => item.status === 'live') ?? content.fixtures[0], [content.fixtures]);
  const publicTab = tab === 'admin' ? 'home' : tab;

  return <SafeAreaView style={styles.safe}>
    <StatusBar style="dark" />
    {wide ? <LinearGradient colors={[colors.canvasRaised, '#E4F1FA', colors.canvasRaised]} style={StyleSheet.absoluteFillObject} /> : null}

    <View style={styles.header}><View style={[styles.headerInner, wide && styles.headerInnerWide]}>
      <Pressable accessibilityLabel="Torna alla home di APPrato" onPress={() => setTab('home')} style={styles.brand}>
        <View style={styles.logoFrame}><Image source={require('../assets/ac-prato-crest.png')} resizeMode="cover" style={styles.logo} /></View>
        <View style={styles.brandCopy}><Text style={styles.brandName}>APPrato</Text><Text style={styles.brandTag}>News, media, live e Serie D</Text></View>
      </Pressable>

      {wide ? <View style={styles.desktopNav}>{tabs.map((item) => { const active = publicTab === item.key; return <Pressable key={item.key} onPress={() => setTab(item.key)} style={styles.desktopNavItem}>
        <MaterialCommunityIcons name={item.icon} size={17} color={active ? colors.accentStrong : colors.inkSoft} />
        <Text style={[styles.desktopNavText, active && styles.desktopNavTextActive]}>{item.label}</Text>
        {active ? <View style={styles.desktopNavUnderline} /> : null}
      </Pressable>; })}</View> : null}

      <Pressable accessibilityLabel="Apri amministrazione" onPress={() => setTab(tab === 'admin' ? 'home' : 'admin')} style={[styles.onlineButton, wide && styles.onlineButtonWide]}>
        {tab === 'admin' ? <MaterialCommunityIcons name="close" size={20} color={colors.accentStrong} /> : <><View style={styles.onlineDot} />{wide ? <Text style={styles.onlineLabel}>Admin</Text> : null}</>}
      </Pressable>
    </View></View>

    <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, tab === 'admin' && styles.adminScroll, wide && styles.scrollContentWide]}>
      <View style={[styles.container, wide && styles.containerWide]}>
        {tab === 'home' ? <HomeScreen content={content} wide={wide} onTab={setTab} onNews={setSelectedNews} onPlayer={setSelectedPlayer} /> : null}
        {tab === 'news' ? <NewsScreen content={content} wide={wide} onNews={setSelectedNews} /> : null}
        {tab === 'media' ? <MediaScreen content={content} wide={wide} /> : null}
        {tab === 'live' && liveFixture ? <View style={styles.stack}><PageHeader eyebrow="MATCH CENTER" title="Diretta partita" copy="Risultato, cronaca e aggiornamenti minuto per minuto." /><LivePanel fixture={liveFixture} /></View> : null}
        {tab === 'stats' ? <StatsScreen content={content} wide={wide} /> : null}
        {tab === 'club' ? <RosterScreen content={content} wide={wide} onPlayer={setSelectedPlayer} /> : null}
        {tab === 'admin' ? <AdminDashboard content={content} onChange={commit} onReset={async () => setContent(await resetContent())} onClose={() => setTab('home')} /> : null}
      </View>
    </ScrollView>

    {tab !== 'admin' && !wide ? <View style={styles.nav}><View style={styles.navInner}>{tabs.map((item) => { const active = publicTab === item.key; return <Pressable key={item.key} onPress={() => setTab(item.key)} style={[styles.navItem, active && styles.navItemActive]}><MaterialCommunityIcons name={item.icon} size={22} color={active ? colors.accentStrong : colors.muted} /><Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>{active ? <View style={styles.navUnderline} /> : null}</Pressable>; })}</View></View> : null}
    <PlayerProfileModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    <ArticleModal article={selectedNews} onClose={() => setSelectedNews(null)} />
  </SafeAreaView>;
}

function PageHeader({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <View><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.pageTitle}>{title}</Text><Text style={styles.pageCopy}>{copy}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvasRaised },
  header: { backgroundColor: colors.paper, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  headerInner: { width: '100%', maxWidth: 1180, alignSelf: 'center', minHeight: 108, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerInnerWide: { minHeight: 84, maxWidth: 1320, paddingHorizontal: 32 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 14, flexShrink: 0 },
  logoFrame: { width: 74, height: 74, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.navy },
  logo: { width: '100%', height: '100%' },
  brandCopy: { flexShrink: 1 },
  brandName: { color: colors.ink, fontSize: 24, fontWeight: '900' },
  brandTag: { color: colors.muted, fontSize: 13, fontWeight: '700', marginTop: 3 },
  desktopNav: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  desktopNavItem: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: radii.pill, flexDirection: 'row', gap: 7 },
  desktopNavText: { color: colors.inkSoft, fontSize: 13, fontWeight: '800' },
  desktopNavTextActive: { color: colors.accentStrong },
  desktopNavUnderline: { position: 'absolute', left: 14, right: 14, bottom: 2, height: 3, borderRadius: 3, backgroundColor: colors.yellow },
  onlineButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  onlineButtonWide: { width: 'auto', minWidth: 44, paddingHorizontal: 14, flexDirection: 'row', gap: 8, backgroundColor: colors.canvasRaised, borderWidth: 1, borderColor: colors.lineSoft },
  onlineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.success },
  onlineLabel: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 104 },
  scrollContentWide: { paddingBottom: 48 },
  adminScroll: { paddingBottom: 30 },
  container: { width: '100%', padding: 16 },
  containerWide: { maxWidth: 1180, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 32 },
  stack: { gap: 20 },
  eyebrow: { color: colors.yellow, fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  pageTitle: { color: colors.ink, fontSize: 37, lineHeight: 42, fontWeight: '900', marginTop: 4 },
  pageCopy: { color: colors.muted, fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 8 },
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.lineSoft },
  navInner: { width: '100%', maxWidth: 760, alignSelf: 'center', flexDirection: 'row', minHeight: 82, paddingHorizontal: 3 },
  navItem: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 7 },
  navItemActive: { backgroundColor: colors.surfaceRaised },
  navText: { color: colors.muted, fontSize: 9, fontWeight: '900' },
  navTextActive: { color: colors.accentStrong },
  navUnderline: { position: 'absolute', left: 7, right: 7, bottom: 0, height: 4, backgroundColor: colors.yellow, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
});
