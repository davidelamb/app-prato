import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AdminDashboard } from './components/AdminDashboard';
import { ArticleModal } from './components/ArticleModal';
import { LivePanel } from './components/LivePanel';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { seedContent } from './data/seed';
import { MediaScreen } from './screens/MediaScreen';
import { NewsScreen } from './screens/NewsScreen';
import { RosterScreen } from './screens/RosterScreen';
import { StatsScreen } from './screens/StatsScreen';
import { loadContent, resetContent, saveContent } from './services/content-store';
import { colors, radii } from './theme';
import { AppContent, NewsArticle, Player } from './types';
import { isLiveWindow } from './utils/fixture-time';

export type PublicTab = 'news' | 'media' | 'live' | 'stats' | 'club';
type Tab = PublicTab | 'admin';
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const clubIcon = require('../assets/club-tab-icon-44.png');
const allTabs: Array<{ key: PublicTab; label: string; icon?: IconName; image?: ReturnType<typeof require> }> = [
  { key: 'news', label: 'News', icon: 'newspaper-variant-outline' },
  { key: 'media', label: 'Media', icon: 'play-box-multiple-outline' },
  { key: 'live', label: 'Live', icon: 'broadcast' },
  { key: 'stats', label: 'Statistiche', icon: 'chart-bar' },
  { key: 'club', label: 'Club', image: clubIcon },
];

const hoverColors: Record<string, string> = {
  news: colors.blue,
  media: '#7B3FA3',
  live: colors.live,
  stats: colors.success,
};

const stamp = () => new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date());
const TAB_STORAGE_KEY = 'app-prato:active-tab';
const publicTabKeys = new Set<PublicTab>(allTabs.map((item) => item.key));

type TabItem = typeof allTabs[number];
function NavTabItem({ item, active, onPress }: { item: TabItem; active: boolean; onPress: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const isClub = item.key === 'club';
  const highlight = !active && !isClub && (hovered || focused);
  const iconColor = highlight ? hoverColors[item.key] : active ? colors.accentStrong : colors.muted;
  const textColor = highlight ? hoverColors[item.key] : active ? colors.accentStrong : colors.muted;

  return (
    <Pressable
      key={item.key}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[styles.navItem, active && styles.navItemActive, focused && !active && !isClub && styles.navItemFocus]}
    >
      {item.image ? (
        <Image source={item.image} style={[styles.clubIcon, { opacity: active ? 1 : 0.55 }]} resizeMode="contain" />
      ) : (
        <MaterialCommunityIcons name={item.icon!} size={22} color={iconColor} />
      )}
      <Text style={[styles.navText, { color: textColor }]}>{item.label}</Text>
      {active ? <View style={styles.navUnderline} /> : null}
    </Pressable>
  );
}

export default function AppShell() {
  const [content, setContent] = useState<AppContent>(seedContent);
  const [tab, setTab] = useState<Tab>('news');
  const [tabReady, setTabReady] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const { width } = useWindowDimensions();
  const wide = width >= 860;

  useEffect(() => { loadContent().then(setContent); }, []);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(TAB_STORAGE_KEY)
      .then((storedTab) => {
        if (active && storedTab && publicTabKeys.has(storedTab as PublicTab)) setTab(storedTab as PublicTab);
      })
      .finally(() => { if (active) setTabReady(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (tabReady && tab !== 'admin') void AsyncStorage.setItem(TAB_STORAGE_KEY, tab);
  }, [tab, tabReady]);
  const commit = async (next: AppContent) => { const stamped = { ...next, updatedAt: stamp() }; setContent(stamped); await saveContent(stamped); };
  const liveFixture = useMemo(() => {
    const real = content.fixtures.filter((item) => !item.isDemo);
    const live = real.find((item) => item.status === 'live');
    if (live) return live;
    const inWindow = real.filter((item) => isLiveWindow(item));
    if (inWindow.length > 0) {
      return [...inWindow].sort((a, b) => (a.kickoffAt ? Date.parse(a.kickoffAt) : 0) - (b.kickoffAt ? Date.parse(b.kickoffAt) : 0))[0];
    }
    return real[0] || content.fixtures[0];
  }, [content.fixtures]);
  const liveTabVisible = useMemo(() => {
    if (!liveFixture) return false;
    if (liveFixture.isDemo) return false;
    if (liveFixture.status === 'live') return true;
    return isLiveWindow(liveFixture);
  }, [liveFixture]);
  const tabs = useMemo(() => {
    return liveTabVisible ? allTabs : allTabs.filter((item) => item.key !== 'live');
  }, [liveTabVisible]);
  const publicTab = tab === 'admin' ? 'news' : tab;

  return <SafeAreaView style={styles.safe}>
    <StatusBar style="dark" />
    {wide ? <LinearGradient colors={[colors.canvasRaised, '#E4F1FA', colors.canvasRaised]} style={StyleSheet.absoluteFillObject} /> : null}

    <Pressable accessibilityLabel="Apri amministrazione" onPress={() => setTab(tab === 'admin' ? 'news' : 'admin')} style={styles.adminButton}>
      {tab === 'admin' ? <MaterialCommunityIcons name="close" size={20} color={colors.accentStrong} /> : <View style={styles.onlineDot} />}
    </Pressable>

    <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, tab === 'admin' && styles.adminScroll, wide && styles.scrollContentWide]}>
      <View style={[styles.container, wide && styles.containerWide]}>
        {tab === 'news' ? <NewsScreen content={content} wide={wide} onNews={setSelectedNews} /> : null}
        {tab === 'media' ? <MediaScreen content={content} wide={wide} /> : null}
        {tab === 'live' && liveFixture ? <View style={styles.stack}><PageHeader eyebrow="MATCH CENTER" title="Diretta partita" copy="Risultato, cronaca e aggiornamenti minuto per minuto." /><LivePanel fixture={liveFixture} players={content.players} /></View> : null}
        {tab === 'stats' ? <StatsScreen content={content} wide={wide} /> : null}
        {tab === 'club' ? <RosterScreen content={content} wide={wide} onPlayer={setSelectedPlayer} /> : null}
        {tab === 'admin' ? <AdminDashboard content={content} onChange={commit} onReset={async () => setContent(await resetContent())} onClose={() => setTab('news')} /> : null}
      </View>
    </ScrollView>

    {tab !== 'admin' ? <View style={styles.nav}><View style={styles.navInner}>{tabs.map((item) => <NavTabItem key={item.key} item={item} active={publicTab === item.key} onPress={() => setTab(item.key)} />)}</View></View> : null}
    <PlayerProfileModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    <ArticleModal article={selectedNews} onClose={() => setSelectedNews(null)} />
  </SafeAreaView>;
}

function PageHeader({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <View><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.pageTitle}>{title}</Text><Text style={styles.pageCopy}>{copy}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvasRaised },
  adminButton: { position: 'absolute', zIndex: 20, top: 10, right: 12, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.lineSoft },
  onlineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.success },
  scroll: { flex: 1 },
    scrollContent: { paddingBottom: 58 },
  scrollContentWide: { paddingBottom: 48 },
  adminScroll: { paddingBottom: 30 },
  container: { width: '100%', padding: 16 },
  containerWide: { maxWidth: 1180, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 32 },
  stack: { gap: 20 },
  eyebrow: { color: colors.yellow, fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  pageTitle: { color: colors.ink, fontSize: 37, lineHeight: 42, fontWeight: '900', marginTop: 4 },
  pageCopy: { color: colors.muted, fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 8 },
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.lineSoft },
    navInner: { width: '100%', maxWidth: 760, alignSelf: 'center', flexDirection: 'row', minHeight: 42, paddingHorizontal: 3 },
    navItem: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 0, paddingTop: 0 },
  navItemActive: { backgroundColor: colors.surfaceRaised },
  navItemFocus: { backgroundColor: 'rgba(0,0,0,0.04)' },
  navText: { color: colors.muted, fontSize: 9, fontWeight: '900' },
  navTextActive: { color: colors.accentStrong },
   navUnderline: { position: 'absolute', left: 7, right: 7, bottom: 0, height: 3, backgroundColor: colors.yellow, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
   clubIcon: { width: 26, height: 26 },
});
