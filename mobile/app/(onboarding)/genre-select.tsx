import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useStyleStore } from '../../src/stores/styleStore';
import { track } from '../../src/services/telemetry';
import { Colors, Spacing, Radii } from '../../src/constants/theme';
import { GenreIcon } from '../../src/components/GenreIcon';

const GENRES = [
  { id: 'landscape',    label: 'Landscape' },
  { id: 'portrait',     label: 'Portrait' },
  { id: 'street',       label: 'Street' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'astro',        label: 'Astro' },
  { id: 'travel',       label: 'Travel' },
  { id: 'nature',       label: 'Nature' },
  { id: 'macro',        label: 'Macro' },
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

      <ScrollView contentContainerStyle={s.grid} showsVerticalScrollIndicator={false}>
        {GENRES.map((g) => {
          const active = selected.includes(g.id);
          return (
            <TouchableOpacity
              key={g.id}
              style={[s.card, active && s.cardActive]}
              onPress={() => toggle(g.id)}
              activeOpacity={0.75}>

              <View style={[s.iconWrap, active && s.iconWrapActive]}>
                <GenreIcon
                  genre={g.id}
                  size={52}
                  color={active ? Colors.gold : Colors.creamDim}
                />
              </View>

              <Text style={[s.label, active && s.labelActive]}>{g.label}</Text>

              {active && (
                <View style={s.checkDot}>
                  <Text style={s.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={[s.btn, selected.length === 0 && s.btnDisabled]}
        onPress={handleNext}>
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

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: Spacing.xl,
  },
  card: {
    width: '47.5%',
    paddingVertical: 22,
    paddingHorizontal: 12,
    borderRadius: Radii.lg,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  },
  cardActive: {
    borderColor: Colors.gold,
    backgroundColor: `${Colors.gold}0D`,
  },

  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: `${Colors.gold}12`,
  },

  label: {
    color: Colors.creamDim,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: Colors.gold,
  },

  checkDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { color: Colors.bg, fontSize: 12, fontWeight: '700' },

  btn: { backgroundColor: Colors.gold, borderRadius: Radii.md, padding: 18, alignItems: 'center', marginBottom: 20 },
  btnDisabled: { backgroundColor: `${Colors.gold}40` },
  btnText: { color: Colors.bg, fontSize: 16, fontWeight: '700' },
});
