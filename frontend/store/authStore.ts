import { create } from 'zustand';
import { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  profileUpdateTrigger: number;
  setAuth: (user: User, token: string) => void;
  setTokens: (token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  triggerProfileUpdate: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,
  profileUpdateTrigger: 0,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    set({ user, token, isAuthenticated: true });
  },

  setTokens: (token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    set({ token });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (user) => {
    set({ user });
  },

  triggerProfileUpdate: () => {
    set((state) => ({ profileUpdateTrigger: state.profileUpdateTrigger + 1 }));
  },

  hydrate: async () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');

      if (token) {
        // Set token immediately so API calls work
        set({ token, isAuthenticated: true });

        try {
          // Fetch full user profile from API (no user data in localStorage)
          const { default: axiosInstance } = await import('@/lib/api');
          const response = await axiosInstance.get('/users/profile');
          const user = response.data.data;
          set({ user, isAuthenticated: true, isHydrated: true });
        } catch (e) {
          // Token expired — interceptor will try refresh via httpOnly cookie
          // If refresh also fails, forceLogout handles cleanup
          console.error('Failed to fetch user profile during hydration');
          localStorage.removeItem('token');
          set({ user: null, token: null, isAuthenticated: false, isHydrated: true });
        }
      } else {
        set({ isHydrated: true });
      }
    }
  },
}));
