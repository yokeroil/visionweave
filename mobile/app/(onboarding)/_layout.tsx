import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#08070A' }, animation: 'slide_from_right' }} />;
}
