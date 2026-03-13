import useSWR from 'swr';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function useDashboardStats() {
  const { isAuthenticated } = useAuthStore();

  const swr = useSWR(
    isAuthenticated ? '/applications/dashboard' : null,
    async () => {
      const response = await api.get('/applications/dashboard');
      if (response.success) return response.data;
      return {};
    },
    { dedupingInterval: 15000, revalidateOnFocus: true }
  );

  return {
    ...swr,
    stats: swr.data || {},
    isLoading: swr.isLoading,
  };
}
