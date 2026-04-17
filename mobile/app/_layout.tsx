import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../src/stores/authStore';
import { getAccessToken, api } from '../src/services/api';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AuthGuard() {
  const { isAuthenticated, setUser, onboardingComplete, setOnboardingComplete } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (token) {
        try {
          const res = await api.get('/profile');
          setUser(res.data.user);
          // Check if style profile exists
          const styleRes = await api.get('/profile/style');
          const hasProfile = styleRes.data.style?.confidence > 0;
          setOnboardingComplete(hasProfile);
        } catch {
          // Token invalid
        }
      }
      setChecking(false);
    })();
  }, []);

  useEffect(() => {
    if (checking) return;
    const inAuth = segments[0] === '(auth)';
    const inOnboard = segments[0] === '(onboarding)';

    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && !onboardingComplete && !inOnboard && !inAuth) {
      router.replace('/(onboarding)/genre-select');
    } else if (isAuthenticated && onboardingComplete && (inAuth || inOnboard)) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, onboardingComplete, checking]);

  if (checking) return null;
  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <AuthGuard />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
