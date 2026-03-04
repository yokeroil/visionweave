import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, Spacing, Radii } from '../../src/constants/theme';

const LOCALES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'zh', label: '🇨🇳 中文' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'es', label: '🇪🇸 Español' },
];

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [locale, setLocale] = useState('en');
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  async function handleRegister() {
    if (!email || !password || !name) return Alert.alert('Error', 'Please fill in all fields');
    if (password.length < 8) return Alert.alert('Error', 'Password must be at least 8 characters');
    try {
      await register(email.trim().toLowerCase(), password, name.trim(), locale);
      router.replace('/(onboarding)/genre-select');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Registration failed';
      Alert.alert('Error', msg);
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.wordmark}>Vision<Text style={s.wordmarkItalic}>Weave</Text></Text>
          <Text style={s.tagline}>Create your account</Text>
        </View>
        <View style={s.form}>
          <Text style={s.label}>Full Name</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Maya Chen" placeholderTextColor={Colors.creamDim} />
          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" placeholderTextColor={Colors.creamDim} />
          <Text style={s.label}>Password</Text>
          <TextInput style={s.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Min 8 characters" placeholderTextColor={Colors.creamDim} />
          <Text style={s.label}>Language</Text>
          <View style={s.localeRow}>
            {LOCALES.map((l) => (
              <TouchableOpacity
                key={l.code}
                style={[s.localeBtn, locale === l.code && s.localeActive]}
                onPress={() => setLocale(l.code)}>
                <Text style={[s.localeTxt, locale === l.code && s.localeActiveTxt]}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={isLoading}>
            <Text style={s.btnText}>{isLoading ? 'Creating account…' : 'Create Account'}</Text>
          </TouchableOpacity>
          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" style={s.link}>Sign in</Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  wordmark: { fontSize: 36, color: Colors.gold, letterSpacing: 1, fontWeight: '300' },
  wordmarkItalic: { fontStyle: 'italic', color: Colors.cream },
  tagline: { color: Colors.creamDim, fontSize: 14, marginTop: 8 },
  form: { gap: Spacing.sm },
  label: { color: Colors.creamDim, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  input: {
    backgroundColor: Colors.card, borderRadius: Radii.md, padding: Spacing.md,
    color: Colors.cream, fontSize: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm,
  },
  localeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  localeBtn: { borderRadius: Radii.sm, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  localeActive: { borderColor: Colors.gold, backgroundColor: `${Colors.gold}15` },
  localeTxt: { color: Colors.creamDim, fontSize: 13 },
  localeActiveTxt: { color: Colors.gold },
  btn: { backgroundColor: Colors.gold, borderRadius: Radii.md, padding: 18, alignItems: 'center', marginTop: Spacing.sm },
  btnText: { color: Colors.bg, fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  footerText: { color: Colors.creamDim, fontSize: 14 },
  link: { color: Colors.gold, fontSize: 14, fontWeight: '600' },
});
