import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/services/api';
import { useLocation } from '../../src/hooks/useLocation';
import { useSunPosition } from '../../src/hooks/useSunPosition';
import { useAuthStore } from '../../src/stores/authStore';
import { CompositionOverlay } from '../../src/components/camera/CompositionOverlay';
import { SunDirectionIndicator } from '../../src/components/camera/SunDirectionIndicator';
import { SceneContextBanner } from '../../src/components/camera/SceneContextBanner';
import { GuidanceCard } from '../../src/components/camera/GuidanceCard';
import { Colors, Spacing } from '../../src/constants/theme';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [showOverlay, setShowOverlay] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const { user } = useAuthStore();
  const location = useLocation();
  const sun = useSunPosition(location.lat, location.lng);

  // Fetch AI guidance based on current scene
  const { data: guidanceData, isFetching: guidanceLoading } = useQuery({
    queryKey: ['guidance', sun.sceneLabel, Math.round(sun.azimuth / 90), user?.id],
    queryFn: () =>
      api.get('/guidance/scene', {
        params: {
          azimuth: Math.round(sun.azimuth),
          altitude: Math.round(sun.altitude),
          sceneLabel: sun.sceneLabel,
          isGoldenHour: sun.isGoldenHour,
          isBlueHour: sun.isBlueHour,
        },
      }).then((r) => r.data),
    enabled: !location.loading,
    staleTime: 15 * 60 * 1000, // 15 min cache
  });

  const startSession = useCallback(async () => {
    try {
      const res = await api.post('/guidance/session/start', {
        sceneLabel: sun.sceneLabel,
        sunAzimuth: Math.round(sun.azimuth),
        sunAltitude: Math.round(sun.altitude),
        lat: location.lat,
        lng: location.lng,
      });
      setSessionId(res.data.sessionId);
    } catch { /* non-critical */ }
  }, [sun, location]);

  const endSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      await api.post(`/guidance/session/${sessionId}/end`, { photoCount: 1 });
    } catch { /* non-critical */ }
    setSessionId(null);
  }, [sessionId]);

  if (!permission) {
    return <View style={s.center}><ActivityIndicator color={Colors.gold} /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={s.center}>
        <Text style={s.permTitle}>Camera Access Needed</Text>
        <Text style={s.permSub}>VisionWeave needs camera access to provide composition guidance.</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
          <Text style={s.permBtnText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        onCameraReady={startSession}
      >
        {/* Composition overlay */}
        {showOverlay && <CompositionOverlay />}

        {/* Top HUD */}
        <SafeAreaView style={s.topHud} edges={['top']}>
          <View style={s.topRow}>
            <SceneContextBanner
              sceneLabel={sun.sceneLabel}
              sunAzimuth={sun.azimuth}
            />
            <SunDirectionIndicator azimuth={sun.azimuth} />
          </View>
        </SafeAreaView>

        {/* Bottom controls */}
        <View style={s.bottomHud}>
          {/* Guidance card */}
          <GuidanceCard
            tip={guidanceData?.tip}
            isLoading={guidanceLoading}
            styleMatchScore={guidanceData?.styleMatchScore}
          />

          <View style={s.controls}>
            {/* Toggle overlay */}
            <TouchableOpacity style={s.iconBtn} onPress={() => setShowOverlay((v) => !v)}>
              <Text style={[s.iconBtnText, !showOverlay && { opacity: 0.35 }]}>⊞</Text>
            </TouchableOpacity>

            {/* Shutter — visual only in Expo Go */}
            <TouchableOpacity
              style={s.shutter}
              onPress={() => {
                endSession();
                Alert.alert('', 'Shot captured! (Camera capture requires development build)');
                startSession();
              }}
            />

            {/* Flip camera */}
            <TouchableOpacity
              style={s.iconBtn}
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}>
              <Text style={s.iconBtnText}>⇄</Text>
            </TouchableOpacity>
          </View>

          {/* Sun metrics bar */}
          <View style={s.sunBar}>
            <Text style={s.sunMetric}>Az {Math.round(sun.azimuth)}°</Text>
            <View style={s.sunDivider} />
            <Text style={s.sunMetric}>Alt {Math.round(sun.altitude)}°</Text>
            {sun.isGoldenHour && (
              <>
                <View style={s.sunDivider} />
                <Text style={[s.sunMetric, { color: Colors.gold }]}>Golden Hour</Text>
              </>
            )}
            {sun.isBlueHour && (
              <>
                <View style={s.sunDivider} />
                <Text style={[s.sunMetric, { color: '#4A7ABF' }]}>Blue Hour</Text>
              </>
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  permTitle: { color: Colors.cream, fontSize: 22, fontWeight: '300', marginBottom: 10, textAlign: 'center' },
  permSub: { color: Colors.creamDim, fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  permBtn: { backgroundColor: Colors.gold, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 36 },
  permBtnText: { color: Colors.bg, fontSize: 15, fontWeight: '700' },

  topHud: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },

  bottomHud: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: 44, paddingHorizontal: Spacing.md, gap: Spacing.md,
  },

  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.sm },
  shutter: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 3, borderColor: Colors.cream,
  },
  iconBtn: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  iconBtnText: { color: Colors.cream, fontSize: 22 },

  sunBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 8,
  },
  sunMetric: { color: Colors.creamDim, fontSize: 12, letterSpacing: 0.5 },
  sunDivider: { width: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.2)' },
});
