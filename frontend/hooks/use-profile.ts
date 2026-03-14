import useSWR from 'swr';

import { userAPI, api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export const useProfile = () => {
  const { isAuthenticated } = useAuthStore();

  return useSWR(
    isAuthenticated ? '/users/profile' : null,
    async () => {
      const response = await userAPI.getProfile();
      return response.data?.data;
    },
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );
};

export const usePublicProfile = (userId: string | null) => {
  return useSWR(
    userId ? `/users/public-profile/${userId}` : null,
    async () => {
      const response = await api.get(`/users/public-profile/${userId}`, {
        params: { includeFollowCounts: true },
      });
      return response.data;
    }
  );
};
