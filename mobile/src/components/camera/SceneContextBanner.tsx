import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

interface Props {
  sceneLabel: string;
  lightQuality?: string;
  sunAzimuth?: number;
}

function getLightEmoji(label: string) {
  if (label.includes('Golden')) return '🌅';
  if (label.includes('Blue')) return '🌆';
  if (label.includes('Night')) return '🌙';
  if (label.includes('Twilight')) return '🌇';
  if (label.includes('Harsh')) return '☀️';
  return '🌤';
}

export function SceneContextBanner({ sceneLabel, lightQuality, sunAzimuth }: Props) {
  return (
    <View style={s.wrap}>
      <View style={s.dot} />
      <Text style={s.scene}>{getLightEmoji(sceneLabel)} {sceneLabel}</Text>
      {lightQuality && <Text style={s.quality}> · {lightQuality}</Text>}
      {sunAzimuth !== undefined && (
        <Text style={s.sun}> · Sun {Math.round(sunAzimuth)}°</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.62)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: `${Colors.gold}30`,
    backdropFilter: 'blur(10px)',
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.gold, marginRight: 7 },
  scene: { color: Colors.cream, fontSize: 13, fontWeight: '500' },
  quality: { color: Colors.goldDim, fontSize: 12 },
  sun: { color: Colors.creamDim, fontSize: 11 },
});
