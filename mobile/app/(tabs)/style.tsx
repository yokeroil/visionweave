import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api } from '../../src/services/api';
import { useStyleStore } from '../../src/stores/styleStore';
import { Colors, Spacing, Radii } from '../../src/constants/theme';

interface StyleVector {
  golden_hour: number; blue_hour: number; portrait: number; landscape: number;
  street: number; architecture: number; astro: number; moody: number;
  bright_airy: number; film_grain: number; minimal: number; warm_tones: number;
  cool_tones: number; vibrant: number;
}

interface StyleData {
  summary: string;
  vector: StyleVector;
  topTags: string[];
  quizComplete: boolean;
}

const VECTOR_LABELS: Record<string, string> = {
  golden_hour: 'Golden Hour', blue_hour: 'Blue Hour', portrait: 'Portrait',
  landscape: 'Landscape', street: 'Street', architecture: 'Architecture',
  astro: 'Astro', moody: 'Moody & Dark', bright_airy: 'Bright & Airy',
  film_grain: 'Film Grain', minimal: 'Minimalist', warm_tones: 'Warm Tones',
  cool_tones: 'Cool Tones', vibrant: 'Vivid & Bold',
};

function StyleBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <View style={sv.row}>
      <Text style={sv.label}>{label}</Text>
      <View style={sv.track}>
        <View style={[sv.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={sv.pct}>{pct}%</Text>
    </View>
  );
}

export default function StyleScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { resetQuiz } = useStyleStore();

  const { data, isLoading } = useQuery<StyleData>({
    queryKey: ['style'],
    queryFn: () => api.get('/profile/style').then((r) => r.data.style),
  });

  function handleRetakeQuiz() {
    resetQuiz();
    queryClient.invalidateQueries({ queryKey: ['style'] });
    router.push('/(onboarding)/genre-select');
  }

  const vector = data?.vector as StyleVector | undefined;
  const sortedKeys = vector
    ? (Object.keys(vector) as (keyof StyleVector)[]).sort((a, b) => vector[b] - vector[a])
    : [];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Your <Text style={s.em}>Style</Text></Text>
          <Text style={s.sub}>AI-inferred from your photo preferences</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={Colors.gold} style={{ marginTop: 60 }} />
        ) : !data || !data.quizComplete ? (
          /* No style profile yet */
          <View style={s.emptyCard}>
            <Text style={s.emptyTitle}>No style profile yet</Text>
            <Text style={s.emptySub}>Complete the photo quiz to unlock your AI style profile.</Text>
            <TouchableOpacity style={s.quizBtn} onPress={() => router.push('/(onboarding)/genre-select')}>
              <Text style={s.quizBtnText}>Take the Quiz →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Summary card */}
            <View style={s.summaryCard}>
              <View style={s.summaryGlow} />
              <Text style={s.summaryLabel}>Style Profile</Text>
              <Text style={s.summaryText}>{data.summary}</Text>
              {data.topTags?.length > 0 && (
                <View style={s.topTagsRow}>
                  {data.topTags.slice(0, 4).map((t) => (
                    <View key={t} style={s.topTag}>
                      <Text style={s.topTagText}>{VECTOR_LABELS[t] ?? t}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Style vector breakdown */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Style Breakdown</Text>
              <View style={s.vectorCard}>
                {sortedKeys.map((key) => (
                  <StyleBar
                    key={key}
                    label={VECTOR_LABELS[key] ?? key}
                    value={vector![key]}
                  />
                ))}
              </View>
            </View>

            {/* Retake */}
            <View style={s.section}>
              <TouchableOpacity style={s.retakeBtn} onPress={handleRetakeQuiz}>
                <Text style={s.retakeBtnText}>Retake Style Quiz</Text>
              </TouchableOpacity>
              <Text style={s.retakeNote}>
                Your style profile updates after each quiz completion. Take it periodically to keep your profile fresh.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const sv = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  label: { color: Colors.creamDim, fontSize: 12, width: 100 },
  track: { flex: 1, height: 4, backgroundColor: `${Colors.gold}15`, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: Colors.gold, borderRadius: 2 },
  pct: { color: Colors.creamDim, fontSize: 11, width: 30, textAlign: 'right' },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 40 },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  title: { color: Colors.cream, fontSize: 28, fontWeight: '300' },
  em: { color: Colors.gold, fontStyle: 'italic' },
  sub: { color: Colors.creamDim, fontSize: 13, marginTop: 4 },

  emptyCard: {
    margin: Spacing.lg, padding: Spacing.xl,
    backgroundColor: Colors.card, borderRadius: Radii.xl,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  emptyTitle: { color: Colors.cream, fontSize: 20, fontWeight: '300', marginBottom: 10 },
  emptySub: { color: Colors.creamDim, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  quizBtn: { backgroundColor: Colors.gold, borderRadius: Radii.md, paddingVertical: 14, paddingHorizontal: 28 },
  quizBtnText: { color: Colors.bg, fontSize: 15, fontWeight: '700' },

  summaryCard: {
    margin: Spacing.lg, padding: Spacing.lg,
    backgroundColor: Colors.card, borderRadius: Radii.xl,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  summaryGlow: {
    position: 'absolute', top: -60, right: -60, width: 200, height: 200,
    borderRadius: 100, backgroundColor: `${Colors.gold}10`,
  },
  summaryLabel: { color: Colors.gold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 },
  summaryText: { color: Colors.cream, fontSize: 16, fontWeight: '300', lineHeight: 24, marginBottom: 16 },
  topTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topTag: {
    backgroundColor: `${Colors.gold}15`, borderRadius: Radii.full,
    paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: `${Colors.gold}25`,
  },
  topTagText: { color: Colors.gold, fontSize: 11 },

  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { color: Colors.cream, fontSize: 16, fontWeight: '400', marginBottom: Spacing.md },
  vectorCard: {
    backgroundColor: Colors.card, borderRadius: Radii.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },

  retakeBtn: {
    borderWidth: 1, borderColor: `${Colors.gold}40`, borderRadius: Radii.md,
    paddingVertical: 14, alignItems: 'center', marginBottom: Spacing.sm,
  },
  retakeBtnText: { color: Colors.gold, fontSize: 14, fontWeight: '500' },
  retakeNote: { color: Colors.creamDim, fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
