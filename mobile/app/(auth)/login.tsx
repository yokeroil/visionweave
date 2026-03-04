import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, Spacing, Radii } from '../../src/constants/theme';
import { track } from '../../src/services/telemetry';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');
    try {
      await login(email.trim().toLowerCase(), password);
      track('session.start', { source: 'login' });
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Login failed';
      Alert.alert('Error', msg);
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.wordmark}>Vision<Text style={s.wordmarkItalic}>Weave</Text></Text>
          <Text style={s.tagline}>Your AI photography companion</Text>
        </View>
        <View style={s.form}>
          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input} value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none"
            placeholder="you@example.com" placeholderTextColor={Colors.creamDim}
          />
          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input} value={password} onChangeText={setPassword}
            secureTextEntry placeholder="••••••••" placeholderTextColor={Colors.creamDim}
          />
          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={isLoading}>
            <Text style={s.btnText}>{isLoading ? 'Signing in…' : 'Sign In'}</Text>
          </TouchableOpacity>
          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/register" style={s.link}>Sign up</Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  header: { alignItems: 'center', marginBottom: Spacing.xxl },
  wordmark: { fontSize: 36, color: Colors.gold, letterSpacing: 1, fontWeight: '300' },
  wordmarkItalic: { fontStyle: 'italic', color: Colors.cream },
  tagline: { color: Colors.creamDim, fontSize: 14, marginTop: 8 },
  form: { gap: Spacing.sm },
  label: { color: Colors.creamDim, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  input: {
    backgroundColor: Colors.card, borderRadius: Radii.md, padding: Spacing.md,
    color: Colors.cream, fontSize: 16, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  btn: {
    backgroundColor: Colors.gold, borderRadius: Radii.md, padding: 18,
    alignItems: 'center', marginTop: Spacing.sm,
  },
  btnText: { color: Colors.bg, fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  footerText: { color: Colors.creamDim, fontSize: 14 },
  link: { color: Colors.gold, fontSize: 14, fontWeight: '600' },
});
