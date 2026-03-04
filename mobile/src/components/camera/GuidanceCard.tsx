import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/theme';

interface Props {
  tip?: string;
  isLoading?: boolean;
  styleMatchScore?: number;
}

export function GuidanceCard({ tip, isLoading, styleMatchScore }: Props) {
  return (
    <View style={s.wrap}>
      <Text style={s.label}>AI GUIDANCE</Text>
      {isLoading ? (
        <ActivityIndicator color={Colors.gold} size="small" style={{ marginTop: 4 }} />
      ) : (
        <Text style={s.tip}>{tip ?? 'Position your subject at an intersection point'}</Text>
      )}
      {styleMatchScore !== undefined && (
        <View style={s.matchRow}>
          <View style={[s.matchBar, { width: `${styleMatchScore * 100}%` }]} />
          <Text style={s.matchLabel}>Style match</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(0,0,0,0.68)',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: `${Colors.gold}25`,
  },
  label: { fontSize: 9, letterSpacing: 2, color: Colors.gold, marginBottom: 5, textTransform: 'uppercase' },
  tip: { color: Colors.cream, fontSize: 14, lineHeight: 20, fontWeight: '400' },
  matchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  matchBar: {
    height: 2, borderRadius: 1,
    backgroundColor: Colors.gold, maxWidth: '70%',
  },
  matchLabel: { fontSize: 10, color: Colors.creamDim },
});
