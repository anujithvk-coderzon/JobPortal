import { useCallback } from 'react';

import useSWR from 'swr';

import { notificationAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  postId?: string;
  createdAt: string;
  isRead: boolean;
}

export const useNotifications = () => {
  const { isAuthenticated } = useAuthStore();

  const swr = useSWR<Notification[]>(
    isAuthenticated ? '/notifications' : null,
    async () => {
      const response = await notificationAPI.getNotifications();
      return response.data?.data || [];
    },
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    await notificationAPI.markAsRead(notificationId);
    swr.mutate(
      (current: Notification[] | undefined) =>
        current?.filter((n) => n.id !== notificationId),
      { revalidate: false }
    );
  }, [swr]);

  return {
    ...swr,
    notifications: swr.data || [],
    unreadCount: (swr.data || []).length,
    markAsRead,
  };
};
