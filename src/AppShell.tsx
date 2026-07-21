import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AdminDashboard } from './components/AdminDashboard';
import { ArticleModal } from './components/ArticleModal';
import { LivePanel } from './components/LivePanel';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { ScreenHeader } from './components/ScreenHeader';
import { seedContent } from './data/seed';
import { HomeScreen } from './screens/HomeScreen';
import { MediaScreen } from './screens/MediaScreen';
import { NewsScreen } from './screens/NewsScreen';
import { RosterScreen } from './screens/RosterScreen';
import { StatsScreen } from './screens/StatsScreen';
import { loadContent, resetContent, saveContent } from './services/content-store';
import { colors } from './theme';
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
    {tab !== 'admin' ? <Pressable accessibilityRole="button" accessibilityLabel="Apri amministrazione" hitSlop={8} onPress={() => setTab('admin')} style={styles.adminButton}><View style={styles.onlineDot} /></Pressable> : null}

    <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, tab === 'admin' && styles.adminScroll]}>
      <View style={[styles.container, wide && styles.containerWide]}>
        {tab === 'home' ? <HomeScreen content={content} wide={wide} onTab={setTab} onNews={setSelectedNews} onPlayer={setSelectedPlayer} /> : null}
        {tab === 'news' ? <NewsScreen content={content} wide={wide} onNews={setSelectedNews} /> : null}
        {tab === 'media' ? <MediaScreen content={content} wide={wide} /> : null}
        {tab === 'live' && liveFixture ? <View style={styles.stack}><ScreenHeader eyebrow="MATCH CENTER" title="Diretta partita" copy="Risultato, cronaca e aggiornamenti minuto per minuto." wide={wide} /><LivePanel fixture={liveFixture} /></View> : null}
        {tab === 'stats' ? <StatsScreen content={content} wide={wide} /> : null}
        {tab === 'club' ? <RosterScreen content={content} wide={wide} onPlayer={setSelectedPlayer} /> : null}
        {tab === 'admin' ? <AdminDashboard content={content} onChange={commit} onReset={async () => setContent(await resetContent())} onClose={() => setTab('home')} /> : null}
      </View>
    </ScrollView>

    {tab !== 'admin' ? <View style={styles.nav}><View style={styles.navInner}>{tabs.map((item) => { const active = publicTab === item.key; return <Pressable key={item.key} onPress={() => setTab(item.key)} style={[styles.navItem, active && styles.navItemActive]}><MaterialCommunityIcons name={item.icon} size={22} color={active ? colors.accentStrong : colors.muted} /><Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>{active ? <View style={styles.navUnderline} /> : null}</Pressable>; })}</View></View> : null}
    <PlayerProfileModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    <ArticleModal article={selectedNews} onClose={() => setSelectedNews(null)} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvasRaised },
  adminButton: { position: 'absolute', top: 8, right: 12, zIndex: 20, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  onlineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.success },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 86 },
  adminScroll: { paddingBottom: 24 },
  container: { width: '100%', paddingHorizontal: 8, paddingTop: 8 },
  containerWide: { maxWidth: 1180, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 20 },
  stack: { gap: 16 },
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.lineSoft },
  navInner: { width: '100%', maxWidth: 760, alignSelf: 'center', flexDirection: 'row', minHeight: 70, paddingHorizontal: 3 },
  navItem: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 2, paddingTop: 5 },
  navItemActive: { backgroundColor: colors.surfaceRaised },
  navText: { color: colors.muted, fontSize: 8, fontWeight: '900' },
  navTextActive: { color: colors.accentStrong },
  navUnderline: { position: 'absolute', left: 7, right: 7, bottom: 0, height: 4, backgroundColor: colors.yellow, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
});
