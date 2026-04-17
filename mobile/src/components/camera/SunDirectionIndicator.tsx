import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

interface Props { azimuth: number; altitude: number; }

function getCardinal(deg: number) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

export function SunDirectionIndicator({ azimuth, altitude }: Props) {
  const isBelow = altitude < 0;
  const needleRotation = azimuth - 90; // convert to CSS rotation

  return (
    <View style={s.wrap}>
      <View style={s.compass}>
        {/* Crosshair */}
        <View style={s.crossH} />
        <View style={s.crossV} />
        {/* Sun dot (at top, needle rotates to point toward sun) */}
        {!isBelow && (
          <View style={[s.needleWrap, { transform: [{ rotate: `${needleRotation}deg` }] }]}>
            <View style={s.needle} />
            <View style={s.sunDot} />
          </View>
        )}
        {isBelow && <Text style={s.moon}>☽</Text>}
      </View>
      <Text style={s.label}>{isBelow ? 'Night' : getCardinal(azimuth)}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center' },
  compass: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 1, borderColor: `${Colors.gold}60`,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  crossH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: `${Colors.gold}30` },
  crossV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: `${Colors.gold}30` },
  needleWrap: {
    position: 'absolute', width: 2, height: 40,
    top: 3, left: 22,
    transformOrigin: '1px 20px',
  },
  needle: { flex: 1, backgroundColor: `${Colors.gold}80` },
  sunDot: {
    position: 'absolute', top: 0, left: -3,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold, shadowRadius: 4, shadowOpacity: 0.8, shadowOffset: { width: 0, height: 0 },
  },
  moon: { fontSize: 16, color: Colors.creamDim },
  label: { fontSize: 9, color: Colors.creamDim, marginTop: 3, letterSpacing: 1 },
});
