import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Pressable, Switch, Text, View } from 'react-native';

import { colors } from '../../theme';
import { AppContent, MediaItem, MediaKind } from '../../types';
import { Button, Field, adminStyles } from './Primitives';

const kinds: MediaKind[] = ['Highlights', 'Intervista', 'Video', 'Podcast'];
const id = () => `media-${Date.now()}`;

export function MediaAdmin({ content, onChange }: { content: AppContent; onChange: (next: AppContent) => Promise<void> }) {
  const [kind, setKind] = useState<MediaKind>('Highlights');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [url, setUrl] = useState('');
  const [source, setSource] = useState('Redazione APPrato');
  const [featured, setFeatured] = useState(false);
  const [saving, setSaving] = useState(false);

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.75,
      base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setThumbnailUrl(asset.base64
        ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`
        : asset.uri);
    }
  };

  const add = async () => {
    if (!title.trim() || !description.trim() || !thumbnailUrl.trim() || !url.trim()) {
      return Alert.alert('Campi mancanti', 'Titolo, descrizione, copertina e link sono obbligatori.');
    }
    const item: MediaItem = {
      id: id(),
      kind,
      title: title.trim(),
      description: description.trim(),
      thumbnailUrl,
      url,
      source: source.trim() || 'Redazione APPrato',
      publishedAt: new Intl.DateTimeFormat('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date()).toUpperCase(),
      featured,
    };
    const previous = featured
      ? content.media.map((entry) => ({ ...entry, featured: false }))
      : content.media;

    setSaving(true);
    try {
      await onChange({ ...content, media: [item, ...previous] });
      setTitle('');
      setDescription('');
      setThumbnailUrl('');
      setUrl('');
      setFeatured(false);
      Alert.alert('Media pubblicato', 'Il contenuto è ora disponibile su tutti i dispositivi.');
    } catch (error) {
      console.warn('Salvataggio media non riuscito', error);
      Alert.alert('Salvataggio non riuscito', 'Il media non è stato pubblicato. I campi sono rimasti compilati: riprova.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (item: MediaItem) => {
    Alert.alert('Eliminare il media?', item.title, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: () => {
          void onChange({
            ...content,
            media: content.media.filter((entry) => entry.id !== item.id),
          }).catch((error) => {
            console.warn('Eliminazione media non riuscita', error);
            Alert.alert('Eliminazione non riuscita', 'Il media non è stato rimosso.');
          });
        },
      },
    ]);
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={adminStyles.panel}>
        <Text style={adminStyles.title}>Aggiungi media</Text>
        <Text style={adminStyles.copy}>Pubblica highlights, interviste, video o podcast.</Text>
        <View style={adminStyles.preview}>
          {thumbnailUrl
            ? <Image source={{ uri: thumbnailUrl }} resizeMode="cover" style={adminStyles.previewImage} />
            : <MaterialCommunityIcons name="play-box-multiple-outline" size={54} color={colors.mutedDark} />}
        </View>
        <Button label="Carica copertina" icon="image-plus" secondary onPress={() => void pick()} />
        <Field label="URL copertina" value={thumbnailUrl.startsWith('data:') ? '' : thumbnailUrl} onChangeText={setThumbnailUrl} keyboardType="url" />
        <Text style={adminStyles.listTitle}>Tipo di contenuto</Text>
        <View style={adminStyles.choices}>
          {kinds.map((value) => (
            <Pressable key={value} onPress={() => setKind(value)} style={[adminStyles.choice, kind === value && adminStyles.choiceActive]}>
              <Text style={[adminStyles.choiceText, kind === value && adminStyles.choiceTextActive]}>{value}</Text>
            </Pressable>
          ))}
        </View>
        <Field label="Titolo" value={title} onChangeText={setTitle} />
        <Field label="Descrizione" value={description} onChangeText={setDescription} multiline />
        <View style={adminStyles.row}>
          <Field label="Link video/audio" value={url} onChangeText={setUrl} keyboardType="url" />
          <Field label="Fonte" value={source} onChangeText={setSource} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 }}>
          <Text style={adminStyles.listTitle}>In evidenza</Text>
          <Switch value={featured} onValueChange={setFeatured} trackColor={{ true: colors.accentStrong }} />
        </View>
        <Button label={saving ? 'Pubblicazione...' : 'Pubblica media'} icon="video-plus-outline" disabled={saving} onPress={() => void add()} />
      </View>

      <View style={adminStyles.panel}>
        <Text style={adminStyles.title}>Media pubblicati</Text>
        <View style={adminStyles.list}>
          {content.media.map((item) => (
            <View key={item.id} style={adminStyles.listRow}>
              <Image source={{ uri: item.thumbnailUrl }} resizeMode="cover" style={{ width: 62, height: 46, borderRadius: 9 }} />
              <View style={adminStyles.listBody}>
                <Text numberOfLines={2} style={adminStyles.listTitle}>{item.title}</Text>
                <Text style={adminStyles.listMeta}>{item.kind} · {item.source}</Text>
              </View>
              <Pressable accessibilityLabel={`Elimina ${item.title}`} onPress={() => remove(item)}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.live} />
              </Pressable>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
