import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../src/constants/theme';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = { home: '⌂', camera: '◉', spots: '◎', style: '◈', profile: '👤' };
  return (
    <View style={[ti.wrap, focused && ti.active]}>
      <Text style={[ti.icon, focused && ti.iconActive]}>{icons[name] ?? '•'}</Text>
    </View>
  );
}

const ti = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 12 },
  active: { backgroundColor: `${Colors.gold}15` },
  icon: { fontSize: 20, color: `${Colors.cream}60` },
  iconActive: { color: Colors.gold },
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.panel,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 18,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: `${Colors.cream}50`,
        tabBarLabelStyle: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }} />
      <Tabs.Screen name="spots" options={{ title: 'Spots', tabBarIcon: ({ focused }) => <TabIcon name="spots" focused={focused} /> }} />
      <Tabs.Screen name="camera" options={{ title: 'Camera', tabBarIcon: ({ focused }) => <TabIcon name="camera" focused={focused} /> }} />
      <Tabs.Screen name="style" options={{ title: 'Style', tabBarIcon: ({ focused }) => <TabIcon name="style" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} /> }} />
    </Tabs>
  );
}
