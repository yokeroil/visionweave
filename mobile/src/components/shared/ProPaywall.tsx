import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Colors, Spacing, Radii } from '../../constants/theme';

interface Props {
  feature: string;
  visible: boolean;
  onClose: () => void;
}

export function ProPaywall({ feature, visible, onClose }: Props) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.pill}><Text style={s.pillText}>PRO</Text></View>
          <Text style={s.title}>Unlock {feature}</Text>
          <Text style={s.sub}>
            Upgrade to Pro for weather notifications, astronomy events, and full AI personalization.
          </Text>
          <View style={s.features}>
            {['Weather-triggered shoot alerts','Fog, snow & astronomy events','Full style AI personalization','Unlimited style quiz rounds'].map((f) => (
              <View key={f} style={s.featureRow}>
                <Text style={s.check}>✦</Text>
                <Text style={s.featureText}>{f}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={s.cta}>
            <Text style={s.ctaText}>Upgrade to Pro — $7.99/mo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.dismiss} onPress={onClose}>
            <Text style={s.dismissText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.lg, paddingBottom: 40,
    borderWidth: 1, borderBottomWidth: 0, borderColor: Colors.border,
  },
  pill: {
    alignSelf: 'center', backgroundColor: `${Colors.gold}20`,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 16,
    borderWidth: 1, borderColor: `${Colors.gold}40`,
  },
  pillText: { color: Colors.gold, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  title: { color: Colors.cream, fontSize: 24, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  sub: { color: Colors.creamDim, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  features: { gap: 12, marginBottom: 28 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: { color: Colors.gold, fontSize: 12 },
  featureText: { color: Colors.cream, fontSize: 14 },
  cta: {
    backgroundColor: Colors.gold, borderRadius: Radii.md, padding: 18,
    alignItems: 'center', marginBottom: 12,
  },
  ctaText: { color: Colors.bg, fontSize: 16, fontWeight: '700' },
  dismiss: { alignItems: 'center', padding: 8 },
  dismissText: { color: Colors.creamDim, fontSize: 14 },
});
