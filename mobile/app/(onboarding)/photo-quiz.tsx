import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/services/api';
import { useStyleStore } from '../../src/stores/styleStore';
import { useAuthStore } from '../../src/stores/authStore';
import { track } from '../../src/services/telemetry';
import { Colors, Spacing, Radii } from '../../src/constants/theme';

const MAX_ROUNDS = 10;

interface Photo { id: string; url: string; thumb: string; tags: string[]; alt: string; }
const GRADIENTS = ['#3D1A0A,#C07020', '#0A1830,#2A5888', '#0A1A0A,#204020', '#1A0A20,#602A80'];

export default function PhotoQuizScreen() {
  const { quizRound, nextRound, setQuizComplete } = useStyleStore();
  const { setOnboardingComplete } = useAuthStore();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['quiz-photos', quizRound],
    queryFn: () => api.get(`/quiz/photos?round=${quizRound}`).then((r) => r.data.photos as Photo[]),
  });

  const progress = Array.from({ length: MAX_ROUNDS }, (_, i) => i < quizRound);

  async function handleNext() {
    if (!data) return;
    setSubmitting(true);
    try {
      // Submit all 4 responses
      for (const photo of data) {
        if (!photo.url) continue; // skip fallbacks
        await api.post('/quiz/response', {
          photoId: photo.id,
          photoUrl: photo.url,
          photoTags: photo.tags,
          selected: selected.has(photo.id),
          quizRound,
        });
      }
      track('quiz.round_completed', { round: quizRound, selected: selected.size });
      setSelected(new Set());

      if (quizRound + 1 >= MAX_ROUNDS) {
        // Complete quiz
        await api.post('/quiz/complete');
        track('quiz.completed', { totalRounds: MAX_ROUNDS });
        setQuizComplete(true);
        setOnboardingComplete(true);
        router.replace('/(tabs)');
      } else {
        nextRound();
        refetch();
      }
    } catch {
      Alert.alert('Error', 'Something went wrong, please try again');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    await api.post('/quiz/complete');
    track('quiz.completed', { totalRounds: quizRound, skipped: true });
    setQuizComplete(true);
    setOnboardingComplete(true);
    router.replace('/(tabs)');
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.step}>Step 3 · Round {quizRound + 1} of {MAX_ROUNDS}</Text>
        <Text style={s.title}>Which <Text style={s.em}>move</Text> you?</Text>
        <View style={s.progressRow}>
          {progress.map((done, i) => <View key={i} style={[s.progressDot, done && s.progressDotDone]} />)}
        </View>
      </View>

      {isLoading ? (
        <View style={s.loading}><ActivityIndicator color={Colors.gold} size="large" /></View>
      ) : (
        <View style={s.grid}>
          {(data ?? []).map((photo, i) => {
            const isSel = selected.has(photo.id);
            return (
              <TouchableOpacity
                key={photo.id}
                style={[s.card, isSel && s.cardSelected]}
                onPress={() => {
                  const next = new Set(selected);
                  if (next.has(photo.id)) next.delete(photo.id); else next.add(photo.id);
                  setSelected(next);
                }}>
                {photo.url ? (
                  <Image source={{ uri: photo.url }} style={s.img} resizeMode="cover" />
                ) : (
                  <View style={[s.img, { background: GRADIENTS[i] }]} />
                )}
                <View style={s.imgOverlay} />
                <Text style={s.photoAlt} numberOfLines={2}>{photo.alt}</Text>
                {isSel && (
                  <View style={s.checkBadge}><Text style={s.checkText}>✓</Text></View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={s.actions}>
        <TouchableOpacity style={s.btn} onPress={handleNext} disabled={submitting || isLoading}>
          {submitting ? (
            <ActivityIndicator color={Colors.bg} />
          ) : (
            <Text style={s.btnText}>{quizRound + 1 >= MAX_ROUNDS ? 'Finish →' : 'Next Round →'}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={s.skip} onPress={handleSkip}>
          <Text style={s.skipText}>Skip & build basic profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg },
  header: { marginTop: 60, marginBottom: Spacing.lg },
  step: { color: Colors.creamDim, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  title: { color: Colors.cream, fontSize: 28, fontWeight: '300', marginBottom: 12 },
  em: { color: Colors.gold, fontStyle: 'italic' },
  progressRow: { flexDirection: 'row', gap: 4 },
  progressDot: { flex: 1, height: 2, borderRadius: 1, backgroundColor: `${Colors.gold}20` },
  progressDotDone: { backgroundColor: Colors.gold },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '48%', aspectRatio: 0.75, borderRadius: Radii.lg,
    overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', position: 'relative',
  },
  cardSelected: { borderColor: Colors.gold, shadowColor: Colors.gold, shadowRadius: 12, shadowOpacity: 0.5, shadowOffset: { width: 0, height: 0 } },
  img: { ...StyleSheet.absoluteFillObject },
  imgOverlay: { ...StyleSheet.absoluteFillObject, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' },
  photoAlt: { position: 'absolute', bottom: 10, left: 10, right: 10, color: Colors.cream, fontSize: 12, fontStyle: 'italic' },
  checkBadge: {
    position: 'absolute', top: 10, right: 10, width: 28, height: 28,
    borderRadius: 14, backgroundColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  checkText: { color: Colors.bg, fontSize: 14, fontWeight: '700' },
  actions: { marginTop: Spacing.md, gap: Spacing.sm },
  btn: { backgroundColor: Colors.gold, borderRadius: Radii.md, padding: 18, alignItems: 'center' },
  btnText: { color: Colors.bg, fontSize: 16, fontWeight: '700' },
  skip: { alignItems: 'center', padding: 10 },
  skipText: { color: Colors.creamDim, fontSize: 13 },
});
