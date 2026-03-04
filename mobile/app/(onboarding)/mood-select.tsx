import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useStyleStore } from '../../src/stores/styleStore';
import { api } from '../../src/services/api';
import { track } from '../../src/services/telemetry';
import { Colors, Spacing, Radii } from '../../src/constants/theme';

const MOODS = [
  { id: 'moody', label: 'Moody & Dark', color: '#2D1F3D' },
  { id: 'bright_airy', label: 'Bright & Airy', color: '#3D3020' },
  { id: 'film_grain', label: 'Film Grain', color: '#2A1A0A' },
  { id: 'minimal', label: 'Minimalist', color: '#0A1A1A' },
  { id: 'warm_tones', label: 'Warm Golden', color: '#3D2A08' },
  { id: 'cool_tones', label: 'Cool & Blue', color: '#0A1830' },
  { id: 'vibrant', label: 'Vivid & Bold', color: '#1A0A30' },
  { id: 'black_white', label: 'Black & White', color: '#1A1A1A' },
];

export default function MoodSelectScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const { genres, setMoods } = useStyleStore();
  const router = useRouter();

  function toggle(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function handleNext() {
    if (selected.length === 0) return Alert.alert('', 'Pick at least one aesthetic that resonates');
    setMoods(selected);
    track('quiz.mood_selected', { moods: selected });
    // Save genres + moods to server
    try {
      await api.post('/quiz/setup', { genres, moods: selected });
    } catch { /* continue */ }
    router.push('/(onboarding)/photo-quiz');
  }

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.back} onPress={() => router.back()}>
        <Text style={s.backText}>← Back</Text>
      </TouchableOpacity>
      <View style={s.header}>
        <Text style={s.step}>Step 2 of 3</Text>
        <Text style={s.title}>What's your <Text style={s.em}>aesthetic</Text>?</Text>
        <Text style={s.sub}>Select all moods that resonate with you</Text>
      </View>
      <ScrollView contentContainerStyle={s.grid}>
        {MOODS.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[s.card, { backgroundColor: m.color }, selected.includes(m.id) && s.cardActive]}
            onPress={() => toggle(m.id)}>
            <Text style={[s.cardLabel, selected.includes(m.id) && s.cardLabelActive]}>{m.label}</Text>
            {selected.includes(m.id) && <Text style={s.check}>✓</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={[s.btn, selected.length === 0 && s.btnDisabled]} onPress={handleNext}>
        <Text style={s.btnText}>Next →</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg },
  back: { marginTop: 60, marginBottom: 8 },
  backText: { color: Colors.gold, fontSize: 13 },
  header: { marginBottom: Spacing.xl },
  step: { color: Colors.creamDim, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  title: { color: Colors.cream, fontSize: 30, fontWeight: '300', lineHeight: 38, marginBottom: 6 },
  em: { color: Colors.gold, fontStyle: 'italic' },
  sub: { color: Colors.creamDim, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: Spacing.xl },
  card: {
    width: '47%', aspectRatio: 1.6, borderRadius: Radii.lg, padding: Spacing.md,
    justifyContent: 'flex-end', borderWidth: 1, borderColor: 'transparent',
  },
  cardActive: { borderColor: Colors.gold, shadowColor: Colors.gold, shadowRadius: 8, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 0 } },
  cardLabel: { color: Colors.creamDim, fontSize: 14, fontWeight: '500' },
  cardLabelActive: { color: Colors.gold },
  check: { position: 'absolute', top: 10, right: 12, color: Colors.gold, fontSize: 16, fontWeight: '700' },
  btn: { backgroundColor: Colors.gold, borderRadius: Radii.md, padding: 18, alignItems: 'center', marginBottom: 20 },
  btnDisabled: { backgroundColor: `${Colors.gold}40` },
  btnText: { color: Colors.bg, fontSize: 16, fontWeight: '700' },
});
