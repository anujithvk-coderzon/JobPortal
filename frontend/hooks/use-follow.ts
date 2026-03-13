import useSWR from 'swr';
import { followAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function useFollowStatus(userId: string | null) {
  const { isAuthenticated } = useAuthStore();

  return useSWR(
    isAuthenticated && userId ? `/follow/status/${userId}` : null,
    async () => {
      const response = await followAPI.checkFollowStatus(userId!);
      return response.data;
    },
    { revalidateOnFocus: false }
  );
}

export function useFollowing(params?: Record<string, any>) {
  const { isAuthenticated } = useAuthStore();

  return useSWR(
    isAuthenticated ? ['/follow/following', params] : null,
    async () => {
      const response = await followAPI.getFollowing(params);
      return response.data?.data || response.data;
    }
  );
}

export function useFollowCounts(userId: string | null) {
  return useSWR(
    userId ? `/follow/counts/${userId}` : null,
    async () => {
      const response = await followAPI.getFollowCounts(userId!);
      return response.data;
    },
    { revalidateOnFocus: false }
  );
}
