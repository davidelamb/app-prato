import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';

import { colors } from '../../theme';
import { AppContent, Player, PlayerRole } from '../../types';
import { nationalityList } from '../../utils/nationality';
import { playerImageStyle } from '../../utils/player-image';
import { NationalityBadge } from '../NationalityBadge';
import { PlayerPhotoEditor } from './PlayerPhotoEditor';
import { Button, Field, adminStyles } from './Primitives';

const roles: PlayerRole[] = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante'];
const empty: Player = { id: '', name: '', role: 'Attaccante', appearances: 0, goals: 0, assists: 0, source: 'Editoriale', imageScale: 1, imagePositionX: 0, imagePositionY: 0 };
const id = () => `player-${Date.now()}`;
const nationalityValue = (value?: string | string[]) => nationalityList(value).join(', ');
const parsedNationality = (value?: string | string[]) => {
  const raw = Array.isArray(value) ? value : String(value ?? '').split(',');
  const nations = raw.map((nation) => nation.trim()).filter(Boolean);
  return nations.length > 1 ? nations : nations[0];
};

export function PlayersAdmin({ content, onChange, onScrollToTop }: { content: AppContent; onChange: (next: AppContent) => Promise<void>; onScrollToTop?: () => void }) {
  const [draft, setDraft] = useState<Player>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const update = <K extends keyof Player>(key: K, value: Player[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 5], quality: 0.75, base64: true });
    if (!result.canceled) {
      const asset = result.assets[0];
      update('imageUrl', asset.base64 ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` : asset.uri);
      update('imageSourceUrl', 'Foto caricata dal pannello admin');
    }
  };

  const reset = () => { setDraft(empty); setEditing(null); };
  const save = async () => {
    if (!draft.name.trim()) return Alert.alert('Nome mancante', 'Inserisci il nome del calciatore.');
    const num = Number(draft.number);
    if (draft.number !== undefined && draft.number !== null && !(Number.isInteger(num) && num >= 1 && num <= 99)) {
      return Alert.alert('Numero non valido', 'Inserisci un numero intero tra 1 e 99 oppure lascia il campo vuoto.');
    }
    const player: Player = {
      ...draft,
      id: editing ?? id(),
      name: draft.name.trim(),
      appearances: Number(draft.appearances) || 0,
      goals: Number(draft.goals) || 0,
      assists: Number(draft.assists) || 0,
      age: draft.age ? Number(draft.age) : undefined,
      nationality: parsedNationality(draft.nationality),
      imageScale: Math.max(1, Number(draft.imageScale) || 1),
      imagePositionX: Number(draft.imagePositionX) || 0,
      imagePositionY: Number(draft.imagePositionY) || 0,
      source: 'Editoriale',
    };
    const players = editing ? content.players.map((item) => item.id === editing ? player : item) : [...content.players, player];
    setSaving(true);
    setSaveMessage('');
    try {
      await onChange({ ...content, players });
      setSaveMessage(`Modifiche di ${player.name} salvate.`);
      reset();
    } catch (error) {
      console.warn('Salvataggio calciatore non riuscito', error);
      setSaveMessage('Salvataggio non riuscito. Riprova senza chiudere la scheda.');
      Alert.alert('Errore di salvataggio', 'La scheda non è stata salvata. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  return <View style={{ gap: 14 }}>
    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>{editing ? 'Modifica calciatore' : 'Nuovo calciatore'}</Text>
      <Button label="Carica foto" icon="image-plus" secondary onPress={() => void pick()} />
      <Field label="URL foto" value={draft.imageUrl?.startsWith('data:') ? '' : draft.imageUrl ?? ''} onChangeText={(value) => update('imageUrl', value)} keyboardType="url" />
      {draft.imageUrl ? (
        <PlayerPhotoEditor
          imageUrl={draft.imageUrl}
          value={{ imageScale: draft.imageScale, imagePositionX: draft.imagePositionX, imagePositionY: draft.imagePositionY }}
          onChange={(next) => setDraft((current) => ({ ...current, ...next }))}
        />
      ) : (
        <View style={[adminStyles.preview, { overflow: 'hidden' }]}><MaterialCommunityIcons name="account" size={60} color={colors.mutedDark} /></View>
      )}
      <View style={adminStyles.row}><Field label="Nome" value={draft.name} onChangeText={(value) => update('name', value)} /><Field label="Numero" value={draft.number ? String(draft.number) : ''} onChangeText={(value) => update('number', value ? Number(value) : undefined)} keyboardType="numeric" /></View>
      <View style={adminStyles.choices}>{roles.map((role) => <Pressable key={role} onPress={() => update('role', role)} style={[adminStyles.choice, draft.role === role && adminStyles.choiceActive]}><Text style={[adminStyles.choiceText, draft.role === role && adminStyles.choiceTextActive]}>{role}</Text></Pressable>)}</View>
      <View style={adminStyles.row}><Field label="Nazionalità (separate da virgola)" value={nationalityValue(draft.nationality)} onChangeText={(value) => update('nationality', value)} /><Field label="Età" value={draft.age ? String(draft.age) : ''} onChangeText={(value) => update('age', value ? Number(value) : undefined)} keyboardType="numeric" /></View>
      <View style={adminStyles.row}><Field label="Data di nascita" value={draft.birthDate ?? ''} onChangeText={(value) => update('birthDate', value)} /><Field label="Luogo di nascita" value={draft.birthplace ?? ''} onChangeText={(value) => update('birthplace', value)} /></View>
      <View style={adminStyles.row}><Field label="Altezza" value={draft.height ?? ''} onChangeText={(value) => update('height', value)} /><Field label="Piede" value={draft.foot ?? ''} onChangeText={(value) => update('foot', value)} /></View>
      <View style={adminStyles.row}><Field label="Contratto fino al" value={draft.contractUntil ?? ''} onChangeText={(value) => update('contractUntil', value)} /><Field label="Valore indicativo" value={draft.marketValue ?? ''} onChangeText={(value) => update('marketValue', value)} /></View>
      <Field label="Fonte foto" value={draft.imageSourceUrl ?? ''} onChangeText={(value) => update('imageSourceUrl', value)} />
      <View style={adminStyles.row}><Field label="Presenze" value={String(draft.appearances)} onChangeText={(value) => update('appearances', Number(value))} keyboardType="numeric" /><Field label="Gol" value={String(draft.goals)} onChangeText={(value) => update('goals', Number(value))} keyboardType="numeric" /><Field label="Assist" value={String(draft.assists ?? 0)} onChangeText={(value) => update('assists', Number(value))} keyboardType="numeric" /></View>
      <Field label="Profilo" value={draft.bio ?? ''} onChangeText={(value) => update('bio', value)} multiline />
      <Button label={saving ? 'Salvataggio...' : editing ? 'Salva modifiche' : 'Aggiungi alla rosa'} icon="content-save-outline" disabled={saving} onPress={() => void save()} />
      {saveMessage ? <Text style={{ color: saveMessage.startsWith('Modifiche') ? colors.success : colors.live, fontSize: 12, fontWeight: '800', marginTop: 8, textAlign: 'center' }}>{saveMessage}</Text> : null}
    </View>

    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Rosa pubblicata</Text>
      <View style={adminStyles.list}>{content.players.map((player) => <Pressable key={player.id} onPress={() => { setEditing(player.id); setDraft({ ...player, imageScale: player.imageScale ?? 1, imagePositionX: player.imagePositionX ?? 0, imagePositionY: player.imagePositionY ?? 0 }); onScrollToTop?.(); }} style={adminStyles.listRow}>
        <View style={{ width: 46, height: 50, overflow: 'hidden', borderRadius: 10, backgroundColor: colors.surfaceSoft }}>{player.imageUrl ? <Image source={{ uri: player.imageUrl }} resizeMode="cover" style={[{ width: '100%', height: '100%' }, playerImageStyle(player)]} /> : null}</View>
        <View style={adminStyles.listBody}><Text style={adminStyles.listTitle}>{player.name}</Text><Text style={adminStyles.listMeta}>{player.number ? `#${player.number} · ` : ''}{player.role}</Text></View>
        <NationalityBadge value={player.nationality} compact />
        <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.accentStrong} />
      </Pressable>)}</View>
    </View>
  </View>;
}
