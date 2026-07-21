import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { GestureResponderEvent, Image, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '../../theme';
import { playerImageStyle } from '../../utils/player-image';

const FRAME_WIDTH = 220;
const FRAME_HEIGHT = 264; // matches the 122x146 PlayerCard aspect ratio, scaled up for easier editing
const MIN_SCALE = 1;
const MAX_SCALE = 3;

type PhotoValue = { imageScale?: number; imagePositionX?: number; imagePositionY?: number };

function distance(touches: GestureResponderEvent['nativeEvent']['touches']): number {
  if (touches.length < 2) return 0;
  const [a, b] = touches;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

export function PlayerPhotoEditor({ imageUrl, value, onChange }: { imageUrl?: string; value: PhotoValue; onChange: (next: { imageScale: number; imagePositionX: number; imagePositionY: number }) => void }) {
  const scale = Math.max(MIN_SCALE, Number(value.imageScale) || 1);
  const posX = Number(value.imagePositionX) || 0;
  const posY = Number(value.imagePositionY) || 0;

  const start = useRef({ x: posX, y: posY, scale, pinchDistance: 0 });
  const [dragging, setDragging] = useState(false);

  const clamp = (next: { imageScale: number; imagePositionX: number; imagePositionY: number }) => {
    const boundedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next.imageScale));
    // keep the drag range proportional to how far the photo has been zoomed in
    const maxOffset = (boundedScale - 1) * (FRAME_WIDTH / 2) + 40;
    return {
      imageScale: Math.round(boundedScale * 100) / 100,
      imagePositionX: Math.max(-maxOffset, Math.min(maxOffset, next.imagePositionX)),
      imagePositionY: Math.max(-maxOffset, Math.min(maxOffset, next.imagePositionY)),
    };
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          setDragging(true);
          start.current = { x: posX, y: posY, scale, pinchDistance: distance(event.nativeEvent.touches) };
        },
        onPanResponderMove: (event, gesture) => {
          const touches = event.nativeEvent.touches;
          if (touches.length >= 2) {
            const currentDistance = distance(touches);
            if (start.current.pinchDistance > 0) {
              const ratio = currentDistance / start.current.pinchDistance;
              onChange(clamp({ imageScale: start.current.scale * ratio, imagePositionX: posX, imagePositionY: posY }));
            }
            return;
          }
          onChange(clamp({ imageScale: scale, imagePositionX: start.current.x + gesture.dx, imagePositionY: start.current.y + gesture.dy }));
        },
        onPanResponderRelease: () => setDragging(false),
        onPanResponderTerminate: () => setDragging(false),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posX, posY, scale],
  );

  const nudgeZoom = (delta: number) => onChange(clamp({ imageScale: scale + delta, imagePositionX: posX, imagePositionY: posY }));
  const recenter = () => onChange({ imageScale: 1, imagePositionX: 0, imagePositionY: 0 });

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Trascina per centrare la foto, usa +/- per lo zoom</Text>
      <View style={[styles.frame, dragging && styles.frameActive]} {...panResponder.panHandlers}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} resizeMode="cover" style={[styles.image, playerImageStyle({ imageScale: scale, imagePositionX: posX, imagePositionY: posY })]} />
        ) : (
          <View style={styles.placeholder}>
            <MaterialCommunityIcons name="account" size={56} color={colors.mutedDark} />
          </View>
        )}
        <View style={styles.guide} pointerEvents="none" />
      </View>
      <View style={styles.controls}>
        <Pressable onPress={() => nudgeZoom(-0.1)} style={styles.zoomBtn}><MaterialCommunityIcons name="magnify-minus-outline" size={20} color={colors.ink} /></Pressable>
        <Text style={styles.zoomValue}>{Math.round(scale * 100)}%</Text>
        <Pressable onPress={() => nudgeZoom(0.1)} style={styles.zoomBtn}><MaterialCommunityIcons name="magnify-plus-outline" size={20} color={colors.ink} /></Pressable>
        <Pressable onPress={recenter} style={[styles.zoomBtn, styles.resetBtn]}>
          <MaterialCommunityIcons name="image-filter-center-focus" size={18} color={colors.paper} />
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginTop: 12, marginBottom: 4, gap: 10 },
  label: { color: colors.muted, fontSize: 11, textAlign: 'center' },
  frame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameActive: { borderColor: colors.accentStrong },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  guide: { position: 'absolute', top: '50%', left: '50%', width: 1, height: 1 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  zoomBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 40, minHeight: 40, paddingHorizontal: 10, borderRadius: radii.md, backgroundColor: colors.canvasRaised, borderWidth: 1, borderColor: colors.line },
  zoomValue: { color: colors.ink, fontWeight: '900', minWidth: 42, textAlign: 'center' },
  resetBtn: { backgroundColor: colors.accentStrong, borderColor: colors.accentStrong },
  resetText: { color: colors.paper, fontWeight: '900', fontSize: 12 },
});
