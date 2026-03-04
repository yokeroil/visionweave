import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import { useLocation } from '../../src/hooks/useLocation';
import { useSunPosition } from '../../src/hooks/useSunPosition';
import { ProPaywall } from '../../src/components/shared/ProPaywall';
import { Colors, Spacing, Radii } from '../../src/constants/theme';

interface ShootEvent { id: string; type: string; title: string; body: string; scheduledFor: string; requiresPro: boolean; }

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function formatDay(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const tom = new Date(now); tom.setDate(tom.getDate() + 1);
  if (d.toDateString() === tom.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString([], { weekday: 'short' });
}

export default function HomeScreen() {
  const { user } = useAuthStore();
  const location = useLocation();
  const sun = useSunPosition(location.lat, location.lng);
  const router = useRouter();
  const [paywallFeature, setPaywallFeature] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['events', location.lat, location.lng],
    queryFn: () => {
      if (user?.locationLat === null) api.put('/profile', { locationLat: location.lat, locationLng: location.lng });
      return api.get('/events/upcoming').then((r) => r.data);
    },
    enabled: !location.loading,
  });

  const { data: styleData } = useQuery({
    queryKey: ['style'],
    queryFn: () => api.get('/profile/style').then((r) => r.data.style),
  });

  const { data: spotsData } = useQuery({
    queryKey: ['spots-home', location.lat, location.lng],
    queryFn: () => api.get(`/spots/nearby?lat=${location.lat}&lng=${location.lng}&radius=3000`).then((r) => r.data.spots),
    enabled: !location.loading,
  });

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}>

        {/* Top bar */}
        <View style={s.topBar}>
          <View>
            <Text style={s.greeting}>{greeting}, {user?.name?.split(' ')[0]}</Text>
            <Text style={s.wordmark}>Vision<Text style={s.wordmarkItalic}>Weave</Text></Text>
          </View>
          <View style={s.avatar}><Text style={s.avatarText}>{user?.name?.[0] ?? 'V'}</Text></View>
        </View>

        {/* Hero card */}
        <View style={s.hero}>
          <View style={s.heroGlow} />
          <Text style={s.heroTag}>{sun.sceneLabel} · Now</Text>
          <Text style={s.heroTitle}>
            {sun.isGoldenHour ? <Text style={s.heroEm}>Golden hour</Text>
              : sun.isBlueHour ? <Text style={s.heroEm}>Blue hour</Text>
              : 'Light conditions'}
            {'\n'}ready to shoot
          </Text>
          <Text style={s.heroSub}>Sun at {Math.round(sun.azimuth)}° · {Math.round(sun.altitude)}° altitude</Text>
          {styleData?.summary ? (
            <View style={s.stylePill}>
              <View style={s.stylePillDot} />
              <Text style={s.stylePillText} numberOfLines={1}>{styleData.summary}</Text>
            </View>
          ) : null}
          <TouchableOpacity style={s.heroCta} onPress={() => router.push('/(tabs)/camera')}>
            <Text style={s.heroCtaText}>Open Camera →</Text>
          </TouchableOpacity>
        </View>

        {/* Nearby spots */}
        {spotsData?.length > 0 && (
          <>
            <View style={s.secHeader}>
              <Text style={s.secTitle}>Nearby Spots</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/spots')}>
                <Text style={s.secLink}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hScroll} contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: 14 }}>
              {spotsData.slice(0, 5).map((spot: { id: string; name: string; styleTags: string[]; description?: string }, idx: number) => (
                <TouchableOpacity key={spot.id} style={[s.spotCard, { backgroundColor: SPOT_COLORS[idx % SPOT_COLORS.length] }]} onPress={() => router.push('/(tabs)/spots')}>
                  <View style={s.spotCardOv} />
                  <Text style={s.spotTag}>{spot.styleTags[0] ?? 'Spot'}</Text>
                  <Text style={s.spotName}>{spot.name}</Text>
                  {spot.description && <Text style={s.spotDesc} numberOfLines={1}>{spot.description}</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Upcoming events */}
        <View style={s.secHeader}>
          <Text style={s.secTitle}>This Week</Text>
        </View>
        {isLoading ? (
          <ActivityIndicator color={Colors.gold} style={{ marginTop: Spacing.lg }} />
        ) : (
          <View style={s.eventList}>
            {(data?.events ?? []).slice(0, 5).map((ev: ShootEvent) => (
              <TouchableOpacity
                key={ev.id}
                style={[s.ev, ev.requiresPro && user?.tier === 'FREE' && s.evLocked]}
                onPress={() => {
                  if (ev.requiresPro && user?.tier === 'FREE') setPaywallFeature(ev.title);
                }}>
                <View style={[s.evBar, { backgroundColor: ev.type === 'golden_hour' ? Colors.gold : ev.type === 'blue_hour' ? '#4A7ABF' : Colors.rust }]} />
                <View style={s.evTime}>
                  <Text style={[s.evTimeH, ev.requiresPro && user?.tier === 'FREE' && { color: Colors.creamDim }]}>{formatTime(ev.scheduledFor)}</Text>
                  <Text style={s.evTimeDay}>{formatDay(ev.scheduledFor)}</Text>
                </View>
                <View style={s.evBody}>
                  <Text style={[s.evTitle, ev.requiresPro && user?.tier === 'FREE' && { color: Colors.creamDim }]}>{ev.title}</Text>
                  <Text style={s.evDesc} numberOfLines={1}>{ev.body}</Text>
                </View>
                {ev.requiresPro && user?.tier === 'FREE' && (
                  <View style={s.proBadge}><Text style={s.proBadgeTxt}>PRO</Text></View>
                )}
              </TouchableOpacity>
            ))}
            {(!data?.events || data.events.length === 0) && (
              <Text style={s.empty}>No upcoming events. Check back soon!</Text>
            )}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      <ProPaywall feature={paywallFeature} visible={!!paywallFeature} onClose={() => setPaywallFeature('')} />
    </SafeAreaView>
  );
}

const SPOT_COLORS = ['#3D1A0A', '#0A1830', '#1A0A20', '#0A1A0A', '#1A1808'];

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, paddingBottom: Spacing.sm },
  greeting: { color: Colors.creamDim, fontSize: 13 },
  wordmark: { color: Colors.gold, fontSize: 22, fontWeight: '300' },
  wordmarkItalic: { fontStyle: 'italic', color: Colors.cream },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${Colors.gold}20`, borderWidth: 1.5, borderColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.gold, fontSize: 16, fontWeight: '700' },
  hero: { margin: Spacing.lg, marginTop: Spacing.sm, backgroundColor: Colors.card, borderRadius: Radii.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', position: 'relative' },
  heroGlow: { position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: `${Colors.gold}15` },
  heroTag: { color: Colors.gold, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  heroTitle: { color: Colors.cream, fontSize: 28, fontWeight: '300', lineHeight: 36, marginBottom: 8 },
  heroEm: { fontStyle: 'italic', color: Colors.gold },
  heroSub: { color: Colors.creamDim, fontSize: 14, marginBottom: 16 },
  stylePill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${Colors.gold}10`, borderRadius: Radii.full, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 16, borderWidth: 1, borderColor: `${Colors.gold}25`, alignSelf: 'flex-start' },
  stylePillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.gold },
  stylePillText: { color: Colors.gold, fontSize: 12, flex: 1 },
  heroCta: { backgroundColor: `${Colors.gold}20`, borderRadius: Radii.md, paddingVertical: 12, paddingHorizontal: 20, alignSelf: 'flex-start', borderWidth: 1, borderColor: `${Colors.gold}40` },
  heroCtaText: { color: Colors.gold, fontSize: 14, fontWeight: '600' },
  secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm, marginTop: Spacing.md },
  secTitle: { color: Colors.cream, fontSize: 18, fontWeight: '400' },
  secLink: { color: Colors.gold, fontSize: 13 },
  hScroll: { marginBottom: Spacing.md },
  spotCard: { width: 160, height: 200, borderRadius: Radii.lg, overflow: 'hidden', justifyContent: 'flex-end', padding: 14 },
  spotCardOv: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  spotTag: { color: Colors.gold, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  spotName: { color: Colors.cream, fontSize: 14, fontWeight: '500' },
  spotDesc: { color: Colors.creamDim, fontSize: 11, marginTop: 2 },
  eventList: { paddingHorizontal: Spacing.lg, gap: 10 },
  ev: { flexDirection: 'row', alignItems: 'stretch', backgroundColor: Colors.card, borderRadius: Radii.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  evLocked: { opacity: 0.5 },
  evBar: { width: 4 },
  evTime: { padding: Spacing.md, alignItems: 'center', justifyContent: 'center', minWidth: 64, borderRightWidth: 1, borderColor: Colors.border },
  evTimeH: { color: Colors.gold, fontSize: 16, fontWeight: '600' },
  evTimeDay: { color: Colors.creamDim, fontSize: 11, marginTop: 2 },
  evBody: { flex: 1, padding: Spacing.md, justifyContent: 'center' },
  evTitle: { color: Colors.cream, fontSize: 14, fontWeight: '500', marginBottom: 3 },
  evDesc: { color: Colors.creamDim, fontSize: 12 },
  proBadge: { margin: Spacing.md, backgroundColor: `${Colors.creamFaint}`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'center' },
  proBadgeTxt: { color: Colors.creamDim, fontSize: 10, letterSpacing: 1 },
  empty: { color: Colors.creamDim, textAlign: 'center', fontSize: 14, paddingVertical: Spacing.xl },
});
