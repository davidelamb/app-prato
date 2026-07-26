import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { GestureResponderEvent, Image, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '../../theme';
import { playerImageStyle } from '../../utils/player-image';

const FRAME_WIDTH = 260;
const FRAME_HEIGHT = 310;
const MIN_SCALE = 1;
const MAX_SCALE = 3;

type PhotoValue = { imageScale?: number; imagePositionX?: number; imagePositionY?: number };
type PhotoState = { imageScale: number; imagePositionX: number; imagePositionY: number };

function distance(touches: GestureResponderEvent['nativeEvent']['touches']): number {
  if (touches.length < 2) return 0;
  const [a, b] = touches;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

function clampPhoto(next: PhotoState): PhotoState {
  const imageScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next.imageScale));
  const maxX = (imageScale - 1) * (FRAME_WIDTH / 2);
  const maxY = (imageScale - 1) * (FRAME_HEIGHT / 2);
  return {
    imageScale: Math.round(imageScale * 100) / 100,
    imagePositionX: Math.round(Math.max(-maxX, Math.min(maxX, next.imagePositionX))),
    imagePositionY: Math.round(Math.max(-maxY, Math.min(maxY, next.imagePositionY))),
  };
}

export function PlayerPhotoEditor({ imageUrl, value, onChange }: { imageUrl?: string; value: PhotoValue; onChange: (next: { imageScale: number; imagePositionX: number; imagePositionY: number }) => void }) {
  const scale = Math.max(MIN_SCALE, Number(value.imageScale) || 1);
  const posX = Number(value.imagePositionX) || 0;
  const posY = Number(value.imagePositionY) || 0;

  const start = useRef({ x: posX, y: posY, scale, pinchDistance: 0 });
  const latest = useRef({ scale, posX, posY });
  const changeRef = useRef(onChange);
  const [dragging, setDragging] = useState(false);
  latest.current = { scale, posX, posY };
  changeRef.current = onChange;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          setDragging(true);
          start.current = { x: latest.current.posX, y: latest.current.posY, scale: latest.current.scale, pinchDistance: distance(event.nativeEvent.touches) };
        },
        onPanResponderMove: (event, gesture) => {
          const touches = event.nativeEvent.touches;
          if (touches.length >= 2) {
            const currentDistance = distance(touches);
            if (start.current.pinchDistance > 0) {
              const ratio = currentDistance / start.current.pinchDistance;
              changeRef.current(clampPhoto({ imageScale: start.current.scale * ratio, imagePositionX: start.current.x, imagePositionY: start.current.y }));
            }
            return;
          }
          changeRef.current(clampPhoto({ imageScale: start.current.scale, imagePositionX: start.current.x + gesture.dx, imagePositionY: start.current.y + gesture.dy }));
        },
        onPanResponderRelease: () => setDragging(false),
        onPanResponderTerminate: () => setDragging(false),
      }),
    [],
  );

  const nudgeZoom = (delta: number) => onChange(clampPhoto({ imageScale: scale + delta, imagePositionX: posX, imagePositionY: posY }));
  const nudgePosition = (deltaX: number, deltaY: number) => onChange(clampPhoto({ imageScale: scale, imagePositionX: posX + deltaX, imagePositionY: posY + deltaY }));
  const centerPosition = () => onChange({ imageScale: scale, imagePositionX: 0, imagePositionY: 0 });
  const recenter = () => onChange({ imageScale: 1, imagePositionX: 0, imagePositionY: 0 });

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Trascina per centrare la foto, usa i controlli per una regolazione precisa</Text>
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
        <Pressable accessibilityLabel="Riduci zoom" onPress={() => nudgeZoom(-0.05)} style={styles.zoomBtn}><MaterialCommunityIcons name="magnify-minus-outline" size={20} color={colors.ink} /></Pressable>
        <Text style={styles.zoomValue}>{Math.round(scale * 100)}%</Text>
        <Pressable accessibilityLabel="Aumenta zoom" onPress={() => nudgeZoom(0.05)} style={styles.zoomBtn}><MaterialCommunityIcons name="magnify-plus-outline" size={20} color={colors.ink} /></Pressable>
        <Pressable onPress={recenter} style={[styles.zoomBtn, styles.resetBtn]}>
          <MaterialCommunityIcons name="image-filter-center-focus" size={18} color={colors.paper} />
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
      </View>
      <Text style={styles.positionValue}>Posizione X {Math.round(posX)} · Y {Math.round(posY)}</Text>
      <View style={styles.positionControls}>
        <Pressable accessibilityLabel="Sposta in alto" onPress={() => nudgePosition(0, -3)} style={styles.positionBtn}><MaterialCommunityIcons name="chevron-up" size={24} color={colors.ink} /></Pressable>
        <View style={styles.horizontalControls}>
          <Pressable accessibilityLabel="Sposta a sinistra" onPress={() => nudgePosition(-3, 0)} style={styles.positionBtn}><MaterialCommunityIcons name="chevron-left" size={24} color={colors.ink} /></Pressable>
          <Pressable accessibilityLabel="Centra posizione" onPress={centerPosition} style={[styles.positionBtn, styles.centerBtn]}><MaterialCommunityIcons name="crosshairs-gps" size={20} color={colors.paper} /></Pressable>
          <Pressable accessibilityLabel="Sposta a destra" onPress={() => nudgePosition(3, 0)} style={styles.positionBtn}><MaterialCommunityIcons name="chevron-right" size={24} color={colors.ink} /></Pressable>
        </View>
        <Pressable accessibilityLabel="Sposta in basso" onPress={() => nudgePosition(0, 3)} style={styles.positionBtn}><MaterialCommunityIcons name="chevron-down" size={24} color={colors.ink} /></Pressable>
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
  positionControls: { alignItems: 'center', gap: 4 },
  positionValue: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  horizontalControls: { flexDirection: 'row', gap: 6 },
  positionBtn: { width: 44, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm, backgroundColor: colors.canvasRaised, borderWidth: 1, borderColor: colors.line },
  centerBtn: { backgroundColor: colors.accentStrong, borderColor: colors.accentStrong },
  zoomBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 40, minHeight: 40, paddingHorizontal: 10, borderRadius: radii.md, backgroundColor: colors.canvasRaised, borderWidth: 1, borderColor: colors.line },
  zoomValue: { color: colors.ink, fontWeight: '900', minWidth: 42, textAlign: 'center' },
  resetBtn: { backgroundColor: colors.accentStrong, borderColor: colors.accentStrong },
  resetText: { color: colors.paper, fontWeight: '900', fontSize: 12 },
});
