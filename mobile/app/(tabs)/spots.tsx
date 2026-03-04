import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/services/api';
import { useLocation } from '../../src/hooks/useLocation';
import { useSunPosition } from '../../src/hooks/useSunPosition';
import { Colors, Spacing, Radii } from '../../src/constants/theme';

interface Spot {
  id: string;
  name: string;
  description?: string;
  styleTags: string[];
  bestTimeOfDay?: string;
  distanceM?: number;
  source: string;
}

function distanceLabel(m?: number) {
  if (!m) return '';
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

const TIME_TAG_COLOR: Record<string, string> = {
  golden_hour: Colors.gold,
  blue_hour: '#4A7ABF',
  night: '#6B4FA0',
  midday: '#C4571A',
};

export default function SpotsScreen() {
  const location = useLocation();
  const sun = useSunPosition(location.lat, location.lng);
  const [search, setSearch] = useState('');
  const [radius, setRadius] = useState(3000);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['spots', location.lat, location.lng, radius],
    queryFn: () =>
      api.get(`/spots/nearby?lat=${location.lat}&lng=${location.lng}&radius=${radius}`)
        .then((r) => r.data.spots as Spot[]),
    enabled: !location.loading,
  });

  const filtered = (data ?? []).filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.styleTags.some((t) => t.includes(search.toLowerCase()))
  );

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Photo <Text style={s.titleEm}>Spots</Text></Text>
        <Text style={s.sub}>{sun.sceneLabel} · {filtered.length} nearby</Text>
      </View>

      {/* Search bar */}
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>⌕</Text>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search spots or tags…"
          placeholderTextColor={Colors.creamDim}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={s.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Radius chips */}
      <View style={s.radiusRow}>
        {[1000, 3000, 8000, 20000].map((r) => (
          <TouchableOpacity
            key={r}
            style={[s.radiusChip, radius === r && s.radiusChipActive]}
            onPress={() => setRadius(r)}>
            <Text style={[s.radiusChipText, radius === r && s.radiusChipTextActive]}>
              {r >= 1000 ? `${r / 1000}km` : `${r}m`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Spot list */}
      {isLoading ? (
        <View style={s.center}><ActivityIndicator color={Colors.gold} size="large" /></View>
      ) : (
        <ScrollView style={s.list} contentContainerStyle={{ paddingBottom: 30 }}>
          {filtered.length === 0 && (
            <Text style={s.empty}>No spots found. Try increasing the radius.</Text>
          )}
          {filtered.map((spot) => (
            <View key={spot.id} style={s.card}>
              {/* Color bar based on best time */}
              <View style={[
                s.cardBar,
                { backgroundColor: TIME_TAG_COLOR[spot.bestTimeOfDay ?? ''] ?? Colors.rust },
              ]} />

              <View style={s.cardBody}>
                <View style={s.cardTop}>
                  <Text style={s.cardName}>{spot.name}</Text>
                  {spot.distanceM != null && (
                    <Text style={s.cardDist}>{distanceLabel(spot.distanceM)}</Text>
                  )}
                </View>

                {spot.description && (
                  <Text style={s.cardDesc} numberOfLines={2}>{spot.description}</Text>
                )}

                <View style={s.tagRow}>
                  {spot.styleTags.slice(0, 4).map((t) => (
                    <View key={t} style={s.tag}>
                      <Text style={s.tagText}>{t.replace('_', ' ')}</Text>
                    </View>
                  ))}
                  {spot.source === 'google' && (
                    <View style={[s.tag, { backgroundColor: `${Colors.green}15`, borderColor: `${Colors.green}30` }]}>
                      <Text style={[s.tagText, { color: Colors.green }]}>Google</Text>
                    </View>
                  )}
                  {spot.source === 'community' && (
                    <View style={[s.tag, { backgroundColor: `${Colors.purple}15`, borderColor: `${Colors.purple}30` }]}>
                      <Text style={[s.tagText, { color: Colors.purple }]}>Community</Text>
                    </View>
                  )}
                </View>

                {spot.bestTimeOfDay && (
                  <Text style={s.bestTime}>
                    Best: <Text style={{ color: TIME_TAG_COLOR[spot.bestTimeOfDay] ?? Colors.gold }}>
                      {spot.bestTimeOfDay.replace('_', ' ')}
                    </Text>
                  </Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { color: Colors.cream, fontSize: 28, fontWeight: '300' },
  titleEm: { color: Colors.gold, fontStyle: 'italic' },
  sub: { color: Colors.creamDim, fontSize: 13, marginTop: 4 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radii.md,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchIcon: { color: Colors.creamDim, fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, color: Colors.cream, fontSize: 14 },
  clearBtn: { color: Colors.creamDim, fontSize: 14, padding: 4 },

  radiusRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  radiusChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radii.full,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  radiusChipActive: { backgroundColor: `${Colors.gold}20`, borderColor: Colors.gold },
  radiusChipText: { color: Colors.creamDim, fontSize: 12 },
  radiusChipTextActive: { color: Colors.gold },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  list: { flex: 1 },
  empty: { color: Colors.creamDim, textAlign: 'center', marginTop: 40, fontSize: 14 },

  card: {
    flexDirection: 'row', backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg, marginBottom: 10,
    borderRadius: Radii.md, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  cardBar: { width: 4 },
  cardBody: { flex: 1, padding: Spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardName: { color: Colors.cream, fontSize: 15, fontWeight: '500', flex: 1, marginRight: 8 },
  cardDist: { color: Colors.gold, fontSize: 12, fontWeight: '600' },
  cardDesc: { color: Colors.creamDim, fontSize: 12, lineHeight: 17, marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  tag: {
    backgroundColor: `${Colors.gold}12`, borderRadius: Radii.full,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: `${Colors.gold}20`,
  },
  tagText: { color: Colors.goldDim, fontSize: 10, letterSpacing: 0.5 },
  bestTime: { color: Colors.creamDim, fontSize: 11, marginTop: 2 },
});
