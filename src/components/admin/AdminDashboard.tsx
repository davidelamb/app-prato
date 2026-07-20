import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../../theme';
import { AppContent } from '../../types';
import { CompetitionAdmin } from './CompetitionAdmin';
import { LiveAdmin } from './LiveAdmin';
import { MediaAdmin } from './MediaAdmin';
import { NewsAdmin } from './NewsAdmin';
import { PlayersAdmin } from './PlayersAdmin';
import { Button, IconName, adminStyles } from './Primitives';

type ViewName = 'overview' | 'players' | 'news' | 'media' | 'competition' | 'live';
export function AdminDashboard({ content, onChange, onReset, onClose }: { content: AppContent; onChange: (next: AppContent) => Promise<void>; onReset: () => Promise<void>; onClose: () => void }) {
  const [view, setView] = useState<ViewName>('overview');
  const live = useMemo(() => content.fixtures.find((item) => item.status === 'live') ?? content.fixtures[0], [content.fixtures]);
  const tabs: Array<{ key: ViewName; label: string; icon: IconName }> = [
    { key: 'overview', label: 'Home', icon: 'view-dashboard-outline' },
    { key: 'players', label: 'Rosa', icon: 'account-group-outline' },
    { key: 'news', label: 'News', icon: 'newspaper-variant-outline' },
    { key: 'media', label: 'Media', icon: 'play-box-multiple-outline' },
    { key: 'competition', label: 'Campionato', icon: 'trophy-outline' },
    { key: 'live', label: 'Live', icon: 'broadcast' },
  ];
  return <View style={styles.shell}><View style={styles.header}><View><Text style={styles.eyebrow}>AREA RISERVATA</Text><Text style={styles.heading}>Content Studio</Text></View><Pressable onPress={onClose} style={styles.close}><MaterialCommunityIcons name="close" size={22} color={colors.ink} /></Pressable></View><View style={styles.tabs}>{tabs.map((tab) => <Pressable key={tab.key} onPress={() => setView(tab.key)} style={[styles.tab, view === tab.key && styles.tabActive]}><MaterialCommunityIcons name={tab.icon} size={18} color={view === tab.key ? colors.paper : colors.muted} /><Text style={[styles.tabText, view === tab.key && styles.tabTextActive]}>{tab.label}</Text></Pressable>)}</View>
    {view === 'overview' ? <View style={styles.stack}><View style={styles.metrics}><Metric value={content.players.length} label="Calciatori" /><Metric value={content.news.length} label="News" /><Metric value={content.media.length} label="Media" /><Metric value={`${live?.homeScore ?? 0}-${live?.awayScore ?? 0}`} label="Live" /></View><View style={adminStyles.panel}><Text style={adminStyles.title}>Azioni rapide</Text><Button label="Pubblica una news" icon="newspaper-plus" onPress={() => setView('news')} /><Button label="Aggiungi un media" icon="video-plus-outline" onPress={() => setView('media')} /><Button label="Aggiorna campionato" icon="trophy-outline" onPress={() => setView('competition')} /><Button label="Aggiorna la diretta" icon="broadcast" onPress={() => setView('live')} /><Button label="Ripristina contenuti" icon="restore" secondary onPress={() => void onReset()} /></View></View> : null}
    {view === 'players' ? <PlayersAdmin content={content} onChange={onChange} /> : null}
    {view === 'news' ? <NewsAdmin content={content} onChange={onChange} /> : null}
    {view === 'media' ? <MediaAdmin content={content} onChange={onChange} /> : null}
    {view === 'competition' ? <CompetitionAdmin content={content} onChange={onChange} /> : null}
    {view === 'live' ? <LiveAdmin content={content} onChange={onChange} /> : null}
  </View>;
}
function Metric({ value, label }: { value: number | string; label: string }) { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
const styles = StyleSheet.create({ shell: { gap: 18, paddingBottom: 40 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, eyebrow: { color: colors.yellow, fontSize: 11, fontWeight: '900' }, heading: { color: colors.ink, fontSize: 32, fontWeight: '900', marginTop: 4 }, close: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line }, tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, tab: { flexGrow: 1, minWidth: 90, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 11, borderRadius: radii.md, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line }, tabActive: { backgroundColor: colors.accentStrong }, tabText: { color: colors.muted, fontSize: 11, fontWeight: '900' }, tabTextActive: { color: colors.paper }, stack: { gap: 14 }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, metric: { flexGrow: 1, minWidth: 105, padding: 15, borderRadius: radii.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line }, metricValue: { color: colors.accentStrong, fontSize: 25, fontWeight: '900' }, metricLabel: { color: colors.muted, fontSize: 11, marginTop: 3 } });
