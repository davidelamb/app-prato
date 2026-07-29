import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import { NewsArticle } from '../types';
import { imageTransformStyle } from '../utils/player-image';

export function ArticleModal({ article, onClose }: { article: NewsArticle | null; onClose: () => void }) {
  return (
    <Modal visible={!!article} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        {article ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.top}>
              <Pressable accessibilityLabel="Chiudi notizia" onPress={onClose} style={styles.back}>
                <MaterialCommunityIcons name="chevron-left" size={31} color={colors.ink} />
              </Pressable>
              <View style={styles.topBrand}>
                <Image source={require('../../assets/ac-prato-crest.png')} resizeMode="cover" style={styles.topLogo} />
                <Text style={styles.topTitle}>APPrato</Text>
              </View>
              <View style={styles.spacer} />
            </View>

            <View style={styles.imageFrame}>
              {article.imageUrl ? (
                <Image
                  source={{ uri: article.imageUrl }}
                  resizeMode="cover"
                  style={[styles.image, imageTransformStyle(article)]}
                />
              ) : (
                <LinearGradient colors={[colors.accentStrong, colors.accent]} style={styles.placeholder}>
                  <Image source={require('../../assets/ac-prato-crest.png')} resizeMode="cover" style={styles.placeholderLogo} />
                </LinearGradient>
              )}
            </View>

            <View style={styles.body}>
              <Text style={styles.eyebrow}>{article.category}</Text>
              <Text style={styles.title}>{article.title}</Text>
              <Text style={styles.meta}>{article.publishedAt}</Text>
              <Text style={styles.lead}>{article.summary}</Text>
              <View style={styles.divider} />
              <Text style={styles.text}>{article.body ?? article.summary}</Text>
            </View>
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvasRaised },
  content: { paddingBottom: 48 },
  top: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  topBrand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  topLogo: { width: 38, height: 38, borderRadius: 11 },
  topTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  spacer: { width: 42 },
  imageFrame: {
    width: '100%',
    maxWidth: 960,
    aspectRatio: 16 / 9,
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: colors.surfaceSoft,
  },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderLogo: { width: 116, height: 116, borderRadius: 32 },
  body: { width: '100%', maxWidth: 800, alignSelf: 'center', padding: 22, backgroundColor: colors.paper },
  eyebrow: { color: colors.accentStrong, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 35, lineHeight: 40, fontWeight: '900', marginTop: 8 },
  meta: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 12 },
  lead: { color: colors.accentStrong, fontSize: 19, lineHeight: 28, fontWeight: '900', marginTop: 22 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 24 },
  text: { color: colors.ink, fontSize: 17, lineHeight: 29 },
});
