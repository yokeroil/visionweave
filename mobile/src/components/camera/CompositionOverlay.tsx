import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

export function CompositionOverlay() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Rule of thirds grid */}
      <View style={[s.lineH, { top: '33.3%' }]} />
      <View style={[s.lineH, { top: '66.6%' }]} />
      <View style={[s.lineV, { left: '33.3%' }]} />
      <View style={[s.lineV, { left: '66.6%' }]} />
      {/* Corner brackets */}
      <View style={[s.corner, s.cornerTL]} />
      <View style={[s.corner, s.cornerTR]} />
      <View style={[s.corner, s.cornerBL]} />
      <View style={[s.corner, s.cornerBR]} />
      {/* Intersection dots */}
      <View style={[s.dot, { top: '33.3%', left: '33.3%' }]} />
      <View style={[s.dot, { top: '33.3%', left: '66.6%' }]} />
      <View style={[s.dot, { top: '66.6%', left: '33.3%' }]} />
      <View style={[s.dot, { top: '66.6%', left: '66.6%' }]} />
    </View>
  );
}

const GOLD = Colors.gold;
const s = StyleSheet.create({
  lineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: `${GOLD}40` },
  lineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: `${GOLD}40` },
  dot: {
    position: 'absolute', width: 6, height: 6, borderRadius: 3,
    backgroundColor: `${GOLD}80`, marginTop: -3, marginLeft: -3,
  },
  corner: {
    position: 'absolute', width: 22, height: 22,
    borderColor: `${GOLD}CC`, borderStyle: 'solid',
  },
  cornerTL: { top: 18, left: 18, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: 18, right: 18, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: 130, left: 18, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: 130, right: 18, borderBottomWidth: 2, borderRightWidth: 2 },
});
