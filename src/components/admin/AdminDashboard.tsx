import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../../theme';
import { AppContent } from '../../types';
import { CalendarAdmin } from './CalendarAdmin';
import { GroupAdmin } from './GroupAdmin';
import { LiveAdmin } from './LiveAdmin';
import { MediaAdmin } from './MediaAdmin';
import { NewsAdmin } from './NewsAdmin';
import { PlayersAdmin } from './PlayersAdmin';
import { StandingsAdmin } from './StandingsAdmin';
import { Button, IconName, adminStyles } from './Primitives';

type ViewName = 'overview' | 'players' | 'news' | 'media' | 'calendar' | 'group' | 'standings' | 'live';
export function AdminDashboard({ content, onChange, onReset, onClose, onLogout, onScrollToTop }: { content: AppContent; onChange: (next: AppContent) => Promise<void>; onReset: () => Promise<void>; onClose: () => void; onLogout: () => void; onScrollToTop: () => void }) {
  const [view, setView] = useState<ViewName>('overview');
  const live = useMemo(() => content.fixtures.find((item) => item.status === 'live') ?? content.fixtures[0], [content.fixtures]);
  const tabs: Array<{ key: ViewName; label: string; icon: IconName }> = [
    { key: 'overview', label: 'Home', icon: 'view-dashboard-outline' },
    { key: 'players', label: 'Rosa', icon: 'account-group-outline' },
    { key: 'news', label: 'News', icon: 'newspaper-variant-outline' },
    { key: 'media', label: 'Media', icon: 'play-box-multiple-outline' },
    { key: 'calendar', label: 'Calendario', icon: 'calendar-month-outline' },
    { key: 'group', label: 'Girone', icon: 'table-row' },
    { key: 'standings', label: 'Classifica', icon: 'trophy-outline' },
    { key: 'live', label: 'Live', icon: 'broadcast' },
  ];
  const confirmReset = () => {
    Alert.alert('Ripristinare tutti i contenuti?', 'Il ripristino sarà permanente e visibile su tutti i dispositivi.', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Ripristina',
        style: 'destructive',
        onPress: () => {
          void onReset()
            .catch((error) => {
              console.warn('Ripristino contenuti non riuscito', error);
              Alert.alert('Ripristino non riuscito', 'I contenuti condivisi non sono stati modificati.');
            });
        },
      },
    ]);
  };
  return <View style={styles.shell}>
    <View style={styles.header}>
      <View style={styles.headerBrand}>
        <Image source={require('../../../assets/ac-prato-crest.png')} resizeMode="cover" style={styles.logo} />
        <View><Text style={styles.eyebrow}>AREA RISERVATA</Text><Text style={styles.heading}>Content Studio</Text></View>
      </View>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>{tabs.map((tab) => <Pressable key={tab.key} onPress={() => setView(tab.key)} style={[styles.tab, view === tab.key && styles.tabActive]}><MaterialCommunityIcons name={tab.icon} size={18} color={view === tab.key ? colors.paper : colors.muted} /><Text style={[styles.tabText, view === tab.key && styles.tabTextActive]}>{tab.label}</Text></Pressable>)}</ScrollView>

    {view === 'overview' ? <View style={styles.stack}>
      <View style={styles.metrics}>
        <Metric value={content.players.length} label="Calciatori" />
        <Metric value={content.news.length} label="News" />
        <Metric value={content.media.length} label="Media" />
        <Metric value={content.standings?.find((r) => r.club === 'AC Prato')?.rank ?? '-'} label="Pos. Prato" />
        <Metric value={`${live?.homeScore ?? 0}-${live?.awayScore ?? 0}`} label="Live" />
      </View>
      <View style={adminStyles.panel}>
        <Text style={adminStyles.title}>Azioni rapide</Text>
        <Button label="Pubblica una news" icon="newspaper-plus" onPress={() => setView('news')} />
        <Button label="Aggiungi un media" icon="video-plus-outline" onPress={() => setView('media')} />
        <Button label="Campionato e Coppa Italia" icon="calendar-month-outline" onPress={() => setView('calendar')} />
        <Button label="Calendario campionato (306 partite)" icon="table-row" onPress={() => setView('group')} />
        <Button label="Classifica e penalità" icon="trophy-outline" onPress={() => setView('standings')} />
        <Button label="Aggiorna la diretta" icon="broadcast" onPress={() => setView('live')} />
        <Button label="Ripristina contenuti" icon="restore" secondary onPress={confirmReset} />
        <Button label="Esci dall'area amministrativa" icon="logout" danger onPress={onLogout} />
      </View>
    </View> : null}

    {view === 'players' ? <PlayersAdmin content={content} onChange={onChange} onScrollToTop={onScrollToTop} /> : null}
    {view === 'news' ? <NewsAdmin content={content} onChange={onChange} onScrollToTop={onScrollToTop} /> : null}
    {view === 'media' ? <MediaAdmin content={content} onChange={onChange} /> : null}
    {view === 'calendar' ? <CalendarAdmin content={content} onChange={onChange} /> : null}
    {view === 'group' ? <GroupAdmin content={content} onChange={onChange} /> : null}
    {view === 'standings' ? <StandingsAdmin content={content} onChange={onChange} /> : null}
    {view === 'live' ? <LiveAdmin content={content} onChange={onChange} /> : null}
  </View>;
}
function Metric({ value, label }: { value: number | string; label: string }) { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
const styles = StyleSheet.create({ shell: { gap: 18, paddingBottom: 40 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 12 }, logo: { width: 58, height: 58, borderRadius: 17 }, eyebrow: { color: colors.yellow, fontSize: 11, fontWeight: '900' }, heading: { color: colors.ink, fontSize: 32, fontWeight: '900', marginTop: 4 }, tabsScroll: { flexGrow: 0 }, tabs: { flexDirection: 'row', gap: 7, paddingRight: 4, paddingBottom: 2 }, tab: { minWidth: 84, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 10, borderRadius: radii.md, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line }, tabActive: { backgroundColor: colors.accentStrong }, tabText: { color: colors.muted, fontSize: 10, fontWeight: '900' }, tabTextActive: { color: colors.paper }, stack: { gap: 14 }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, metric: { flexGrow: 1, minWidth: 90, padding: 15, borderRadius: radii.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line }, metricValue: { color: colors.accentStrong, fontSize: 25, fontWeight: '900' }, metricLabel: { color: colors.muted, fontSize: 11, marginTop: 3 } });
