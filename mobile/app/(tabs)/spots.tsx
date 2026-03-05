import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, Linking, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/services/api';
import { useLocation } from '../../src/hooks/useLocation';
import { useSunPosition } from '../../src/hooks/useSunPosition';
import { Colors, Spacing, Radii } from '../../src/constants/theme';

interface Spot {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  styleTags: string[];
  bestTimes: string[];
  distanceM?: number;
  source: string;
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanceLabel(m?: number) {
  if (m == null) return '';
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;
}

const TIME_COLOR: Record<string, string> = {
  golden_hour: Colors.gold,
  sunrise:     Colors.gold,
  blue_hour:   '#4A7ABF',
  night:       '#6B4FA0',
  midday:      '#C4571A',
  overcast:    '#7A8A9A',
  any:         Colors.creamDim,
};

const DARK_MAP_STYLE = [
  { elementType: 'geometry',           stylers: [{ color: '#12100F' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#9A8878' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#12100F' }] },
  { featureType: 'road', elementType: 'geometry',        stylers: [{ color: '#1E1A14' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#080705' }] },
  { featureType: 'water',   elementType: 'geometry', stylers: [{ color: '#080A14' }] },
  { featureType: 'poi',     elementType: 'geometry', stylers: [{ color: '#1A1810' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1A1810' }] },
  { featureType: 'poi',     elementType: 'labels',   stylers: [{ visibility: 'off' }] },
];

export default function SpotsScreen() {
  const deviceLocation = useLocation();
  const [manualCoords, setManualCoords] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [showCityInput, setShowCityInput] = useState(false);
  const [cityText, setCityText] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [search, setSearch] = useState('');
  const [radius, setRadius] = useState(3000);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  const activeLoc = manualCoords ?? {
    lat:   deviceLocation.lat,
    lng:   deviceLocation.lng,
    label: deviceLocation.granted ? 'Your location' : 'London (default)',
  };

  const sun = useSunPosition(activeLoc.lat, activeLoc.lng);

  // Animate map when location or radius changes
  useEffect(() => {
    const delta = radius > 8000 ? 0.32 : radius > 3000 ? 0.16 : 0.08;
    mapRef.current?.animateToRegion(
      { latitude: activeLoc.lat, longitude: activeLoc.lng, latitudeDelta: delta, longitudeDelta: delta },
      500,
    );
  }, [activeLoc.lat, activeLoc.lng, radius]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['spots', activeLoc.lat, activeLoc.lng, radius],
    queryFn: () =>
      api.get('/spots/nearby', { params: { lat: activeLoc.lat, lng: activeLoc.lng, radius } })
        .then((r) =>
          (r.data.spots as Spot[])
            .map((spot) => ({
              ...spot,
              distanceM: haversineM(activeLoc.lat, activeLoc.lng, spot.latitude, spot.longitude),
            }))
            .sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0))
        ),
    enabled: !deviceLocation.loading,
  });

  const filtered = (data ?? []).filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.styleTags.some((t) => t.includes(search.toLowerCase())),
  );

  const searchCity = useCallback(async () => {
    const query = cityText.trim();
    if (!query) return;
    setGeocoding(true);
    Keyboard.dismiss();
    try {
      const results = await Location.geocodeAsync(query);
      if (!results.length) {
        Alert.alert('Not found', `Could not find "${query}". Try a different city name.`);
        return;
      }
      const { latitude, longitude } = results[0];
      setManualCoords({ lat: latitude, lng: longitude, label: query });
      setShowCityInput(false);
      setCityText('');
    } catch {
      Alert.alert('Error', 'Geocoding failed. Please try again.');
    } finally {
      setGeocoding(false);
    }
  }, [cityText]);

  const initialDelta = radius > 8000 ? 0.32 : radius > 3000 ? 0.16 : 0.08;

  return (
    <SafeAreaView style={s.safe}>

      {/* ── Header ─────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.title}>Photo <Text style={s.titleEm}>Spots</Text></Text>
            <Text style={s.sub}>{sun.sceneLabel} · {filtered.length} nearby</Text>
          </View>
          <TouchableOpacity style={s.locPill} onPress={() => setShowCityInput((v) => !v)}>
            <Text style={s.locPillIcon}>📍</Text>
            <Text style={s.locPillLabel} numberOfLines={1}>{activeLoc.label}</Text>
            <Text style={s.locPillCaret}>{showCityInput ? '↑' : '›'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Location denied banner ──────────────────── */}
      {!deviceLocation.loading && !deviceLocation.granted && !manualCoords && (
        <View style={s.permBanner}>
          <Text style={s.permMsg}>📍 Location access denied — showing London as default.</Text>
          <View style={s.permRow}>
            <TouchableOpacity style={s.permBtn} onPress={() => Linking.openSettings()}>
              <Text style={s.permBtnLabel}>Enable GPS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.permBtn, s.permBtnGold]} onPress={() => setShowCityInput(true)}>
              <Text style={[s.permBtnLabel, { color: Colors.gold }]}>Enter city</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── City search input ───────────────────────── */}
      {showCityInput && (
        <View style={s.cityRow}>
          <TextInput
            style={s.cityInput}
            value={cityText}
            onChangeText={setCityText}
            placeholder="City, neighbourhood or address…"
            placeholderTextColor={Colors.creamDim}
            returnKeyType="search"
            onSubmitEditing={searchCity}
            autoFocus
          />
          <TouchableOpacity
            style={[s.cityGoBtn, (!cityText.trim() || geocoding) && s.cityGoBtnDim]}
            onPress={searchCity}
            disabled={!cityText.trim() || geocoding}>
            {geocoding
              ? <ActivityIndicator color={Colors.bg} size="small" />
              : <Text style={s.cityGoBtnText}>Go</Text>}
          </TouchableOpacity>
          {manualCoords && (
            <TouchableOpacity
              style={s.useGpsBtn}
              onPress={() => { setManualCoords(null); setShowCityInput(false); }}>
              <Text style={s.useGpsBtnText}>Use GPS</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Map ────────────────────────────────────── */}
      <View style={s.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude:       activeLoc.lat,
            longitude:      activeLoc.lng,
            latitudeDelta:  initialDelta,
            longitudeDelta: initialDelta,
          }}
          customMapStyle={DARK_MAP_STYLE}
          userInterfaceStyle="dark"
          showsUserLocation={deviceLocation.granted}
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
          toolbarEnabled={false}
        >
          {filtered.map((spot) => {
            const dotColor = TIME_COLOR[spot.bestTimes?.[0] ?? ''] ?? Colors.rust;
            const isSelected = selectedId === spot.id;
            return (
              <Marker
                key={spot.id}
                coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
                onPress={() => setSelectedId(spot.id)}
              >
                <View style={[s.marker, { backgroundColor: dotColor }, isSelected && s.markerSel]}>
                  <Text style={s.markerEmoji}>📷</Text>
                </View>
              </Marker>
            );
          })}
        </MapView>

        {isLoading && (
          <View style={s.mapLoader}>
            <ActivityIndicator color={Colors.gold} />
          </View>
        )}
      </View>

      {/* ── Radius + search ────────────────────────── */}
      <View style={s.controls}>
        <View style={s.radiusRow}>
          {[1000, 3000, 8000, 20000].map((r) => (
            <TouchableOpacity
              key={r}
              style={[s.chip, radius === r && s.chipActive]}
              onPress={() => setRadius(r)}>
              <Text style={[s.chipText, radius === r && s.chipTextActive]}>
                {r >= 1000 ? `${r / 1000}km` : `${r}m`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.searchWrap}>
          <Text style={s.searchIcon}>⌕</Text>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Filter spots or tags…"
            placeholderTextColor={Colors.creamDim}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={s.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Spot list ──────────────────────────────── */}
      <ScrollView style={s.list} contentContainerStyle={s.listContent}>
        {!isLoading && filtered.length === 0 && (
          <Text style={s.empty}>No spots found. Try a larger radius or different location.</Text>
        )}
        {filtered.map((spot) => {
          const primary   = spot.bestTimes?.[0];
          const barColor  = TIME_COLOR[primary ?? ''] ?? Colors.rust;
          const isSelected = selectedId === spot.id;
          return (
            <TouchableOpacity
              key={spot.id}
              style={[s.card, isSelected && s.cardSel]}
              activeOpacity={0.75}
              onPress={() => {
                setSelectedId(spot.id);
                mapRef.current?.animateToRegion(
                  { latitude: spot.latitude, longitude: spot.longitude, latitudeDelta: 0.018, longitudeDelta: 0.018 },
                  500,
                );
              }}>
              <View style={[s.cardBar, { backgroundColor: barColor }]} />
              <View style={s.cardBody}>
                <View style={s.cardTop}>
                  <Text style={s.cardName}>{spot.name}</Text>
                  {spot.distanceM != null && (
                    <Text style={s.cardDist}>{distanceLabel(spot.distanceM)}</Text>
                  )}
                </View>
                {spot.description ? (
                  <Text style={s.cardDesc} numberOfLines={2}>{spot.description}</Text>
                ) : null}
                <View style={s.tagRow}>
                  {spot.styleTags.slice(0, 4).map((t) => (
                    <View key={t} style={s.tag}>
                      <Text style={s.tagText}>{t.replace(/_/g, ' ')}</Text>
                    </View>
                  ))}
                  {spot.source === 'GOOGLE_PLACES' && (
                    <View style={[s.tag, s.tagGoogle]}>
                      <Text style={[s.tagText, { color: Colors.green }]}>Google</Text>
                    </View>
                  )}
                  {spot.source === 'COMMUNITY' && (
                    <View style={[s.tag, s.tagCommunity]}>
                      <Text style={[s.tagText, { color: Colors.purple }]}>Community</Text>
                    </View>
                  )}
                </View>
                {primary && (
                  <Text style={s.bestTime}>
                    Best: <Text style={{ color: barColor }}>{primary.replace(/_/g, ' ')}</Text>
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  header:    { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title:     { color: Colors.cream, fontSize: 28, fontWeight: '300' },
  titleEm:   { color: Colors.gold, fontStyle: 'italic' },
  sub:       { color: Colors.creamDim, fontSize: 13, marginTop: 4 },

  locPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.card, borderRadius: Radii.full,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.border, maxWidth: 148,
  },
  locPillIcon:  { fontSize: 11 },
  locPillLabel: { color: Colors.creamDim, fontSize: 11, flex: 1 },
  locPillCaret: { color: Colors.gold, fontSize: 13, fontWeight: '600' },

  permBanner: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    backgroundColor: `${Colors.rust}14`, borderRadius: Radii.md,
    padding: Spacing.md, borderWidth: 1, borderColor: `${Colors.rust}28`,
  },
  permMsg: { color: Colors.cream, fontSize: 13, marginBottom: 10, lineHeight: 18 },
  permRow: { flexDirection: 'row', gap: 8 },
  permBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radii.full,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  permBtnGold:  { borderColor: Colors.gold },
  permBtnLabel: { color: Colors.cream, fontSize: 12, fontWeight: '600' },

  cityRow: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
  },
  cityInput: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radii.md,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    color: Colors.cream, fontSize: 14,
    borderWidth: 1.5, borderColor: Colors.gold,
  },
  cityGoBtn: {
    backgroundColor: Colors.gold, borderRadius: Radii.md,
    paddingHorizontal: 16, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center', minWidth: 48,
  },
  cityGoBtnDim:  { opacity: 0.45 },
  cityGoBtnText: { color: Colors.bg, fontSize: 14, fontWeight: '700' },
  useGpsBtn:     { paddingHorizontal: 8, paddingVertical: 10 },
  useGpsBtnText: { color: Colors.creamDim, fontSize: 12 },

  mapWrap:   { height: 230, marginBottom: 2, position: 'relative' },
  mapLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,7,10,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },

  marker: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.bg,
  },
  markerSel: { width: 42, height: 42, borderRadius: 21, borderColor: Colors.cream },
  markerEmoji: { fontSize: 15 },

  controls: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.sm },
  radiusRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radii.full,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive:     { backgroundColor: `${Colors.gold}1E`, borderColor: Colors.gold },
  chipText:       { color: Colors.creamDim, fontSize: 12 },
  chipTextActive: { color: Colors.gold },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radii.md,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchIcon:  { color: Colors.creamDim, fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, color: Colors.cream, fontSize: 14 },
  clearBtn:    { color: Colors.creamDim, fontSize: 14, padding: 4 },

  list:        { flex: 1 },
  listContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: 30 },
  empty:       { color: Colors.creamDim, textAlign: 'center', marginTop: 40, fontSize: 14 },

  card: {
    flexDirection: 'row', backgroundColor: Colors.card,
    marginBottom: 10, borderRadius: Radii.md, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  cardSel:  { borderColor: Colors.gold },
  cardBar:  { width: 4 },
  cardBody: { flex: 1, padding: Spacing.md },
  cardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardName: { color: Colors.cream, fontSize: 15, fontWeight: '500', flex: 1, marginRight: 8 },
  cardDist: { color: Colors.gold, fontSize: 12, fontWeight: '600' },
  cardDesc: { color: Colors.creamDim, fontSize: 12, lineHeight: 17, marginBottom: 8 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  tag: {
    backgroundColor: `${Colors.gold}12`, borderRadius: Radii.full,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: `${Colors.gold}1E`,
  },
  tagGoogle:    { backgroundColor: `${Colors.green}14`,  borderColor: `${Colors.green}28` },
  tagCommunity: { backgroundColor: `${Colors.purple}14`, borderColor: `${Colors.purple}28` },
  tagText:      { color: Colors.goldDim, fontSize: 10, letterSpacing: 0.5 },
  bestTime:     { color: Colors.creamDim, fontSize: 11, marginTop: 2 },
});
