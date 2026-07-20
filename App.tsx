import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { seedContent } from './src/data/seed';
import { loadContent, resetContent, saveContent } from './src/services/content-store';
import { AppContent, Fixture, FixtureStatus, NewsArticle, Player } from './src/types';

type Tab = 'home' | 'news' | 'live' | 'stats' | 'club' | 'admin';
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const tabs: Array<{ key: Tab; label: string; icon: IconName }> = [
  { key: 'home', label: 'Home', icon: 'home-variant-outline' },
  { key: 'news', label: 'News', icon: 'newspaper-variant-outline' },
  { key: 'live', label: 'Live', icon: 'broadcast' },
  { key: 'stats', label: 'Stats', icon: 'chart-bar' },
  { key: 'club', label: 'Club', icon: 'shield-outline' },
];

const roleIcon: Record<Player['role'], IconName> = {
  Portiere: 'shield-account-outline',
  Difensore: 'shield-outline',
  Centrocampista: 'transit-connection-variant',
  Attaccante: 'target',
};

const stamp = () =>
  new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date());

function statusMeta(status: FixtureStatus, minute?: number) {
  if (status === 'live') return { label: `${minute ?? 0}' LIVE`, color: colors.live };
  if (status === 'final') return { label: 'FINALE', color: colors.muted };
  return { label: 'PROSSIMA', color: colors.accent }; 
}

function AppMark() {
  return (
    <View style={styles.appMark}>
      <Image source={require('./assets/ac-prato-crest.png')} resizeMode="contain" style={styles.appMarkImage} />
    </View>
  );
}

function IconButton({ icon, label, onPress, active }: { icon: IconName; label?: string; onPress: () => void; active?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.iconButton, active && styles.iconButtonActive]}>
      <MaterialCommunityIcons name={icon} size={20} color={active ? colors.ink : colors.paper} />
    </Pressable>
  );
}

function TabButton({ item, active, onPress, compact }: { item: (typeof tabs)[number]; active: boolean; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.tabButton, compact && styles.tabButtonCompact, active && styles.tabButtonActive, compact && active && styles.tabButtonCompactActive]}>
      <MaterialCommunityIcons name={item.icon} size={compact ? 21 : 19} color={active ? colors.inkSoft : colors.muted} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
    </Pressable>
  );
}

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function FixtureCard({ fixture, featured = false }: { fixture: Fixture; featured?: boolean }) {
  const meta = statusMeta(fixture.status, fixture.minute);
  const hasScore = fixture.homeScore !== undefined && fixture.awayScore !== undefined;

  return (
    <View style={[styles.fixtureCard, featured && styles.fixtureCardFeatured]}>
      <View style={styles.fixtureTopLine}>
        <Text style={styles.fixtureCompetition}>{fixture.competition}</Text>
        <View style={[styles.statusPill, { backgroundColor: meta.color }]}>
          {fixture.status === 'live' ? <View style={styles.liveDot} /> : null}
          <Text style={styles.statusPillText}>{meta.label}</Text>
        </View>
      </View>
      <Text style={styles.fixtureMatchday}>{fixture.matchday}</Text>
      <View style={styles.scoreRow}>
        <Text numberOfLines={1} style={styles.teamName}>{fixture.home}</Text>
        <View style={styles.scoreBlock}>
          {hasScore ? (
            <Text style={styles.scoreText}>{fixture.homeScore} - {fixture.awayScore}</Text>
          ) : (
            <Text style={styles.kickoffText}>{fixture.time}</Text>
          )}
        </View>
        <Text numberOfLines={1} style={[styles.teamName, styles.teamAway]}>{fixture.away}</Text>
      </View>
      <View style={styles.fixtureFooter}>
        <Text style={styles.fixtureFooterText}>{fixture.dateLabel}  |  {fixture.venue}</Text>
      </View>
    </View>
  );
}

function StandingsTable({ content }: { content: AppContent }) {
  return (
    <View style={styles.standingsTable}>
      <View style={styles.standingsHeader}>
        <Text style={[styles.standingsHeaderText, styles.rankColumn]}>#</Text>
        <Text style={[styles.standingsHeaderText, styles.clubColumn]}>SQUADRA</Text>
        <Text style={styles.standingsHeaderText}>G</Text>
        <Text style={styles.standingsHeaderText}>PT</Text>
      </View>
      {content.standings.map((row) => (
        <View key={row.club} style={[styles.standingRow, row.club === 'Prato' && styles.standingRowPrato]}>
          <Text style={[styles.rankText, styles.rankColumn]}>{row.rank}</Text>
          <View style={styles.clubColumn}>
            <Text numberOfLines={1} style={[styles.clubText, row.club === 'Prato' && styles.clubTextPrato]}>{row.club}</Text>
            <View style={styles.formRow}>
              {row.form.slice(-5).map((item, index) => (
                <View key={`${row.club}-${index}`} style={[styles.formDot, item === 'W' ? styles.formWin : item === 'D' ? styles.formDraw : styles.formLoss]} />
              ))}
            </View>
          </View>
          <Text style={styles.playedText}>{row.played}</Text>
          <Text style={[styles.pointsText, row.club === 'Prato' && styles.pointsTextPrato]}>{row.points}</Text>
        </View>
      ))}
    </View>
  );
}

function NewsCard({ article, onPress, featured = false }: { article: NewsArticle; onPress: () => void; featured?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.newsCard, featured && styles.newsCardFeatured]}>
      <View style={styles.newsMetaRow}>
        <Text style={styles.newsCategory}>{article.category}</Text>
        <Text style={styles.newsDate}>{article.publishedAt}</Text>
      </View>
      <Text style={[styles.newsTitle, featured && styles.newsTitleFeatured]}>{article.title}</Text>
      <Text numberOfLines={featured ? 3 : 2} style={styles.newsSummary}>{article.summary}</Text>
      <View style={styles.newsSourceRow}>
        <MaterialCommunityIcons name="arrow-top-right" size={16} color={colors.inkSoft} />
        <Text style={styles.newsSource}>{article.source}</Text>
      </View>
    </Pressable>
  );
}

function LiveScoreCard({ fixture, onPress }: { fixture: Fixture; onPress?: () => void }) {
  const hasScore = fixture.homeScore !== undefined && fixture.awayScore !== undefined;

  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={styles.liveScoreCard}>
      <View style={styles.liveScoreTop}>
        <Text style={styles.liveScoreCompetition}>{fixture.competition.toUpperCase()} Â· {fixture.matchday.toUpperCase()}</Text>
        <View style={styles.liveBadge}><View style={styles.liveBadgeDot} /><Text style={styles.liveBadgeText}>{fixture.isDemo ? 'DEMO LIVE' : "LIVE"}</Text></View>
      </View>
      <View style={styles.liveTeamsRow}>
        <View style={styles.liveTeam}><AppMark /><Text style={styles.liveTeamName}>{fixture.home}</Text></View>
        <View style={styles.liveScoreCenter}>
          <Text style={styles.liveScoreValue}>{hasScore ? `${fixture.homeScore} - ${fixture.awayScore}` : fixture.time}</Text>
          <Text style={styles.liveMinute}>{fixture.status === 'live' ? `${fixture.minute ?? 0}'` : fixture.dateLabel}</Text>
        </View>
        <View style={styles.liveTeam}><View style={styles.opponentBadge}><Text style={styles.opponentBadgeText}>{fixture.away.slice(0, 1)}</Text></View><Text style={styles.liveTeamName}>{fixture.away}</Text></View>
      </View>
    </Pressable>
  );
}

function HomeScreen({ content, onTab, onNews }: { content: AppContent; onTab: (tab: Tab) => void; onNews: (news: NewsArticle) => void }) {
  const primaryFixture = content.fixtures.find((fixture) => fixture.status === 'live') ?? content.fixtures.find((fixture) => fixture.status === 'scheduled') ?? content.fixtures[0];
  const featuredNews = content.news.find((article) => article.featured) ?? content.news[0];

  return (
    <>
      <View style={styles.homeIntro}>
        <Text style={styles.pageEyebrow}>STAGIONE 2026/27</Text>
        <Text style={styles.homeTitle}>AC Prato Sport</Text>
        <Text style={styles.homeDescription}>News, live, Serie D e tutto il club in un unico posto.</Text>
      </View>
      {primaryFixture ? (
        <View style={styles.homeFixtureWrap}>
          <SectionTitle title="Partita in corso" action="Apri diretta" onAction={() => onTab('live')} />
          <LiveScoreCard fixture={primaryFixture} onPress={() => onTab('live')} />
        </View>
      ) : null}
      {featuredNews ? (
        <View style={styles.contentSection}>
          <SectionTitle title="Ultime news" action="Tutte le news" onAction={() => onTab('news')} />
          <NewsCard article={featuredNews} featured onPress={() => onNews(featuredNews)} />
        </View>
      ) : null}
      <View style={styles.contentSection}>
        <SectionTitle title="Classifica" action="Statistiche" onAction={() => onTab('stats')} />
        <StandingsTable content={content} />
      </View>
    </>
  );
}

const liveEvents: Array<{ minute: string; icon: IconName; title: string; team: string; description: string; score?: string }> = [
  { minute: '67', icon: 'information-outline', title: 'Occasione', team: 'AC PRATO', description: 'Azione pericolosa dalla destra, conclusione alta di poco.' },
  { minute: '54', icon: 'soccer', title: 'Pareggio Tau', team: 'TAU ALTOPASCIO', description: 'Conclusione dal limite dopo una respinta corta.', score: '1-1' },
  { minute: '31', icon: 'card-outline', title: 'Ammonizione Tau', team: 'TAU ALTOPASCIO', description: 'Intervento in ritardo a centrocampo.' },
  { minute: '18', icon: 'soccer', title: 'Gol AC Prato', team: 'AC PRATO', description: 'Inserimento sul primo palo e vantaggio biancazzurro.', score: '1-0' },
  { minute: '1', icon: 'information-outline', title: 'Inizio partita', team: 'SISTEMA', description: 'Partiti al Lungobisenzio.' },
];

const pitchPositions = [
  { bottom: 10, left: '37%' },
  { bottom: '27%', left: '5%' }, { bottom: '27%', left: '37%' }, { bottom: '27%', right: '5%' },
  { bottom: '48%', left: '2%' }, { bottom: '48%', left: '25%' }, { bottom: '48%', left: '49%' }, { bottom: '48%', right: '2%' },
  { top: '17%', left: '15%' }, { top: '17%', right: '15%' }, { top: '5%', left: '37%' },
] as const;

function LiveScreen({ content }: { content: AppContent }) {
  const [view, setView] = useState<'diretta' | 'formazioni' | 'tabellino'>('diretta');
  const fixture = content.fixtures.find((item) => item.status === 'live') ?? content.fixtures[0];
  const lineup = ['Furghieri', 'Berizzi', 'Polvani', 'Risaliti', 'Zanon', 'Lattarulo', 'Greselin', 'Fiorini', 'Cesari', 'Rossetti', 'Verde'];

  return (
    <View style={styles.pageSection}>
      <Text style={styles.pageEyebrow}>CENTRO PARTITA</Text>
      <Text style={styles.pageTitle}>Live</Text>
      {fixture ? <LiveScoreCard fixture={fixture} /> : null}
      <View style={styles.liveTabs}>
        {([
          ['diretta', 'broadcast', 'Diretta'],
          ['formazioni', 'account-group-outline', 'Formazioni'],
          ['tabellino', 'text-box-outline', 'Tabellino'],
        ] as Array<[typeof view, IconName, string]>).map(([key, icon, label]) => (
          <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: view === key }} onPress={() => setView(key)} style={[styles.liveTab, view === key && styles.liveTabActive]}>
            <MaterialCommunityIcons name={icon} size={16} color={view === key ? colors.inkSoft : colors.muted} />
            <Text style={[styles.liveTabText, view === key && styles.liveTabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {view === 'diretta' ? <View style={styles.liveEventStack}>{liveEvents.map((event) => <View key={`${event.minute}-${event.title}`} style={styles.liveEventCard}><View style={styles.eventMinute}><Text style={styles.eventMinuteText}>{event.minute}'</Text></View><View style={styles.eventIcon}><MaterialCommunityIcons name={event.icon} size={20} color={event.icon === 'soccer' ? colors.success : colors.inkSoft} /></View><View style={styles.eventContent}><Text style={styles.eventTitle}>{event.title}</Text><Text style={styles.eventTeam}>{event.team}</Text><Text style={styles.eventDescription}>{event.description}</Text>{event.score ? <View style={styles.eventScore}><Text style={styles.eventScoreText}>{event.score}</Text></View> : null}</View></View>)}</View> : null}
      {view === 'formazioni' ? <View style={styles.formationPanel}><View style={styles.formationTitleRow}><Text style={styles.formationTitle}>AC Prato</Text><View style={styles.formationPill}><Text style={styles.formationPillText}>3-5-2</Text></View></View><View style={styles.pitch}><View style={styles.pitchBoxTop} /><View style={styles.pitchMidLine} /><View style={styles.pitchCircle} />{lineup.map((player, index) => <View key={player} style={[styles.pitchPlayer, pitchPositions[index]]}><Text numberOfLines={1} style={styles.pitchPlayerText}>{player}</Text></View>)}</View><Text style={styles.formationNote}>Formazione dimostrativa. Il pannello admin potra confermare titolari e panchina.</Text></View> : null}
      {view === 'tabellino' ? <View style={styles.matchSheet}><View style={styles.matchSheetRow}><Text style={styles.matchSheetLabel}>Modulo</Text><Text style={styles.matchSheetValue}>3-5-2</Text></View><View style={styles.matchSheetRow}><Text style={styles.matchSheetLabel}>Stadio</Text><Text style={styles.matchSheetValue}>Lungobisenzio</Text></View><View style={styles.matchSheetRow}><Text style={styles.matchSheetLabel}>Marcatori</Text><Text style={styles.matchSheetValue}>18' AC Prato Â· 54' Tau</Text></View><Text style={styles.matchSheetNote}>I dati di questa partita sono dimostrativi.</Text></View> : null}
    </View>
  );
}

function StatsScreen({ content }: { content: AppContent }) {
  const [filter, setFilter] = useState<'all' | FixtureStatus>('all');
  const visibleFixtures = content.fixtures.filter((fixture) => filter === 'all' || fixture.status === filter);
  const filters: Array<{ key: 'all' | FixtureStatus; label: string }> = [
    { key: 'all', label: 'Tutte' },
    { key: 'scheduled', label: 'Prossime' },
    { key: 'final', label: 'Risultati' },
  ];

  return (
    <View style={styles.pageSection}>
      <Text style={styles.pageEyebrow}>SERIE D - GIRONE E</Text>
      <Text style={styles.pageTitle}>Statistiche</Text>
      <View style={styles.filterRow}>
        {filters.map((item) => (
          <Pressable key={item.key} accessibilityRole="button" onPress={() => setFilter(item.key)} style={[styles.filterButton, filter === item.key && styles.filterButtonActive]}>
            <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.stack}>
        {visibleFixtures.map((fixture) => <FixtureCard key={fixture.id} fixture={fixture} />)}
      </View>
      <SectionTitle title="Classifica" />
      <StandingsTable content={content} />
    </View>
  );
}

function ClubScreen({ content, onAdmin }: { content: AppContent; onAdmin: () => void }) {
  const [role, setRole] = useState<Player['role'] | 'Tutti'>('Tutti');
  const [section, setSection] = useState<'rosa' | 'media' | 'tifosi' | 'stadio'>('rosa');
  const roles: Array<Player['role'] | 'Tutti'> = ['Tutti', 'Portiere', 'Difensore', 'Centrocampista', 'Attaccante'];
  const players = content.players.filter((player) => role === 'Tutti' || player.role === role);

  return (
    <View style={styles.pageSection}>
      <Text style={styles.pageEyebrow}>IL MONDO AC PRATO</Text>
      <Text style={styles.pageTitle}>Club</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.clubTabs}>
        {([
          ['rosa', 'account-group-outline', 'Rosa'],
          ['media', 'image-multiple-outline', 'Media'],
          ['tifosi', 'heart-outline', 'Tifosi'],
          ['stadio', 'ticket-outline', 'Stadio'],
        ] as Array<[typeof section, IconName, string]>).map(([key, icon, label]) => (
          <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: section === key }} onPress={() => setSection(key)} style={[styles.clubTab, section === key && styles.clubTabActive]}>
            <MaterialCommunityIcons name={icon} size={18} color={section === key ? colors.paper : colors.inkSoft} />
            <Text style={[styles.clubTabText, section === key && styles.clubTabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {section === 'rosa' ? <><View style={styles.rosterSource}><MaterialCommunityIcons name="database-check-outline" size={17} color={colors.inkSoft} /><Text style={styles.rosterSourceText}>Rosa 2025/26 Â· dati pubblici Transfermarkt</Text></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalFilters}>{roles.map((item) => (<Pressable key={item} accessibilityRole="button" onPress={() => setRole(item)} style={[styles.filterButton, role === item && styles.filterButtonActive]}><Text style={[styles.filterText, role === item && styles.filterTextActive]}>{item}</Text></Pressable>))}</ScrollView><View style={styles.playerGrid}>{players.map((player) => (<View key={player.id} style={styles.playerCard}><View style={styles.playerNumber}><Text style={styles.playerNumberText}>{player.number}</Text></View><View style={styles.playerBody}><View style={styles.playerRoleRow}><MaterialCommunityIcons name={roleIcon[player.role]} size={15} color={colors.inkSoft} /><Text style={styles.playerRole}>{player.role}</Text></View><Text style={styles.playerName}>{player.name}</Text><Text style={styles.playerStat}>{player.age ? `${player.age} anni` : 'Eta da confermare'}  |  {player.marketValue ?? 'Valore non disponibile'}</Text></View><View style={styles.playerSource}><Text style={styles.playerSourceText}>TM</Text></View></View>))}</View></> : null}
      {section === 'media' ? <View style={styles.clubContent}><Text style={styles.clubContentTitle}>Media</Text><View style={styles.mediaRow}><View style={styles.mediaThumb}><MaterialCommunityIcons name="image-outline" size={30} color={colors.inkSoft} /></View><View style={styles.mediaCopy}><Text style={styles.mediaTitle}>Allenamento al Lungobisenzio</Text><Text style={styles.mediaDescription}>Galleria e contenuti pubblicati dal club.</Text></View></View><View style={styles.mediaRow}><View style={styles.mediaThumb}><MaterialCommunityIcons name="play-circle-outline" size={30} color={colors.inkSoft} /></View><View style={styles.mediaCopy}><Text style={styles.mediaTitle}>Highlights e interviste</Text><Text style={styles.mediaDescription}>Video collegabili dall'area editoriale.</Text></View></View></View> : null}
      {section === 'tifosi' ? <View style={styles.clubContent}><Text style={styles.clubContentTitle}>Spazio tifosi</Text><Text style={styles.clubBody}>Votazioni, commenti moderati, quiz e iniziative …4038 tokens truncated…00', letterSpacing: 0, marginTop: 2 },
  sidebarBrandName: { color: colors.paper, fontWeight: '900', fontSize: 17, letterSpacing: 0 },
  sidebarBrandSubline: { color: '#A5C2D9', fontSize: 9, fontWeight: '700', letterSpacing: 0, marginTop: 2 },
  sidebarTabs: { gap: 8, marginTop: 44 },
  sidebarFoot: { borderTopWidth: 1, borderTopColor: '#1C5B92', paddingTop: 16 },
  sidebarFootText: { color: colors.paper, fontSize: 11, fontWeight: '800', letterSpacing: 0 },
  sidebarFootMeta: { color: colors.muted, fontSize: 11, marginTop: 4 },
  mainPanel: { flex: 1, minWidth: 0, backgroundColor: colors.surfaceLight },
  topBar: { minHeight: 76, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.paper, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBarTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerOnlineDot: { width: 13, height: 13, borderRadius: 99, backgroundColor: '#1FA675' },
  iconButton: { width: 38, height: 38, borderWidth: 1, borderColor: '#3775A9', backgroundColor: '#0D4C83', alignItems: 'center', justifyContent: 'center', borderRadius: 5 },
  iconButtonActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  scrollArea: { flex: 1 },
  scrollContent: { paddingBottom: 112 },
  scrollContentWide: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: 32, paddingTop: 28, paddingBottom: 40 },
  bottomNav: { height: 72, flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.paper, paddingHorizontal: 4, paddingTop: 7 },
  tabButton: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 43, paddingHorizontal: 11, borderRadius: 5 },
  tabButtonCompact: { flex: 1, flexDirection: 'column', justifyContent: 'center', gap: 3, paddingHorizontal: 2, minWidth: 0 },
  tabButtonActive: { backgroundColor: '#E5F4FE' },
  tabButtonCompactActive: { borderBottomWidth: 3, borderBottomColor: colors.accent },
  tabLabel: { color: colors.muted, fontSize: 13, fontWeight: '700', letterSpacing: 0 },
  tabLabelActive: { color: colors.ink },
  homeIntro: { paddingHorizontal: 20, paddingTop: 27 },
  homeTitle: { color: colors.ink, fontSize: 31, lineHeight: 36, fontWeight: '900' },
  homeDescription: { color: colors.muted, marginTop: 6, fontSize: 14, lineHeight: 20, maxWidth: 360 },
  homeFixtureWrap: { paddingHorizontal: 20, paddingTop: 24 },
  contentSection: { paddingHorizontal: 20, paddingTop: 28 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '900', lineHeight: 24 },
  sectionAction: { color: colors.inkSoft, fontWeight: '800', fontSize: 12 },
  liveScoreCard: { backgroundColor: colors.inkSoft, borderRadius: 9, padding: 16, borderWidth: 1, borderColor: '#0B72B8' },
  liveScoreTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  liveScoreCompetition: { color: colors.accent, fontSize: 10, fontWeight: '900', flex: 1 },
  liveBadge: { minHeight: 23, paddingHorizontal: 8, borderRadius: 12, backgroundColor: '#FFF5F5', flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveBadgeDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: colors.live },
  liveBadgeText: { color: colors.live, fontSize: 9, fontWeight: '900' },
  liveTeamsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, gap: 8 },
  liveTeam: { width: '30%', alignItems: 'center', gap: 7 },
  liveTeamName: { color: colors.paper, fontSize: 12, fontWeight: '900', textAlign: 'center' },
  opponentBadge: { width: 36, height: 42, borderRadius: 5, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  opponentBadgeText: { color: colors.inkSoft, fontSize: 20, fontWeight: '900' },
  liveScoreCenter: { width: '35%', alignItems: 'center' },
  liveScoreValue: { color: colors.paper, fontSize: 30, fontWeight: '900' },
  liveMinute: { color: colors.accent, fontSize: 18, fontWeight: '900', marginTop: 2 },
  fixtureCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 6, padding: 16 },
  fixtureCardFeatured: { borderColor: '#8AB6D5', backgroundColor: '#F5FAFE' },
  fixtureTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  fixtureCompetition: { color: colors.ink, fontSize: 11, fontWeight: '800', flex: 1 },
  statusPill: { minHeight: 22, paddingHorizontal: 7, borderRadius: 3, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  statusPillText: { color: colors.ink, fontSize: 9, fontWeight: '900' },
  liveDot: { width: 5, height: 5, borderRadius: 99, backgroundColor: colors.ink },
  fixtureMatchday: { color: colors.muted, fontSize: 11, marginTop: 6 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24 },
  teamName: { color: colors.ink, fontSize: 16, fontWeight: '800', flex: 1, minWidth: 0 },
  teamAway: { textAlign: 'right' },
  scoreBlock: { minWidth: 64, alignItems: 'center' },
  scoreText: { color: colors.inkSoft, fontSize: 24, fontWeight: '900' },
  kickoffText: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  fixtureFooter: { marginTop: 22, paddingTop: 11, borderTopWidth: 1, borderTopColor: colors.borderLight },
  fixtureFooterText: { color: colors.muted, fontSize: 11 },
  standingsTable: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 6, overflow: 'hidden' },
  standingsHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, height: 32, backgroundColor: colors.ink },
  standingsHeaderText: { color: colors.paper, fontSize: 10, fontWeight: '800', textAlign: 'center', width: 28 },
  rankColumn: { width: 28, textAlign: 'left' },
  clubColumn: { flex: 1, minWidth: 0 },
  standingRow: { flexDirection: 'row', alignItems: 'center', minHeight: 57, paddingHorizontal: 13, borderTopWidth: 1, borderTopColor: colors.borderLight },
  standingRowPrato: { backgroundColor: '#FFF9D5' },
  rankText: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  clubText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  clubTextPrato: { color: colors.ink, fontWeight: '900' },
  formRow: { flexDirection: 'row', gap: 4, marginTop: 5 },
  formDot: { width: 6, height: 6, borderRadius: 99 },
  formWin: { backgroundColor: colors.success },
  formDraw: { backgroundColor: colors.muted },
  formLoss: { backgroundColor: colors.live },
  playedText: { color: colors.ink, width: 28, fontSize: 13, textAlign: 'center' },
  pointsText: { color: colors.ink, width: 28, fontWeight: '900', fontSize: 13, textAlign: 'center' },
  pointsTextPrato: { color: colors.inkSoft },
  pageSection: { paddingHorizontal: 20, paddingTop: 27 },
  pageEyebrow: { color: colors.inkSoft, fontSize: 11, fontWeight: '900', marginBottom: 7 },
  pageTitle: { color: colors.ink, fontSize: 30, lineHeight: 35, fontWeight: '900' },
  pageDescription: { color: colors.muted, marginTop: 8, lineHeight: 20, fontSize: 14, maxWidth: 580 },
  liveTabs: { height: 51, flexDirection: 'row', backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: 7, marginTop: 14, overflow: 'hidden' },
  liveTab: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  liveTabActive: { backgroundColor: '#F5FAFE', borderBottomColor: colors.accent },
  liveTabText: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  liveTabTextActive: { color: colors.inkSoft },
  liveEventStack: { gap: 10, paddingTop: 14 },
  liveEventCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, padding: 13, borderRadius: 7, gap: 9 },
  eventMinute: { minWidth: 45, height: 33, borderRadius: 6, backgroundColor: '#FFF5C8', alignItems: 'center', justifyContent: 'center' },
  eventMinuteText: { color: colors.ink, fontWeight: '900', fontSize: 14 },
  eventIcon: { height: 33, width: 33, borderRadius: 99, backgroundColor: '#E8F5FF', alignItems: 'center', justifyContent: 'center' },
  eventContent: { flex: 1, minWidth: 0 },
  eventTitle: { color: colors.ink, fontWeight: '900', fontSize: 14 },
  eventTeam: { color: colors.muted, fontWeight: '900', fontSize: 10, marginTop: 2 },
  eventDescription: { color: colors.ink, fontSize: 13, lineHeight: 18, marginTop: 6 },
  eventScore: { alignSelf: 'flex-start', backgroundColor: colors.inkSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, marginTop: 8 },
  eventScoreText: { color: colors.paper, fontSize: 13, fontWeight: '900' },
  formationPanel: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: 7, marginTop: 14, padding: 10 },
  formationTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, paddingBottom: 9 },
  formationTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  formationPill: { backgroundColor: '#E5F4FE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  formationPillText: { color: colors.inkSoft, fontSize: 11, fontWeight: '900' },
  pitch: { height: 430, backgroundColor: '#197542', borderRadius: 6, overflow: 'hidden', borderColor: '#54A879', borderWidth: 1, position: 'relative' },
  pitchBoxTop: { position: 'absolute', width: '38%', height: '12%', borderWidth: 1, borderColor: '#B7E4C7', borderTopWidth: 0, top: 0, left: '31%' },
  pitchMidLine: { position: 'absolute', top: '50%', width: '100%', borderTopWidth: 1, borderColor: '#B7E4C7' },
  pitchCircle: { position: 'absolute', top: '40%', left: '37%', height: 86, width: 86, borderRadius: 99, borderWidth: 1, borderColor: '#B7E4C7' },
  pitchPlayer: { position: 'absolute', width: 82, minHeight: 34, backgroundColor: '#0B2D24', paddingHorizontal: 5, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  pitchPlayerText: { color: colors.paper, fontWeight: '800', fontSize: 9, textAlign: 'center' },
  formationNote: { color: colors.muted, fontSize: 11, lineHeight: 16, paddingHorizontal: 4, paddingTop: 10, paddingBottom: 2 },
  matchSheet: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: 7, marginTop: 14, paddingHorizontal: 15 },
  matchSheetRow: { minHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  matchSheetLabel: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  matchSheetValue: { color: colors.ink, fontSize: 13, fontWeight: '900', flex: 1, textAlign: 'right' },
  matchSheetNote: { color: colors.muted, fontSize: 11, paddingVertical: 13 },
  filterRow: { flexDirection: 'row', gap: 8, marginVertical: 20, flexWrap: 'wrap' },
  horizontalFilters: { gap: 8, paddingVertical: 20, paddingRight: 20 },
  filterButton: { minHeight: 34, paddingHorizontal: 11, justifyContent: 'center', borderColor: colors.border, borderWidth: 1, borderRadius: 4, backgroundColor: colors.surface },
  filterButtonActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  filterTextActive: { color: colors.ink },
  stack: { gap: 10, marginBottom: 28 },
  clubTabs: { gap: 8, paddingTop: 18, paddingBottom: 14, paddingRight: 20 },
  clubTab: { minHeight: 44, paddingHorizontal: 14, borderRadius: 7, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper, flexDirection: 'row', alignItems: 'center', gap: 7 },
  clubTabActive: { backgroundColor: colors.inkSoft, borderColor: colors.inkSoft },
  clubTabText: { color: colors.inkSoft, fontSize: 13, fontWeight: '900' },
  clubTabTextActive: { color: colors.paper },
  rosterSource: { flexDirection: 'row', gap: 7, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#EAF6FF', alignSelf: 'flex-start' },
  rosterSourceText: { color: colors.inkSoft, fontSize: 11, fontWeight: '800' },
  playerGrid: { gap: 10 },
  playerCard: { flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 6, overflow: 'hidden', minHeight: 95 },
  playerNumber: { width: 63, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  playerNumberText: { color: colors.accent, fontSize: 29, fontWeight: '900' },
  playerBody: { flex: 1, padding: 13, justifyContent: 'center' },
  playerRoleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  playerRole: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  playerName: { color: colors.ink, fontSize: 16, fontWeight: '900', marginTop: 4 },
  playerStat: { color: colors.muted, fontSize: 11, marginTop: 5 },
  playerSource: { width: 36, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: colors.borderLight },
  playerSourceText: { color: colors.inkSoft, fontSize: 10, fontWeight: '900' },
  clubContent: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16, marginTop: 2 },
  clubContentTitle: { color: colors.ink, fontSize: 22, fontWeight: '900', marginBottom: 14 },
  clubBody: { color: colors.muted, fontSize: 15, lineHeight: 22, maxWidth: 480 },
  mediaRow: { flexDirection: 'row', gap: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.borderLight, paddingVertical: 12 },
  mediaThumb: { width: 76, height: 62, backgroundColor: '#EAF6FF', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  mediaCopy: { flex: 1, minWidth: 0 },
  mediaTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  mediaDescription: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 4 },
  stadiumName: { color: colors.ink, fontSize: 18, fontWeight: '900', marginBottom: 8 },
  ticketInfo: { marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 13 },
  ticketLabel: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  ticketPrice: { color: colors.inkSoft, fontSize: 18, fontWeight: '900' },
  newsCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16, borderRadius: 6 },
  newsCardFeatured: { backgroundColor: '#FFF9D5', borderColor: '#F6DC64' },
  newsMetaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  newsCategory: { color: colors.inkSoft, fontSize: 10, fontWeight: '900' },
  newsDate: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  newsTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', lineHeight: 22 },
  newsTitleFeatured: { color: colors.ink },
  newsSummary: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 8 },
  newsSourceRow: { alignSelf: 'flex-start', marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 5 },
  newsSource: { color: colors.inkSoft, fontSize: 11, fontWeight: '800' },
  adminLocked: { flex: 1, alignItems: 'flex-start', justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 80, maxWidth: 540 },
  adminLockIcon: { width: 58, height: 58, backgroundColor: '#FFF9D5', borderWidth: 1, borderColor: '#F6DC64', alignItems: 'center', justifyContent: 'center', borderRadius: 6, marginBottom: 18 },
  adminLockedText: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 10, maxWidth: 340 },
  primaryButton: { minHeight: 43, backgroundColor: colors.accent, borderRadius: 4, paddingHorizontal: 14, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 20 },
  primaryButtonText: { color: colors.ink, fontWeight: '900', fontSize: 11 },
  securityHint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 18, maxWidth: 340 },
  adminHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 18 },
  adminOnline: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#202B20', borderRadius: 3 },
  onlineDot: { height: 6, width: 6, borderRadius: 99, backgroundColor: colors.success },
  adminOnlineText: { color: colors.success, fontSize: 10, fontWeight: '900' },
  notice: { backgroundColor: '#1D2A1B', borderColor: '#385E35', borderWidth: 1, borderRadius: 5, minHeight: 42, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  noticeText: { color: '#DDEAD9', fontSize: 13, fontWeight: '700' },
  adminCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 16, marginBottom: 13 },
  adminCardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14 },
  adminCardTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  adminCardSubtitle: { color: colors.muted, fontSize: 12, marginTop: 3, lineHeight: 17 },
  scoreEditor: { flexDirection: 'row', alignItems: 'center', gap: 9, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 14 },
  scoreEditorTeam: { flex: 1, alignItems: 'center', minWidth: 0 },
  scoreEditorName: { color: colors.ink, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  scoreEditorNumber: { color: colors.inkSoft, fontSize: 38, fontWeight: '900', marginVertical: 5 },
  scoreEditorDivider: { color: colors.muted, fontSize: 25, fontWeight: '900', paddingBottom: 18 },
  scoreEditButtons: { flexDirection: 'row', gap: 6 },
  input: { minHeight: 44, borderWidth: 1, borderColor: colors.border, backgroundColor: '#F6FAFD', color: colors.ink, borderRadius: 4, paddingHorizontal: 12, fontSize: 14, marginTop: 9 },
  textarea: { minHeight: 92, paddingTop: 12, textAlignVertical: 'top' },
  secondaryButton: { minHeight: 41, borderColor: colors.ink, backgroundColor: colors.ink, borderWidth: 1, borderRadius: 4, flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 13, marginTop: 2 },
  secondaryButtonText: { color: colors.paper, fontWeight: '900', fontSize: 11 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingVertical: 17, borderBottomWidth: 1, borderBottomColor: colors.border },
  settingsTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  settingsDescription: { color: colors.muted, fontSize: 12, marginTop: 3 },
  adminFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 16, paddingBottom: 6 },
  updatedText: { color: colors.muted, fontSize: 11, flex: 1 },
  resetText: { color: '#F2A2A5', fontSize: 12, fontWeight: '800' },
  modalSafe: { flex: 1, backgroundColor: colors.paper },
  modalHeader: { height: 66, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1C5B92', backgroundColor: colors.ink },
  modalHeaderTitle: { color: colors.paper, fontSize: 12, fontWeight: '900' },
  modalSpacer: { width: 38 },
  modalContent: { padding: 24, maxWidth: 720, width: '100%', alignSelf: 'center' },
  modalTitle: { color: colors.ink, fontWeight: '900', fontSize: 30, lineHeight: 36, marginTop: 10 },
  modalDate: { color: colors.muted, fontSize: 12, marginTop: 12 },
  modalRule: { height: 3, width: 58, backgroundColor: colors.accent, marginTop: 28, marginBottom: 22 },
  modalBody: { color: colors.ink, fontSize: 17, lineHeight: 27 },
  modalNote: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 26 },
});
