import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, Spacing, Radii } from '../../src/constants/theme';

const TIER_COLORS: Record<string, string> = {
  FREE: Colors.creamDim,
  PRO: Colors.gold,
  STUDIO: Colors.green,
};

const LOCALE_LABELS: Record<string, string> = {
  en: 'English', zh: '中文', fr: 'Français', es: 'Español',
};

interface StatItem { label: string; value: string | number; }

function StatCard({ stats }: { stats: StatItem[] }) {
  return (
    <View style={s.statCard}>
      {stats.map((st, i) => (
        <React.Fragment key={st.label}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{st.value}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
          {i < stats.length - 1 && <View style={s.statDiv} />}
        </React.Fragment>
      ))}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionCard}>{children}</View>
    </View>
  );
}

function Row({ label, value, onPress, danger }: { label: string; value?: string; onPress?: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} disabled={!onPress}>
      <Text style={[s.rowLabel, danger && { color: Colors.error }]}>{label}</Text>
      {value !== undefined && <Text style={[s.rowValue, danger && { color: Colors.error }]}>{value}</Text>}
      {onPress && <Text style={[s.rowChevron, danger && { color: Colors.error }]}>›</Text>}
    </TouchableOpacity>
  );
}

function SwitchRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.card, true: `${Colors.gold}50` }}
        thumbColor={value ? Colors.gold : Colors.creamDim}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const { data: stats } = useQuery({
    queryKey: ['profile-stats'],
    queryFn: () => api.get('/profile/stats').then((r) => r.data).catch(() => null),
  });

  async function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive', onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  const tierColor = TIER_COLORS[user?.tier ?? 'FREE'] ?? Colors.creamDim;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Profile header */}
        <View style={s.profileHeader}>
          <View style={s.avatarLg}>
            <Text style={s.avatarLgText}>{user?.name?.[0]?.toUpperCase() ?? 'V'}</Text>
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileName}>{user?.name ?? 'Photographer'}</Text>
            <Text style={s.profileEmail}>{user?.email}</Text>
            <View style={[s.tierBadge, { borderColor: tierColor }]}>
              <Text style={[s.tierText, { color: tierColor }]}>{user?.tier ?? 'FREE'}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <StatCard stats={[
          { label: 'Sessions', value: stats?.sessions ?? 0 },
          { label: 'Quiz Rounds', value: stats?.quizRounds ?? 0 },
          { label: 'Spots Seen', value: stats?.spotViews ?? 0 },
        ]} />

        {/* Upgrade banner (FREE only) */}
        {user?.tier === 'FREE' && (
          <View style={s.upgradeBanner}>
            <View style={s.upgradeGlow} />
            <Text style={s.upgradeTitle}>Unlock Pro</Text>
            <Text style={s.upgradeSub}>
              Get weather-based shoot alerts, astronomy events, and advanced AI guidance.
            </Text>
            <TouchableOpacity style={s.upgradeBtn}>
              <Text style={s.upgradeBtnText}>Upgrade to Pro →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Account */}
        <Section title="Account">
          <Row label="Name" value={user?.name} />
          <Row label="Email" value={user?.email} />
          <Row label="Language" value={LOCALE_LABELS[user?.locale ?? 'en'] ?? user?.locale} />
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <SwitchRow
            label="Push Notifications"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
          <Row label="Style Quiz" value="Retake" onPress={() => router.push('/(onboarding)/genre-select')} />
        </Section>

        {/* App */}
        <Section title="App">
          <Row label="Version" value="1.0.0-mvp" />
          <Row
            label="Privacy Policy"
            onPress={() => Alert.alert('Privacy', 'Privacy policy coming soon.')}
          />
          <Row
            label="Terms of Service"
            onPress={() => Alert.alert('Terms', 'Terms coming soon.')}
          />
        </Section>

        {/* Danger zone */}
        <Section title="">
          <Row label="Log Out" onPress={handleLogout} danger />
        </Section>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 40 },

  profileHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.lg, gap: Spacing.md,
  },
  avatarLg: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: `${Colors.gold}15`,
    borderWidth: 2, borderColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLgText: { color: Colors.gold, fontSize: 26, fontWeight: '700' },
  profileInfo: { flex: 1 },
  profileName: { color: Colors.cream, fontSize: 20, fontWeight: '400' },
  profileEmail: { color: Colors.creamDim, fontSize: 13, marginTop: 2, marginBottom: 8 },
  tierBadge: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: Radii.full,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  tierText: { fontSize: 10, letterSpacing: 1.5, fontWeight: '600' },

  statCard: {
    flexDirection: 'row', backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.lg,
    borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  statValue: { color: Colors.gold, fontSize: 22, fontWeight: '600' },
  statLabel: { color: Colors.creamDim, fontSize: 11, marginTop: 3 },
  statDiv: { width: 1, backgroundColor: Colors.border },

  upgradeBanner: {
    margin: Spacing.lg, marginTop: 0, padding: Spacing.lg,
    backgroundColor: Colors.card, borderRadius: Radii.xl,
    borderWidth: 1, borderColor: `${Colors.gold}30`, overflow: 'hidden',
  },
  upgradeGlow: {
    position: 'absolute', top: -50, right: -50,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: `${Colors.gold}12`,
  },
  upgradeTitle: { color: Colors.gold, fontSize: 18, fontWeight: '500', marginBottom: 6 },
  upgradeSub: { color: Colors.creamDim, fontSize: 13, lineHeight: 19, marginBottom: 16 },
  upgradeBtn: {
    backgroundColor: `${Colors.gold}20`, borderRadius: Radii.md,
    paddingVertical: 12, paddingHorizontal: 20, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: `${Colors.gold}40`,
  },
  upgradeBtnText: { color: Colors.gold, fontSize: 14, fontWeight: '600' },

  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: { color: Colors.creamDim, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: Spacing.sm },
  sectionCard: {
    backgroundColor: Colors.card, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  rowLabel: { color: Colors.cream, fontSize: 14 },
  rowValue: { color: Colors.creamDim, fontSize: 14 },
  rowChevron: { color: Colors.creamDim, fontSize: 18, marginLeft: 6 },

  error: { color: Colors.error },
});
