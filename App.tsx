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
import { AppContent, Fixture, NewsArticle, Player, PlayerRole } from './src/types';

type Tab = 'home' | 'news' | 'community' | 'live' | 'stats' | 'club' | 'admin';
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const publicTabs: Array<{ key: Exclude<Tab, 'admin'>; label: string; icon: IconName }> = [
  { key: 'home', label: 'Home', icon: 'home-outline' },
  { key: 'news', label: 'News', icon: 'newspaper-variant-outline' },
  { key: 'community', label: 'TPrato', icon: 'microphone-outline' },
  { key: 'live', label: 'Live', icon: 'broadcast' },
  { key: 'stats', label: 'Stats', icon: 'chart-bar' },
  { key: 'club', label: 'Club', icon: 'shield-outline' },
];

const roleOrder: PlayerRole[] = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante'];
const stamp = () => new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date());

export default function App() {
  const [content, setContent] = useState<AppContent>(seedContent);
  const [tab, setTab] = useState<Tab>('home');
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const { width } = useWindowDimensions();
  const wide = width >= 860;

  useEffect(() => { loadContent().then(setContent); }, []);
  const commit = async (next: AppContent) => {
    const stamped = { ...next, updatedAt: stamp() };
    setContent(stamped);
    await saveContent(stamped);
  };
  const liveFixture = useMemo(() => content.fixtures.find((fixture) => fixture.status === 'live') ?? content.fixtures[0], [content.fixtures]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Pressable onPress={() => setTab('home')} style={styles.brand}>
            <View style={styles.logoFrame}><Image source={require('./assets/ac-prato-crest.png')} resizeMode="contain" style={styles.logo} /></View>
            <View style={styles.brandCopy}>
              <Text style={styles.brandName}>APPrato</Text>
              <Text style={styles.brandTag}>News, live, Serie D, tifosi</Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityLabel={tab === 'admin' ? 'Chiudi pannello amministrazione' : 'Apri pannello amministrazione'}
            onPress={() => setTab(tab === 'admin' ? 'home' : 'admin')}
            style={styles.onlineButton}
          >
            {tab === 'admin' ? <MaterialCommunityIcons name="close" size={22} color={colors.accentStrong} /> : <View style={styles.onlineDot} />}
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, tab === 'admin' && styles.scrollContentAdmin]}>
        <View style={[styles.container, wide && styles.containerWide]}>
          {tab === 'home' ? <Home content={content} wide={wide} onTab={setTab} onNews={setSelectedNews} onPlayer={setSelectedPlayer} /> : null}
          {tab === 'news' ? <NewsScreen content={content} wide={wide} onNews={setSelectedNews} /> : null}
          {tab === 'community' ? <CommunityScreen content={content} /> : null}
          {tab === 'live' && liveFixture ? <LiveScreen fixture={liveFixture} /> : null}
          {tab === 'stats' ? <StatsScreen content={content} wide={wide} /> : null}
          {tab === 'club' ? <RosterScreen content={content} wide={wide} onPlayer={setSelectedPlayer} /> : null}
          {tab === 'admin' ? <AdminDashboard content={content} onChange={commit} onReset={async () => setContent(await resetContent())} onClose={() => setTab('home')} /> : null}
        </View>
      </ScrollView>

      {tab !== 'admin' ? (
        <View style={styles.nav}>
          <View style={styles.navInner}>
            {publicTabs.map((item) => {
              const active = tab === item.key;
              return (
                <Pressable key={item.key} onPress={() => setTab(item.key)} style={[styles.navItem, active && styles.navItemActive]}>
                  <MaterialCommunityIcons name={item.icon} size={23} color={active ? colors.accentStrong : colors.muted} />
                  <Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>
                  {active ? <View style={styles.navUnderline} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <PlayerProfileModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      <ArticleModal article={selectedNews} onClose={() => setSelectedNews(null)} />
    </SafeAreaView>
  );
}

function Home({ content, wide, onTab, onNews, onPlayer }: { content: AppContent; wide: boolean; onTab: (tab: Tab) => void; onNews: (item: NewsArticle) => void; onPlayer: (item: Player) => void }) {
  const fixture = content.fixtures.find((item) => item.status === 'live') ?? content.fixtures[0];
  const featured = content.news.find((item) => item.featured) ?? content.news[0];
  const remaining = content.news.filter((item) => item.id !== featured?.id).slice(0, 3);
  const featuredPlayer = content.players.find((item) => !!item.imageUrl) ?? content.players[0];

  return (
    <View style={styles.stack}>
      {fixture ? <Pressable onPress={() => onTab('live')}><LivePanel fixture={fixture} compact /></Pressable> : null}

      <Pressable onPress={() => onTab('community')} style={styles.communityBanner}>
        <View style={styles.communityIcon}><MaterialCommunityIcons name="microphone-variant" size={34} color={colors.accentStrong} /></View>
        <View style={styles.communityBody}>
          <Text style={styles.yellowEyebrow}>COMMUNITY BIANCAZZURRA</Text>
          <Text style={styles.communityTitle}>TuttoPrato</Text>
          <Text style={styles.communityCopy}>Approfondimenti, podcast e voce dei tifosi dell'AC Prato 1908.</Text>
        </View>
        <View style={styles.newBadge}><Text style={styles.newBadgeText}>Nuovo</Text></View>
        <MaterialCommunityIcons name="chevron-right" size={31} color={colors.accentStrong} />
      </Pressable>

      <Pressable onPress={() => onTab('live')} style={styles.nextMatchCard}>
        <View style={styles.cardHeadingRow}>
          <View><Text style={styles.yellowEyebrow}>HOME</Text><Text style={styles.cardTitle}>Prossima partita</Text></View>
          <MaterialCommunityIcons name="chevron-right" size={31} color={colors.accentStrong} />
        </View>
        {fixture ? (
          <View style={styles.nextMatchBody}>
            <Text style={styles.nextMatchTeams}>{fixture.home} – {fixture.away}</Text>
            <Text style={styles.nextMatchMeta}>{fixture.dateLabel} · {fixture.time} · {fixture.venue}</Text>
          </View>
        ) : <Text style={styles.emptyCardCopy}>Calendario da aggiornare dal pannello admin.</Text>}
      </Pressable>

      <View style={[styles.homeGrid, wide && styles.homeGridWide]}>
        <View style={styles.homeMain}>
          <SectionHeader eyebrow="REDAZIONE" title="Ultime notizie" action="Tutte" onAction={() => onTab('news')} />
          {featured ? <NewsCard article={featured} featured onPress={() => onNews(featured)} /> : null}
          <View style={styles.listStack}>{remaining.map((article) => <NewsCard key={article.id} article={article} onPress={() => onNews(article)} />)}</View>
        </View>
        <View style={styles.homeSide}>
          {featuredPlayer ? (
            <>
              <SectionHeader eyebrow="PRIMA SQUADRA" title="In evidenza" action="Rosa" onAction={() => onTab('club')} />
              <FeaturedPlayer player={featuredPlayer} onPress={() => onPlayer(featuredPlayer)} />
            </>
          ) : null}
          <View style={styles.clubBanner}>
            <Image source={require('./assets/ac-prato-crest.png')} resizeMode="contain" style={styles.clubBannerLogo} />
            <View><Text style={styles.clubBannerSmall}>DAL 1908</Text><Text style={styles.clubBannerTitle}>Forza Prato</Text><Text style={styles.clubBannerCopy}>La città, la maglia, la passione.</Text></View>
          </View>
          <Text style={styles.updatedAt}>Contenuti aggiornati: {content.updatedAt}</Text>
        </View>
      </View>
    </View>
  );
}

function FeaturedPlayer({ player, onPress }: { player: Player; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.featuredPlayer}>
      <View style={styles.featuredPlayerImageWrap}>
        {player.imageUrl ? <Image source={{ uri: player.imageUrl }} resizeMode="cover" style={styles.featuredPlayerImage} /> : <View style={styles.featuredPlayerPlaceholder}><MaterialCommunityIcons name="account" size={88} color={colors.mutedDark} /></View>}
        <View style={styles.playerNumberBadge}><Text style={styles.playerNumberText}>{player.number ? `#${player.number}` : 'AC'}</Text></View>
      </View>
      <View style={styles.featuredPlayerBody}>
        <Text style={styles.blueEyebrow}>{player.role}</Text>
        <Text style={styles.featuredPlayerName}>{player.name}</Text>
        <View style={styles.featuredPlayerFooter}><Text style={styles.featuredPlayerLink}>Apri il profilo</Text><MaterialCommunityIcons name="arrow-top-right" size={20} color={colors.accentStrong} /></View>
      </View>
    </Pressable>
  );
}

function NewsScreen({ content, wide, onNews }: { content: AppContent; wide: boolean; onNews: (item: NewsArticle) => void }) {
  const featured = content.news.find((item) => item.featured) ?? content.news[0];
  const others = content.news.filter((item) => item.id !== featured?.id);
  return (
    <View style={styles.stack}>
      <PageHeader eyebrow="REDAZIONE" title="News AC Prato" copy="Comunicati, mercato, prima squadra e vita del club." />
      {featured ? <NewsCard article={featured} featured onPress={() => onNews(featured)} /> : null}
      <SectionHeader eyebrow="AGGIORNAMENTI" title="Altre news" />
      <View style={[styles.newsGrid, wide && styles.newsGridWide]}>
        {others.map((article) => <NewsCard key={article.id} article={article} onPress={() => onNews(article)} style={wide ? styles.newsCardWide : undefined} />)}
      </View>
    </View>
  );
}

function CommunityScreen({ content }: { content: AppContent }) {
  return (
    <View style={styles.stack}>
      <View style={styles.communityIntro}>
        <View style={styles.communityIntroLogo}><Image source={require('./assets/ac-prato-crest.png')} resizeMode="contain" style={styles.communityIntroImage} /></View>
        <View style={styles.communityIntroBody}><Text style={styles.yellowEyebrow}>COMMUNITY BIANCAZZURRA</Text><Text style={styles.communityIntroText}>News, approfondimenti e analisi sull'AC Prato 1908.</Text></View>
      </View>

      <View style={styles.whiteSection}>
        <Text style={styles.sectionCardTitle}>Profili ufficiali</Text>
        <View style={styles.socialGrid}>
          <SocialButton icon="facebook" label="Facebook" />
          <SocialButton icon="instagram" label="Instagram" />
          <SocialButton icon="youtube" label="YouTube" />
          <SocialButton icon="spotify" label="Spotify" />
        </View>
      </View>

      <View style={styles.whiteSection}>
        <Text style={styles.sectionCardTitle}>Podcast TuttoPrato</Text>
        <View style={styles.podcastList}>
          <PodcastRow title="Podcast TuttoPrato" copy="Approfondimenti e chiacchiere settimanali sull'AC Prato 1908." />
          <PodcastRow title="TuttoPrato Summer Talk" copy="Conversazioni sui temi caldi del momento biancazzurro." />
        </View>
      </View>

      <View style={styles.whiteSection}>
        <Text style={styles.sectionCardTitle}>Dalla redazione</Text>
        <Text style={styles.sectionCardCopy}>{content.news.length} articoli disponibili e contenuti aggiornati {content.updatedAt}.</Text>
      </View>
    </View>
  );
}

function SocialButton({ icon, label }: { icon: IconName; label: string }) {
  return <Pressable style={styles.socialButton}><MaterialCommunityIcons name={icon} size={26} color={colors.accentStrong} /><Text style={styles.socialLabel}>{label}</Text></Pressable>;
}

function PodcastRow({ title, copy }: { title: string; copy: string }) {
  return (
    <Pressable style={styles.podcastRow}>
      <View style={styles.podcastIcon}><MaterialCommunityIcons name="microphone-variant" size={34} color={colors.accentStrong} /></View>
      <View style={styles.podcastBody}><Text style={styles.podcastTitle}>{title}</Text><Text style={styles.podcastCopy}>{copy}</Text></View>
      <MaterialCommunityIcons name="open-in-new" size={22} color={colors.accentStrong} />
    </Pressable>
  );
}

function LiveScreen({ fixture }: { fixture: Fixture }) {
  return (
    <View style={styles.stack}>
      <PageHeader eyebrow="MATCH CENTER" title="Diretta partita" copy="Risultato, cronaca e aggiornamenti minuto per minuto." />
      <LivePanel fixture={fixture} />
    </View>
  );
}

function StatsScreen({ content, wide }: { content: AppContent; wide: boolean }) {
  const totalGoals = content.players.reduce((sum, player) => sum + player.goals, 0);
  const totalAppearances = content.players.reduce((sum, player) => sum + player.appearances, 0);
  const leaders = [...content.players].sort((a, b) => b.goals - a.goals || b.appearances - a.appearances).slice(0, 5);
  const topStanding = content.standings.slice(0, 6);

  return (
    <View style={styles.stack}>
      <PageHeader eyebrow="NUMERI" title="Statistiche" copy="Rendimento della rosa, marcatori e classifica del campionato." />
      <View style={[styles.metricsGrid, wide && styles.metricsGridWide]}>
        <Metric icon="account-group-outline" value={content.players.length} label="Calciatori" />
        <Metric icon="soccer" value={totalGoals} label="Gol rosa" />
        <Metric icon="run" value={totalAppearances} label="Presenze" />
      </View>

      <View style={[styles.statsColumns, wide && styles.statsColumnsWide]}>
        <View style={styles.whiteSectionFlex}>
          <Text style={styles.yellowEyebrow}>PRIMA SQUADRA</Text>
          <Text style={styles.sectionCardTitle}>Marcatori</Text>
          <View style={styles.leaderList}>{leaders.map((player, index) => <LeaderRow key={player.id} rank={index + 1} player={player} />)}</View>
        </View>
        <View style={styles.whiteSectionFlex}>
          <Text style={styles.yellowEyebrow}>SERIE D</Text>
          <Text style={styles.sectionCardTitle}>Classifica</Text>
          <View style={styles.standingHeader}><Text style={styles.standingHeaderClub}>Squadra</Text><Text style={styles.standingHeaderCell}>G</Text><Text style={styles.standingHeaderCell}>Pt</Text></View>
          {topStanding.length ? topStanding.map((row) => (
            <View key={`${row.rank}-${row.club}`} style={styles.standingRow}>
              <Text style={styles.standingRank}>{row.rank}</Text>
              <Text numberOfLines={1} style={styles.standingClub}>{row.club}</Text>
              <Text style={styles.standingCell}>{row.played}</Text>
              <Text style={styles.standingPoints}>{row.points}</Text>
            </View>
          )) : <Text style={styles.sectionCardCopy}>Classifica da aggiornare dal pannello admin.</Text>}
        </View>
      </View>
    </View>
  );
}

function Metric({ icon, value, label }: { icon: IconName; value: number | string; label: string }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}><MaterialCommunityIcons name={icon} size={25} color={colors.accentStrong} /></View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function LeaderRow({ rank, player }: { rank: number; player: Player }) {
  return (
    <View style={styles.leaderRow}>
      <Text style={styles.leaderRank}>{rank}</Text>
      <View style={styles.leaderAvatar}>{player.imageUrl ? <Image source={{ uri: player.imageUrl }} resizeMode="cover" style={styles.leaderImage} /> : <MaterialCommunityIcons name="account" size={24} color={colors.mutedDark} />}</View>
      <View style={styles.leaderBody}><Text style={styles.leaderName}>{player.name}</Text><Text style={styles.leaderMeta}>{player.role} · {player.appearances} presenze</Text></View>
      <View style={styles.goalsBadge}><Text style={styles.goalsValue}>{player.goals}</Text><Text style={styles.goalsLabel}>gol</Text></View>
    </View>
  );
}

function RosterScreen({ content, wide, onPlayer }: { content: AppContent; wide: boolean; onPlayer: (item: Player) => void }) {
  return (
    <View style={styles.stack}>
      <PageHeader eyebrow="CLUB" title="AC Prato 1908" copy="Rosa, protagonisti e identità biancazzurra." />
      <View style={styles.clubTabs}>
        <View style={styles.clubTabActive}><MaterialCommunityIcons name="account-group-outline" size={19} color={colors.paper} /><Text style={styles.clubTabActiveText}>Rosa</Text></View>
        <View style={styles.clubTab}><MaterialCommunityIcons name="image-multiple-outline" size={19} color={colors.accentStrong} /><Text style={styles.clubTabText}>Media</Text></View>
        <View style={styles.clubTab}><MaterialCommunityIcons name="heart-outline" size={19} color={colors.accentStrong} /><Text style={styles.clubTabText}>Tifosi</Text></View>
      </View>
      {roleOrder.map((role) => {
        const players = content.players.filter((player) => player.role === role);
        if (!players.length) return null;
        const title = role === 'Portiere' ? 'Portieri' : role === 'Difensore' ? 'Difensori' : role === 'Centrocampista' ? 'Centrocampisti' : 'Attaccanti';
        return (
          <View key={role} style={styles.roleSection}>
            <View style={styles.roleHeading}><Text style={styles.roleTitle}>{title}</Text><Text style={styles.roleCount}>{players.length}</Text></View>
            <View style={[styles.playerGrid, wide && styles.playerGridWide]}>
              {players.map((player) => <PlayerCard key={player.id} player={player} onPress={() => onPlayer(player)} style={wide ? styles.playerCardWide : undefined} />)}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function PageHeader({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <View style={styles.pageHeader}><Text style={styles.yellowEyebrow}>{eyebrow}</Text><Text style={styles.pageTitle}>{title}</Text><Text style={styles.pageCopy}>{copy}</Text></View>;
}

function SectionHeader({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <View><Text style={styles.yellowEyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text></View>
      {action && onAction ? <Pressable onPress={onAction} style={styles.sectionAction}><Text style={styles.sectionActionText}>{action}</Text><MaterialCommunityIcons name="chevron-right" size={22} color={colors.accentStrong} /></Pressable> : null}
    </View>
  );
}

function ArticleModal({ article, onClose }: { article: NewsArticle | null; onClose: () => void }) {
  return (
    <Modal visible={!!article} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.articleSafe}>
        {article ? (
          <ScrollView contentContainerStyle={styles.articleContent}>
            <View style={styles.articleTopBar}>
              <Pressable onPress={onClose} style={styles.articleBack}><MaterialCommunityIcons name="chevron-left" size={31} color={colors.ink} /></Pressable>
              <Text style={styles.articleTopTitle}>News AC Prato</Text>
              <View style={styles.articleTopSpacer} />
            </View>
            {article.imageUrl ? <Image source={{ uri: article.imageUrl }} resizeMode="cover" style={styles.articleImage} /> : <LinearGradient colors={[colors.accentStrong, colors.accent]} style={styles.articlePlaceholder}><MaterialCommunityIcons name="newspaper-variant-outline" size={70} color={colors.paper} /></LinearGradient>}
            <View style={styles.articleBody}>
              <Text style={styles.blueEyebrow}>{article.category}</Text>
              <Text style={styles.articleTitle}>{article.title}</Text>
              <Text style={styles.articleMeta}>{article.source} · {article.publishedAt}</Text>
              <Text style={styles.articleLead}>{article.summary}</Text>
              <View style={styles.articleDivider} />
              <Text style={styles.articleText}>{article.body ?? article.summary}</Text>
              <View style={styles.articleSourceCard}><MaterialCommunityIcons name="information-outline" size={21} color={colors.accentStrong} /><Text style={styles.articleSourceText}>Fonte editoriale: {article.source}</Text></View>
            </View>
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvasRaised },
  header: { backgroundColor: colors.paper, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  headerInner: { width: '100%', maxWidth: 1180, alignSelf: 'center', minHeight: 112, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  logoFrame: { width: 68, height: 68, borderRadius: 18, padding: 5, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  logo: { width: '100%', height: '100%' },
  brandCopy: { flex: 1 },
  brandName: { color: colors.ink, fontSize: 24, lineHeight: 28, fontWeight: '900', letterSpacing: -0.4 },
  brandTag: { color: colors.muted, fontSize: 14, fontWeight: '700', marginTop: 3 },
  onlineButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  onlineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.success },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 104 },
  scrollContentAdmin: { paddingBottom: 30 },
  container: { width: '100%', padding: 16 },
  containerWide: { maxWidth: 1180, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 22 },
  stack: { gap: 20 },
  listStack: { gap: 12 },
  yellowEyebrow: { color: colors.yellow, fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  blueEyebrow: { color: colors.accentStrong, fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  communityBanner: { minHeight: 154, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radii.lg, backgroundColor: colors.yellowSoft, borderWidth: 1, borderColor: colors.yellow },
  communityIcon: { width: 76, height: 76, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  communityBody: { flex: 1 },
  communityTitle: { color: colors.ink, fontSize: 22, lineHeight: 26, fontWeight: '900', marginTop: 4 },
  communityCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, fontWeight: '700', marginTop: 4 },
  newBadge: { position: 'absolute', right: 40, top: 14, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radii.sm, backgroundColor: colors.accentStrong },
  newBadgeText: { color: colors.paper, fontSize: 10, fontWeight: '900' },
  nextMatchCard: { minHeight: 170, padding: 18, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  cardHeadingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  cardTitle: { color: colors.ink, fontSize: 25, fontWeight: '900', marginTop: 3 },
  nextMatchBody: { marginTop: 26 },
  nextMatchTeams: { color: colors.ink, fontSize: 21, lineHeight: 26, fontWeight: '900' },
  nextMatchMeta: { color: colors.muted, fontSize: 13, lineHeight: 19, fontWeight: '700', marginTop: 7 },
  emptyCardCopy: { color: colors.muted, fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 28 },
  homeGrid: { gap: 26 },
  homeGridWide: { flexDirection: 'row', alignItems: 'flex-start' },
  homeMain: { flex: 1.65, gap: 14 },
  homeSide: { flex: 1, gap: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: colors.ink, fontSize: 25, lineHeight: 30, fontWeight: '900', marginTop: 3 },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 1, paddingVertical: 6 },
  sectionActionText: { color: colors.accentStrong, fontSize: 12, fontWeight: '900' },
  featuredPlayer: { overflow: 'hidden', borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  featuredPlayerImageWrap: { height: 330, backgroundColor: colors.surfaceSoft },
  featuredPlayerImage: { width: '100%', height: '100%' },
  featuredPlayerPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  playerNumberBadge: { position: 'absolute', left: 14, bottom: 14, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.sm, backgroundColor: colors.navy },
  playerNumberText: { color: colors.paper, fontSize: 12, fontWeight: '900' },
  featuredPlayerBody: { padding: 18 },
  featuredPlayerName: { color: colors.ink, fontSize: 24, fontWeight: '900', marginTop: 4 },
  featuredPlayerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 13 },
  featuredPlayerLink: { color: colors.accentStrong, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  clubBanner: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: radii.lg, backgroundColor: colors.navy },
  clubBannerLogo: { width: 76, height: 76 },
  clubBannerSmall: { color: colors.yellow, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  clubBannerTitle: { color: colors.paper, fontSize: 24, fontWeight: '900', marginTop: 3 },
  clubBannerCopy: { color: '#BBD0DE', fontSize: 12, marginTop: 3 },
  updatedAt: { color: colors.muted, fontSize: 10, textAlign: 'center' },
  pageHeader: { paddingVertical: 2, maxWidth: 760 },
  pageTitle: { color: colors.ink, fontSize: 36, lineHeight: 41, fontWeight: '900', letterSpacing: -0.8, marginTop: 4 },
  pageCopy: { color: colors.muted, fontSize: 15, lineHeight: 22, fontWeight: '600', marginTop: 7 },
  newsGrid: { gap: 12 },
  newsGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  newsCardWide: { width: '49%' },
  communityIntro: { minHeight: 210, flexDirection: 'row', alignItems: 'center', gap: 18, padding: 20, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  communityIntroLogo: { width: 126, height: 126, padding: 12, borderRadius: radii.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  communityIntroImage: { width: '100%', height: '100%' },
  communityIntroBody: { flex: 1 },
  communityIntroText: { color: colors.ink, fontSize: 22, lineHeight: 30, fontWeight: '900', marginTop: 17 },
  whiteSection: { padding: 18, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  whiteSectionFlex: { flex: 1, minWidth: 0, padding: 18, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  sectionCardTitle: { color: colors.ink, fontSize: 24, fontWeight: '900' },
  sectionCardCopy: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  socialGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  socialButton: { width: '48%', minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderRadius: radii.md, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.line },
  socialLabel: { color: colors.accentStrong, fontSize: 17, fontWeight: '900' },
  podcastList: { gap: 12, marginTop: 16 },
  podcastRow: { minHeight: 118, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  podcastIcon: { width: 82, height: 82, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised },
  podcastBody: { flex: 1 },
  podcastTitle: { color: colors.ink, fontSize: 18, lineHeight: 22, fontWeight: '900' },
  podcastCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, fontWeight: '700', marginTop: 4 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricsGridWide: { flexWrap: 'nowrap' },
  metricCard: { flexGrow: 1, minWidth: 140, padding: 17, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  metricIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised },
  metricValue: { color: colors.ink, fontSize: 29, fontWeight: '900', marginTop: 14 },
  metricLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', marginTop: 3, textTransform: 'uppercase' },
  statsColumns: { gap: 16 },
  statsColumnsWide: { flexDirection: 'row' },
  leaderList: { gap: 8, marginTop: 14 },
  leaderRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  leaderRank: { width: 24, color: colors.muted, fontSize: 14, fontWeight: '900', textAlign: 'center' },
  leaderAvatar: { width: 48, height: 48, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  leaderImage: { width: '100%', height: '100%' },
  leaderBody: { flex: 1 },
  leaderName: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  leaderMeta: { color: colors.muted, fontSize: 10, marginTop: 3 },
  goalsBadge: { width: 48, alignItems: 'center', paddingVertical: 7, borderRadius: radii.sm, backgroundColor: colors.yellowSoft },
  goalsValue: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  goalsLabel: { color: colors.muted, fontSize: 8, fontWeight: '800', textTransform: 'uppercase' },
  standingHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  standingHeaderClub: { flex: 1, color: colors.muted, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  standingHeaderCell: { width: 34, color: colors.muted, fontSize: 9, fontWeight: '900', textAlign: 'center' },
  standingRow: { minHeight: 47, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  standingRank: { width: 26, color: colors.muted, fontSize: 12, fontWeight: '900' },
  standingClub: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: '900' },
  standingCell: { width: 34, color: colors.muted, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  standingPoints: { width: 34, color: colors.accentStrong, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  clubTabs: { flexDirection: 'row', gap: 10 },
  clubTabActive: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 12, borderRadius: radii.md, backgroundColor: colors.accentStrong },
  clubTabActiveText: { color: colors.paper, fontSize: 13, fontWeight: '900' },
  clubTab: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 12, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  clubTabText: { color: colors.accentStrong, fontSize: 13, fontWeight: '900' },
  roleSection: { gap: 12 },
  roleHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  roleTitle: { color: colors.ink, fontSize: 23, fontWeight: '900' },
  roleCount: { minWidth: 28, height: 28, paddingHorizontal: 8, borderRadius: 14, textAlign: 'center', textAlignVertical: 'center', color: colors.paper, backgroundColor: colors.accentStrong, fontSize: 12, fontWeight: '900', overflow: 'hidden' },
  playerGrid: { gap: 12 },
  playerGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  playerCardWide: { width: '49%' },
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.lineSoft },
  navInner: { width: '100%', maxWidth: 760, alignSelf: 'center', flexDirection: 'row', minHeight: 82, paddingHorizontal: 4 },
  navItem: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 7 },
  navItemActive: { backgroundColor: colors.surfaceRaised },
  navText: { color: colors.muted, fontSize: 9, fontWeight: '900' },
  navTextActive: { color: colors.accentStrong },
  navUnderline: { position: 'absolute', left: 8, right: 8, bottom: 0, height: 4, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: colors.yellow },
  articleSafe: { flex: 1, backgroundColor: colors.canvasRaised },
  articleContent: { paddingBottom: 48 },
  articleTopBar: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, backgroundColor: colors.paper, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  articleBack: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  articleTopTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  articleTopSpacer: { width: 42 },
  articleImage: { width: '100%', height: 320 },
  articlePlaceholder: { height: 320, alignItems: 'center', justifyContent: 'center' },
  articleBody: { width: '100%', maxWidth: 800, alignSelf: 'center', padding: 22, backgroundColor: colors.surface },
  articleTitle: { color: colors.ink, fontSize: 35, lineHeight: 40, fontWeight: '900', letterSpacing: -0.8, marginTop: 8 },
  articleMeta: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 12 },
  articleLead: { color: colors.accentStrong, fontSize: 19, lineHeight: 28, fontWeight: '900', marginTop: 22 },
  articleDivider: { height: 1, backgroundColor: colors.line, marginVertical: 24 },
  articleText: { color: colors.ink, fontSize: 17, lineHeight: 29 },
  articleSourceCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radii.md, backgroundColor: colors.surfaceRaised, marginTop: 28 },
  articleSourceText: { flex: 1, color: colors.inkSoft, fontSize: 12, fontWeight: '700' },
});
