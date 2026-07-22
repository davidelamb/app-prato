import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import {
  Alert,
  Image,
  PanResponder,
  Pressable,
  Switch,
  Text,
  View,
} from 'react-native';
import { colors, radii } from '../../theme';
import { AppContent, NewsArticle } from '../../types';
import { imageTransformStyle } from '../../utils/player-image';
import { Button, Field, adminStyles } from './Primitives';

const id = () => `news-${Date.now()}`;

const EMPTY_ARTICLE: NewsArticle = {
  id: '',
  category: 'Società',
  title: '',
  summary: '',
  body: '',
  imageUrl: '',
  sourceUrl: '',
  source: 'Redazione APPrato',
  publishedAt: '',
  featured: false,
  imageScale: 1,
  imagePositionX: 0,
  imagePositionY: 0,
};

function buildArticle(overrides: Partial<NewsArticle>): NewsArticle {
  return {
    ...EMPTY_ARTICLE,
    ...overrides,
    id: overrides.id || id(),
    publishedAt:
      overrides.publishedAt ||
      new Intl.DateTimeFormat('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
        .format(new Date())
        .toUpperCase(),
  };
}

export function NewsAdmin({
  content,
  onChange,
}: {
  content: AppContent;
  onChange: (next: AppContent) => Promise<void>;
}) {
  const [editing, setEditing] = useState<NewsArticle | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Società');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [scale, setScale] = useState(1);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  const dragRef = useRef({ x: 0, y: 0 });
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragRef.current = { x: posX, y: posY };
      },
      onPanResponderMove: (_, gs) => {
        setPosX(dragRef.current.x + gs.dx);
        setPosY(dragRef.current.y + gs.dy);
      },
    }),
  ).current;

  const clearForm = () => {
    setEditing(null);
    setTitle('');
    setCategory('Società');
    setSummary('');
    setBody('');
    setImageUrl('');
    setSourceUrl('');
    setFeatured(false);
    setScale(1);
    setPosX(0);
    setPosY(0);
  };

  const startEdit = (article: NewsArticle) => {
    setEditing(article);
    setTitle(article.title);
    setCategory(article.category);
    setSummary(article.summary);
    setBody(article.body ?? '');
    setImageUrl(article.imageUrl ?? '');
    setSourceUrl(article.sourceUrl ?? '');
    setFeatured(!!article.featured);
    setScale(article.imageScale ?? 1);
    setPosX(article.imagePositionX ?? 0);
    setPosY(article.imagePositionY ?? 0);
  };

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
      setImageUrl(
        asset.base64
          ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`
          : asset.uri,
      );
    }
  };

  const zoomIn = () => setScale((s) => Math.min(s + 0.1, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.1, 1));
  const resetCrop = () => {
    setScale(1);
    setPosX(0);
    setPosY(0);
  };

  const save = () => {
    if (!title.trim() || !summary.trim() || !imageUrl.trim()) {
      return Alert.alert(
        'Campi mancanti',
        'Titolo, riassunto e immagine sono obbligatori.',
      );
    }
    const article = buildArticle({
      id: editing?.id || undefined,
      title: title.trim(),
      category: category.trim() || 'News',
      summary: summary.trim(),
      body: body.trim() || summary.trim(),
      imageUrl,
      sourceUrl: sourceUrl || undefined,
      featured,
      imageScale: scale,
      imagePositionX: posX,
      imagePositionY: posY,
      publishedAt: editing?.publishedAt || undefined,
    });

    let news: NewsArticle[];
    if (editing) {
      news = content.news.map((item) =>
        item.id === editing.id ? article : featured && item.id !== editing.id ? { ...item, featured: false } : item,
      );
    } else {
      const previous = featured
        ? content.news.map((item) => ({ ...item, featured: false }))
        : content.news;
      news = [article, ...previous];
    }
    void onChange({ ...content, news });
    clearForm();
  };

  const remove = (id: string) => {
    void onChange({
      ...content,
      news: content.news.filter((item) => item.id !== id),
    });
  };

  const editorTransform = imageTransformStyle({
    imageScale: scale,
    imagePositionX: posX,
    imagePositionY: posY,
  });

  const editorPreviewUri = imageUrl || editing?.imageUrl || '';

  return (
    <View style={{ gap: 14 }}>
      {/* Editor pannello */}
      <View style={adminStyles.panel}>
        <Text style={adminStyles.title}>
          {editing ? 'Modifica notizia' : 'Crea notizia'}
        </Text>
        <Text style={adminStyles.copy}>
          La copertina fotografica è obbligatoria.
        </Text>

        {/* Preview 16:9 con drag */}
        <View style={styles.editorWrap}>
          {editorPreviewUri ? (
            <View style={styles.editorCanvas} {...panResponder.panHandlers}>
              <Image
                source={{ uri: editorPreviewUri }}
                resizeMode="cover"
                style={[styles.editorImage, editorTransform]}
              />
            </View>
          ) : (
            <MaterialCommunityIcons
              name="image-outline"
              size={50}
              color={colors.mutedDark}
            />
          )}
        </View>

        {/* Controlli zoom/posizione */}
        <View style={styles.cropRow}>
          <Pressable onPress={zoomOut} style={styles.cropBtn}>
            <MaterialCommunityIcons
              name="magnify-minus-outline"
              size={20}
              color={colors.ink}
            />
          </Pressable>
          <Text style={styles.cropLabel}>
            {Math.round(scale * 100)}%
          </Text>
          <Pressable onPress={zoomIn} style={styles.cropBtn}>
            <MaterialCommunityIcons
              name="magnify-plus-outline"
              size={20}
              color={colors.ink}
            />
          </Pressable>
          <Pressable onPress={resetCrop} style={styles.cropBtn}>
            <MaterialCommunityIcons
              name="image-refresh-outline"
              size={20}
              color={colors.ink}
            />
          </Pressable>
          <Text style={styles.cropHint}>Trascina per centrare</Text>
        </View>

        <Button
          label="Carica copertina"
          icon="image-plus"
          secondary
          onPress={() => void pick()}
        />
        <Field
          label="URL immagine"
          value={imageUrl.startsWith('data:') ? '' : imageUrl}
          onChangeText={setImageUrl}
          keyboardType="url"
        />

        <View style={adminStyles.row}>
          <Field label="Titolo" value={title} onChangeText={setTitle} />
          <Field
            label="Categoria"
            value={category}
            onChangeText={setCategory}
          />
        </View>
        <Field
          label="Riassunto"
          value={summary}
          onChangeText={setSummary}
          multiline
        />
        <Field
          label="Testo completo"
          value={body}
          onChangeText={setBody}
          multiline
        />
        <Field
          label="Link fonte"
          value={sourceUrl}
          onChangeText={setSourceUrl}
          keyboardType="url"
        />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 15,
          }}
        >
          <Text style={adminStyles.listTitle}>In evidenza</Text>
          <Switch
            value={featured}
            onValueChange={setFeatured}
            trackColor={{ true: colors.accentStrong }}
          />
        </View>

        <View style={styles.formActions}>
          <Button
            label={editing ? 'Salva modifiche' : 'Pubblica notizia'}
            icon="send-outline"
            onPress={save}
          />
          {editing ? (
            <Button label="Annulla" secondary onPress={clearForm} />
          ) : null}
        </View>
      </View>

      {/* Lista notizie pubblicate */}
      <View style={adminStyles.panel}>
        <Text style={adminStyles.title}>Notizie pubblicate</Text>
        <View style={adminStyles.list}>
          {content.news.map((article) => (
            <Pressable
              key={article.id}
              onPress={() => startEdit(article)}
              style={adminStyles.listRow}
            >
              <Image
                source={{ uri: article.imageUrl }}
                resizeMode="cover"
                style={{
                  width: 58,
                  height: 46,
                  borderRadius: 9,
                  transform: [
                    { scale: Math.max(1, Number(article.imageScale) || 1) },
                    { translateX: Number(article.imagePositionX) || 0 },
                    { translateY: Number(article.imagePositionY) || 0 },
                  ],
                }}
              />
              <View style={adminStyles.listBody}>
                <Text numberOfLines={2} style={adminStyles.listTitle}>
                  {article.title}
                </Text>
                <Text style={adminStyles.listMeta}>
                  {article.category} · {article.publishedAt}
                </Text>
              </View>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  remove(article.id);
                }}
                hitSlop={10}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={20}
                  color={colors.live}
                />
              </Pressable>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = {
  editorWrap: {
    height: 190,
    marginTop: 15,
    marginBottom: 10,
    borderRadius: radii.lg,
    overflow: 'hidden' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  editorCanvas: {
    width: '100%' as const,
    height: '100%' as const,
    overflow: 'hidden' as const,
  },
  editorImage: {
    width: '100%' as const,
    height: '100%' as const,
  },
  cropRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 10,
  },
  cropBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cropLabel: {
    color: colors.ink,
    fontWeight: '700' as const,
    fontSize: 12,
    minWidth: 36,
    textAlign: 'center' as const,
  },
  cropHint: {
    color: colors.muted,
    fontSize: 11,
    marginLeft: 6,
  },
  formActions: {
    flexDirection: 'row' as const,
    gap: 10,
    marginTop: 8,
  },
};