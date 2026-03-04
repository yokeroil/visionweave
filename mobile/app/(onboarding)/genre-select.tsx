import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useStyleStore } from '../../src/stores/styleStore';
import { api } from '../../src/services/api';
import { track } from '../../src/services/telemetry';
import { Colors, Spacing, Radii } from '../../src/constants/theme';

const GENRES = [
  { id: 'landscape', label: 'Landscape', emoji: '🏔' },
  { id: 'portrait', label: 'Portrait', emoji: '🧍' },
  { id: 'street', label: 'Street', emoji: '🏙' },
  { id: 'architecture', label: 'Architecture', emoji: '🏛' },
  { id: 'astro', label: 'Astro', emoji: '✨' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'macro', label: 'Macro', emoji: '🔬' },
];

export default function GenreSelectScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const { setGenres } = useStyleStore();
  const router = useRouter();

  function toggle(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function handleNext() {
    if (selected.length === 0) return Alert.alert('', 'Pick at least one genre you love to shoot');
    setGenres(selected);
    track('quiz.genre_selected', { genres: selected });
    router.push('/(onboarding)/mood-select');
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.step}>Step 1 of 3</Text>
        <Text style={s.title}>What do you <Text style={s.em}>love</Text> to shoot?</Text>
        <Text style={s.sub}>Pick all that apply</Text>
      </View>
      <ScrollView contentContainerStyle={s.grid}>
        {GENRES.map((g) => (
          <TouchableOpacity
            key={g.id}
            style={[s.chip, selected.includes(g.id) && s.chipActive]}
            onPress={() => toggle(g.id)}>
            <Text style={s.chipEmoji}>{g.emoji}</Text>
            <Text style={[s.chipLabel, selected.includes(g.id) && s.chipLabelActive]}>{g.label}</Text>
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
  header: { marginTop: 60, marginBottom: Spacing.xl },
  step: { color: Colors.creamDim, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  title: { color: Colors.cream, fontSize: 30, fontWeight: '300', lineHeight: 38, marginBottom: 6 },
  em: { color: Colors.gold, fontStyle: 'italic' },
  sub: { color: Colors.creamDim, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: Spacing.xl },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.card, borderRadius: Radii.full, paddingHorizontal: 18, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { borderColor: Colors.gold, backgroundColor: `${Colors.gold}15` },
  chipEmoji: { fontSize: 18 },
  chipLabel: { color: Colors.creamDim, fontSize: 15, fontWeight: '400' },
  chipLabelActive: { color: Colors.gold },
  btn: { backgroundColor: Colors.gold, borderRadius: Radii.md, padding: 18, alignItems: 'center', marginBottom: 20 },
  btnDisabled: { backgroundColor: `${Colors.gold}40` },
  btnText: { color: Colors.bg, fontSize: 16, fontWeight: '700' },
});
