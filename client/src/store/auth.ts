import { create } from 'zustand';
import api from '../lib/axios';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  setAuth: (user: User, token: string) => void;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  initialized: false,

  setAuth: (user, token) => set({ user, token, initialized: true }),

  fetchMe: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user, initialized: true, loading: false });
    } catch {
      set({ user: null, initialized: true, loading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      set({ user: null, token: null });
    }
  },
}));
