import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { colors, radii } from '../theme';
import { AppContent, Fixture, LiveEvent, NewsArticle, Player, PlayerRole } from '../types';

type AdminView = 'overview' | 'players' | 'news' | 'live';
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
const roles: PlayerRole[] = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante'];
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function Field({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; multiline?: boolean; keyboardType?: 'default' | 'numeric' }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedDark} multiline={multiline} keyboardType={keyboardType} style={[styles.input, multiline && styles.multiline]} /></View>;
}

function Button({ label, icon, onPress, secondary = false, danger = false, disabled = false }: { label: string; icon?: IconName; onPress: () => void; secondary?: boolean; danger?: boolean; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.buttonSecondary, danger && styles.buttonDanger, disabled && styles.buttonDisabled, pressed && styles.buttonPressed]}>{icon ? <MaterialCommunityIcons name={icon} size={18} color={danger || secondary ? colors.ink : colors.canvas} /> : null}<Text style={[styles.buttonText, (secondary || danger) && styles.buttonTextSecondary]}>{label}</Text></Pressable>;
}

function Metric({ icon, value, label }: { icon: IconName; value: number | string; label: string }) {
  return <View style={styles.metric}><View style={styles.metricIcon}><MaterialCommunityIcons name={icon} size={20} color={colors.accent} /></View><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

export function AdminDashboard({ content, onChange, onReset, onClose }: { content: AppContent; onChange: (next: AppContent) => Promise<void>; onReset: () => Promise<void>; onClose: () => void }) {
  const [view, setView] = useState<AdminView>('overview');
  const liveFixture = useMemo(() => content.fixtures.find((item) => item.status === 'live') ?? content.fixtures[0], [content.fixtures]);
  const tabs: Array<{ key: AdminView; label: string; icon: IconName }> = [
    { key: 'overview', label: 'Panoramica', icon: 'view-dashboard-outline' },
    { key: 'players', label: 'Rosa', icon: 'account-group-outline' },
    { key: 'news', label: 'News', icon: 'newspaper-variant-outline' },
    { key: 'live', label: 'Live', icon: 'broadcast' },
  ];

  return <View style={styles.adminShell}>
    <View style={styles.adminHeader}>
      <View><Text style={styles.adminEyebrow}>AREA RISERVATA</Text><Text style={styles.adminHeading}>Content Studio</Text><Text style={styles.adminSubheading}>Gestisci l'app in modo semplice e visuale.</Text></View>
      <Pressable onPress={onClose} style={styles.closeButton}><MaterialCommunityIcons name="close" size={22} color={colors.ink} /></Pressable>
    </View>

    <View style={styles.adminTabs}>{tabs.map((tab) => <Pressable key={tab.key} onPress={() => setView(tab.key)} style={[styles.adminTab, view === tab.key && styles.adminTabActive]}><MaterialCommunityIcons name={tab.icon} size={19} color={view === tab.key ? colors.canvas : colors.muted} /><Text style={[styles.adminTabText, view === tab.key && styles.adminTabTextActive]}>{tab.label}</Text></Pressable>)}</View>

    {view === 'overview' ? <View style={styles.sectionStack}>
      <View style={styles.metricsGrid}><Metric icon="account-group" value={content.players.length} label="Calciatori" /><Metric icon="newspaper" value={content.news.length} label="Notizie" /><Metric icon="soccer" value={`${liveFixture?.homeScore ?? 0}-${liveFixture?.awayScore ?? 0}`} label="Risultato live" /></View>
      <View style={styles.panel}><View style={styles.panelHeadingRow}><View><Text style={styles.panelTitle}>Azioni rapide</Text><Text style={styles.panelCopy}>Apri direttamente l'area che vuoi aggiornare.</Text></View><MaterialCommunityIcons name="lightning-bolt" size={24} color={colors.warning} /></View><View style={styles.quickGrid}><Button label="Aggiungi calciatore" icon="account-plus-outline" onPress={() => setView('players')} /><Button label="Crea una news" icon="file-document-edit-outline" onPress={() => setView('news')} /><Button label="Aggiorna live" icon="broadcast" onPress={() => setView('live')} /></View></View>
      <View style={styles.panel}><Text style={styles.panelTitle}>Dati locali</Text><Text style={styles.panelCopy}>In questa fase i contenuti vengono salvati sul dispositivo. Il backend centralizzato sarà il passaggio successivo.</Text><View style={styles.inlineActions}><Button label="Ripristina demo" icon="restore" secondary onPress={() => void onReset()} /></View></View>
    </View> : null}
    {view === 'players' ? <PlayersAdmin content={content} onChange={onChange} /> : null}
    {view === 'news' ? <NewsAdmin content={content} onChange={onChange} /> : null}
    {view === 'live' ? <LiveAdmin content={content} onChange={onChange} /> : null}
  </View>;
}

const emptyPlayer: Player = { id: '', name: '', role: 'Attaccante', appearances: 0, goals: 0, assists: 0, source: 'Editoriale' };

function PlayersAdmin({ content, onChange }: { content: AppContent; onChange: (next: AppContent) => Promise<void> }) {
  const [draft, setDraft] = useState<Player>(emptyPlayer);
  const [editingId, setEditingId] = useState<string | null>(null);
  const update = <K extends keyof Player>(key: K, value: Player[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 5], quality: 0.75, base64: true });
      if (!result.canceled) {
        const asset = result.assets[0];
        const uri = asset.base64 ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` : asset.uri;
        update('imageUrl', uri);
      }
    } catch (error) {
      Alert.alert('Impossibile caricare la foto', error instanceof Error ? error.message : 'Riprova tra poco.');
    }
  };

  const edit = (player: Player) => { setEditingId(player.id); setDraft({ ...player }); };
  const reset = () => { setEditingId(null); setDraft(emptyPlayer); };
  const save = () => {
    if (!draft.name.trim()) { Alert.alert('Nome mancante', 'Inserisci il nome del calciatore.'); return; }
    const player: Player = { ...draft, id: editingId ?? makeId('player'), name: draft.name.trim(), appearances: Number(draft.appearances) || 0, goals: Number(draft.goals) || 0, assists: Number(draft.assists) || 0, source: 'Editoriale' };
    const players = editingId ? content.players.map((item) => item.id === editingId ? player : item) : [...content.players, player];
    void onChange({ ...content, players }); reset();
  };

  return <View style={styles.sectionStack}>
    <View style={styles.panel}>
      <View style={styles.panelHeadingRow}><View><Text style={styles.panelTitle}>{editingId ? 'Modifica calciatore' : 'Nuovo calciatore'}</Text><Text style={styles.panelCopy}>Foto verticale, dati personali e statistiche principali.</Text></View>{editingId ? <Pressable onPress={reset}><Text style={styles.cancelText}>Annulla</Text></Pressable> : null}</View>
      <View style={styles.photoEditor}>
        <View style={styles.photoPreview}>{draft.imageUrl ? <Image source={{ uri: draft.imageUrl }} resizeMode="cover" style={styles.photoPreviewImage} /> : <MaterialCommunityIcons name="account" size={58} color={colors.mutedDark} />}</View>
        <View style={styles.photoActions}><Button label="Carica foto" icon="image-plus" onPress={() => void pickImage()} /><Text style={styles.helpText}>La foto viene ritagliata in verticale e salvata localmente nel prototipo.</Text></View>
      </View>
      <Field label="URL foto alternativo" value={draft.imageUrl?.startsWith('data:') ? '' : draft.imageUrl ?? ''} onChangeText={(value) => update('imageUrl', value)} placeholder="https://..." />
      <View style={styles.twoCols}><Field label="Nome e cognome" value={draft.name} onChangeText={(value) => update('name', value)} /><Field label="Numero maglia" value={draft.number ? String(draft.number) : ''} onChangeText={(value) => update('number', value ? Number(value) : undefined)} keyboardType="numeric" /></View>
      <Text style={styles.fieldLabel}>Ruolo</Text><View style={styles.choiceRow}>{roles.map((role) => <Pressable key={role} onPress={() => update('role', role)} style={[styles.choice, draft.role === role && styles.choiceActive]}><Text style={[styles.choiceText, draft.role === role && styles.choiceTextActive]}>{role}</Text></Pressable>)}</View>
      <View style={styles.twoCols}><Field label="Età" value={draft.age ? String(draft.age) : ''} onChangeText={(value) => update('age', value ? Number(value) : undefined)} keyboardType="numeric" /><Field label="Nazionalità" value={draft.nationality ?? ''} onChangeText={(value) => update('nationality', value)} /></View>
      <View style={styles.twoCols}><Field label="Data di nascita" value={draft.birthDate ?? ''} onChangeText={(value) => update('birthDate', value)} placeholder="GG/MM/AAAA" /><Field label="Luogo di nascita" value={draft.birthplace ?? ''} onChangeText={(value) => update('birthplace', value)} /></View>
      <View style={styles.twoCols}><Field label="Altezza" value={draft.height ?? ''} onChangeText={(value) => update('height', value)} placeholder="1,85 m" /><Field label="Piede" value={draft.foot ?? ''} onChangeText={(value) => update('foot', value)} placeholder="Destro" /></View>
      <View style={styles.threeCols}><Field label="Presenze" value={String(draft.appearances)} onChangeText={(value) => update('appearances', Number(value))} keyboardType="numeric" /><Field label="Gol" value={String(draft.goals)} onChangeText={(value) => update('goals', Number(value))} keyboardType="numeric" /><Field label="Assist" value={String(draft.assists ?? 0)} onChangeText={(value) => update('assists', Number(value))} keyboardType="numeric" /></View>
      <View style={styles.twoCols}><Field label="Valore" value={draft.marketValue ?? ''} onChangeText={(value) => update('marketValue', value)} placeholder="€100 mila" /><Field label="Contratto fino al" value={draft.contractUntil ?? ''} onChangeText={(value) => update('contractUntil', value)} placeholder="30/06/2027" /></View>
      <Field label="Descrizione profilo" value={draft.bio ?? ''} onChangeText={(value) => update('bio', value)} multiline />
      <Button label={editingId ? 'Salva modifiche' : 'Aggiungi alla rosa'} icon="content-save-outline" onPress={save} />
    </View>

    <View style={styles.panel}><Text style={styles.panelTitle}>Rosa pubblicata</Text><Text style={styles.panelCopy}>Tocca un calciatore per modificarlo.</Text><View style={styles.adminList}>{content.players.map((player) => <Pressable key={player.id} onPress={() => edit(player)} style={styles.playerAdminRow}><View style={styles.playerThumb}>{player.imageUrl ? <Image source={{ uri: player.imageUrl }} resizeMode="cover" style={styles.playerThumbImage} /> : <MaterialCommunityIcons name="account" size={24} color={colors.mutedDark} />}</View><View style={styles.playerAdminBody}><Text style={styles.playerAdminName}>{player.name}</Text><Text style={styles.playerAdminMeta}>{player.number ? `#${player.number} · ` : ''}{player.role}</Text></View><MaterialCommunityIcons name="pencil-outline" size={20} color={colors.accent} /></Pressable>)}</View></View>
  </View>;
}

function NewsAdmin({ content, onChange }: { content: AppContent; onChange: (next: AppContent) => Promise<void> }) {
  const [title, setTitle] = useState(''); const [category, setCategory] = useState('Società'); const [summary, setSummary] = useState(''); const [body, setBody] = useState(''); const [imageUrl, setImageUrl] = useState(''); const [featured, setFeatured] = useState(false);
  const pickImage = async () => { const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16, 9], quality: 0.75, base64: true }); if (!result.canceled) { const asset = result.assets[0]; setImageUrl(asset.base64 ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` : asset.uri); } };
  const add = () => { if (!title.trim() || !summary.trim()) { Alert.alert('Campi mancanti', 'Inserisci almeno titolo e riassunto.'); return; } const article: NewsArticle = { id: makeId('news'), title: title.trim(), category: category.trim() || 'News', summary: summary.trim(), body: body.trim() || summary.trim(), imageUrl, source: 'Redazione AC Prato', publishedAt: new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()).toUpperCase(), featured }; const previous = featured ? content.news.map((item) => ({ ...item, featured: false })) : content.news; void onChange({ ...content, news: [article, ...previous] }); setTitle(''); setSummary(''); setBody(''); setImageUrl(''); setFeatured(false); };
  return <View style={styles.sectionStack}><View style={styles.panel}><Text style={styles.panelTitle}>Crea notizia</Text><Text style={styles.panelCopy}>Componi un articolo con immagine, sommario e testo completo.</Text><View style={styles.newsPreview}>{imageUrl ? <Image source={{ uri: imageUrl }} resizeMode="cover" style={styles.newsPreviewImage} /> : <MaterialCommunityIcons name="image-outline" size={48} color={colors.mutedDark} />}</View><Button label="Carica copertina" icon="image-plus" secondary onPress={() => void pickImage()} /><Field label="URL immagine alternativo" value={imageUrl.startsWith('data:') ? '' : imageUrl} onChangeText={setImageUrl} /><View style={styles.twoCols}><Field label="Titolo" value={title} onChangeText={setTitle} /><Field label="Categoria" value={category} onChangeText={setCategory} /></View><Field label="Riassunto" value={summary} onChangeText={setSummary} multiline /><Field label="Testo completo" value={body} onChangeText={setBody} multiline /><View style={styles.switchRow}><View><Text style={styles.fieldLabel}>Notizia in evidenza</Text><Text style={styles.helpText}>Comparirà per prima nella home.</Text></View><Switch value={featured} onValueChange={setFeatured} trackColor={{ false: colors.surfaceSoft, true: colors.accentStrong }} /></View><Button label="Pubblica notizia" icon="send-outline" onPress={add} /></View><View style={styles.panel}><Text style={styles.panelTitle}>Notizie pubblicate</Text><View style={styles.adminList}>{content.news.map((article) => <View key={article.id} style={styles.newsAdminRow}><View style={styles.newsAdminBody}><Text numberOfLines={2} style={styles.playerAdminName}>{article.title}</Text><Text style={styles.playerAdminMeta}>{article.category} · {article.publishedAt}</Text></View><Pressable onPress={() => void onChange({ ...content, news: content.news.filter((item) => item.id !== article.id) })} style={styles.trash}><MaterialCommunityIcons name="trash-can-outline" size={19} color={colors.live} /></Pressable></View>)}</View></View></View>;
}

function LiveAdmin({ content, onChange }: { content: AppContent; onChange: (next: AppContent) => Promise<void> }) {
  const fixture = content.fixtures.find((item) => item.status === 'live') ?? content.fixtures[0]; const [scorer, setScorer] = useState(''); const [minute, setMinute] = useState(''); const [team, setTeam] = useState<'home' | 'away'>('home');
  if (!fixture) return <Text style={styles.panelCopy}>Nessuna partita disponibile.</Text>;
  const updateFixture = (next: Fixture) => onChange({ ...content, fixtures: content.fixtures.map((item) => item.id === next.id ? next : item) });
  const systemEvent = (type: LiveEvent['type'], label: string, phase: Fixture['livePhase'], status: Fixture['status'], eventMinute: number) => { const event: LiveEvent = { id: makeId('event'), type, label, minute: eventMinute, score: `${fixture.homeScore ?? 0}-${fixture.awayScore ?? 0}`, createdAt: new Date().toISOString() }; void updateFixture({ ...fixture, livePhase: phase, status, minute: eventMinute, liveEvents: [event, ...(fixture.liveEvents ?? [])] }); };
  const goal = () => { if (!scorer.trim()) { Alert.alert('Marcatore mancante', 'Scrivi il nome del marcatore.'); return; } const homeScore = (fixture.homeScore ?? 0) + (team === 'home' ? 1 : 0); const awayScore = (fixture.awayScore ?? 0) + (team === 'away' ? 1 : 0); const teamName = team === 'home' ? fixture.home : fixture.away; const event: LiveEvent = { id: makeId('event'), type: 'goal', label: `Gol ${teamName}`, minute: minute ? Number(minute) : undefined, team: teamName, scorer: scorer.trim(), score: `${homeScore}-${awayScore}`, createdAt: new Date().toISOString() }; void updateFixture({ ...fixture, status: 'live', homeScore, awayScore, minute: minute ? Number(minute) : fixture.minute, liveEvents: [event, ...(fixture.liveEvents ?? [])] }); setScorer(''); setMinute(''); };
  return <View style={styles.sectionStack}><View style={styles.liveControlHero}><Text style={styles.adminEyebrow}>CONTROLLO PARTITA</Text><Text style={styles.liveControlTeams}>{fixture.home} – {fixture.away}</Text><Text style={styles.liveControlScore}>{fixture.homeScore ?? 0} : {fixture.awayScore ?? 0}</Text><Text style={styles.panelCopy}>{fixture.competition} · {fixture.venue}</Text></View><View style={styles.panel}><Text style={styles.panelTitle}>Fasi della partita</Text><View style={styles.quickGrid}><Button label="Inizio partita" icon="play" onPress={() => systemEvent('kickoff', 'Inizio partita', 'first_half', 'live', 1)} /><Button label="Fine primo tempo" icon="pause" secondary onPress={() => systemEvent('halftime', 'Fine primo tempo', 'halftime', 'live', 45)} /><Button label="Secondo tempo" icon="play" onPress={() => systemEvent('second_half', 'Inizio secondo tempo', 'second_half', 'live', 46)} /><Button label="Fine partita" icon="flag-checkered" secondary onPress={() => systemEvent('fulltime', 'Fine partita', 'finished', 'final', 90)} /></View></View><View style={styles.panel}><Text style={styles.panelTitle}>Registra gol</Text><Text style={styles.fieldLabel}>Squadra</Text><View style={styles.choiceRow}><Pressable onPress={() => setTeam('home')} style={[styles.choice, team === 'home' && styles.choiceActive]}><Text style={[styles.choiceText, team === 'home' && styles.choiceTextActive]}>{fixture.home}</Text></Pressable><Pressable onPress={() => setTeam('away')} style={[styles.choice, team === 'away' && styles.choiceActive]}><Text style={[styles.choiceText, team === 'away' && styles.choiceTextActive]}>{fixture.away}</Text></Pressable></View><View style={styles.twoCols}><Field label="Marcatore" value={scorer} onChangeText={setScorer} /><Field label="Minuto" value={minute} onChangeText={setMinute} keyboardType="numeric" /></View><Button label="Aggiungi gol" icon="soccer" onPress={goal} /></View><View style={styles.panel}><Text style={styles.panelTitle}>Ultimi eventi</Text><View style={styles.adminList}>{(fixture.liveEvents ?? []).map((event) => <View key={event.id} style={styles.newsAdminRow}><View style={styles.eventAdminIcon}><MaterialCommunityIcons name={event.type === 'goal' ? 'soccer' : 'circle-medium'} size={20} color={event.type === 'goal' ? colors.success : colors.accent} /></View><View style={styles.newsAdminBody}><Text style={styles.playerAdminName}>{event.label}</Text><Text style={styles.playerAdminMeta}>{event.minute ? `${event.minute}' · ` : ''}{event.scorer ?? event.score}</Text></View></View>)}</View></View></View>;
}

const styles = StyleSheet.create({
  adminShell: { gap: 18, paddingBottom: 50 },
  adminHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18 },
  adminEyebrow: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  adminHeading: { color: colors.ink, fontSize: 32, lineHeight: 37, fontWeight: '900', marginTop: 4 },
  adminSubheading: { color: colors.muted, marginTop: 5 },
  closeButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineSoft },
  adminTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 6, borderRadius: radii.lg, backgroundColor: colors.canvasRaised },
  adminTab: { flexGrow: 1, minWidth: 120, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 12, borderRadius: radii.md },
  adminTabActive: { backgroundColor: colors.accent },
  adminTabText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  adminTabTextActive: { color: colors.canvas },
  sectionStack: { gap: 16 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: { flexGrow: 1, minWidth: 150, padding: 17, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineSoft },
  metricIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  metricValue: { color: colors.ink, fontSize: 26, fontWeight: '900', marginTop: 16 },
  metricLabel: { color: colors.muted, fontSize: 12, marginTop: 3 },
  panel: { padding: 18, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineSoft },
  panelHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  panelTitle: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  panelCopy: { color: colors.muted, lineHeight: 20, marginTop: 5 },
  quickGrid: { gap: 10, marginTop: 16 },
  inlineActions: { alignItems: 'flex-start', marginTop: 16 },
  button: { minHeight: 48, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 16, borderRadius: radii.md, backgroundColor: colors.accent },
  buttonSecondary: { backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.line },
  buttonDanger: { backgroundColor: colors.liveSoft, borderWidth: 1, borderColor: colors.live },
  buttonDisabled: { opacity: 0.45 }, buttonPressed: { opacity: 0.84 },
  buttonText: { color: colors.canvas, fontWeight: '900' }, buttonTextSecondary: { color: colors.ink },
  field: { flex: 1, minWidth: 0, marginTop: 14 },
  fieldLabel: { color: colors.inkSoft, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 7 },
  input: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, color: colors.ink, backgroundColor: colors.canvasRaised, borderRadius: radii.md, borderWidth: 1, borderColor: colors.lineSoft },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  twoCols: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  threeCols: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: radii.pill, backgroundColor: colors.canvasRaised, borderWidth: 1, borderColor: colors.lineSoft },
  choiceActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  choiceText: { color: colors.muted, fontSize: 12, fontWeight: '800' }, choiceTextActive: { color: colors.canvas },
  photoEditor: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16 },
  photoPreview: { width: 112, height: 132, borderRadius: radii.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvasRaised, borderWidth: 1, borderColor: colors.line },
  photoPreviewImage: { width: '100%', height: '100%' }, photoActions: { flex: 1, gap: 9 },
  helpText: { color: colors.muted, fontSize: 11, lineHeight: 16 }, cancelText: { color: colors.accent, fontWeight: '900' },
  adminList: { gap: 8, marginTop: 15 },
  playerAdminRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radii.md, backgroundColor: colors.canvasRaised, borderWidth: 1, borderColor: colors.lineSoft },
  playerThumb: { width: 45, height: 48, borderRadius: radii.sm, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft }, playerThumbImage: { width: '100%', height: '100%' },
  playerAdminBody: { flex: 1 }, playerAdminName: { color: colors.ink, fontWeight: '900' }, playerAdminMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  newsPreview: { height: 180, marginTop: 16, marginBottom: 10, borderRadius: radii.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvasRaised, borderWidth: 1, borderColor: colors.lineSoft }, newsPreviewImage: { width: '100%', height: '100%' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginVertical: 18 },
  newsAdminRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radii.md, backgroundColor: colors.canvasRaised, borderWidth: 1, borderColor: colors.lineSoft }, newsAdminBody: { flex: 1 }, trash: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  liveControlHero: { padding: 22, borderRadius: radii.xl, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.line }, liveControlTeams: { color: colors.ink, fontSize: 20, fontWeight: '900', marginTop: 8 }, liveControlScore: { color: colors.accent, fontSize: 48, fontWeight: '900', marginTop: 5 }, eventAdminIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
});
