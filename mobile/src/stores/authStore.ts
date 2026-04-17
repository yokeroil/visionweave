import { create } from 'zustand';
import { api, saveTokens, clearTokens } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  locale: string;
  tier: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, locale?: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setOnboardingComplete: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  onboardingComplete: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      await saveTokens(res.data.accessToken, res.data.refreshToken);
      set({ user: res.data.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (email, password, name, locale = 'en') => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/register', { email, password, name, locale });
      await saveTokens(res.data.accessToken, res.data.refreshToken);
      set({ user: res.data.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await clearTokens();
    set({ user: null, isAuthenticated: false, onboardingComplete: false });
  },

  setUser: (user) => set({ user }),
  setOnboardingComplete: (v) => set({ onboardingComplete: v }),
}));
