'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { Button } from '@/components/ui/button';
import { followAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useFollowStatus } from '@/hooks/use-follow';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing?: boolean;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost';
  showIcon?: boolean;
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  userId,
  initialIsFollowing,
  size = 'sm',
  variant = 'outline',
  showIcon = true,
  className = '',
  onFollowChange,
}: FollowButtonProps) {
  const { isAuthenticated, user } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false);

  // Check if this is the user's own profile
  const isOwnProfile = user?.id === userId;

  // Use SWR hook to check follow status (only when initialIsFollowing is not provided)
  const { data: followStatusData, isLoading: checkingStatus } = useFollowStatus(
    initialIsFollowing === undefined && !isOwnProfile ? userId : null
  );

  const isFollowing = initialIsFollowing !== undefined
    ? initialIsFollowing
    : (followStatusData?.isFollowing ?? false);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please log in to follow users.',
        variant: 'warning',
      });
      setTimeout(() => router.push('/auth/login'), 1500);
      return;
    }

    try {
      setLoading(true);
      if (isFollowing) {
        const response = await followAPI.unfollowUser(userId);
        if (response.data?.error) {
          throw new Error(response.data.error);
        }
        onFollowChange?.(false);
        toast({
          title: 'Unfollowed',
          description: 'You have unfollowed this user.',
        });
      } else {
        const response = await followAPI.followUser(userId);
        if (response.data?.error) {
          throw new Error(response.data.error);
        }
        onFollowChange?.(true);
        toast({
          title: 'Following',
          description: 'You are now following this user.',
        });
      }
      // Invalidate follow-related caches
      mutate(`/follow/status/${userId}`);
      mutate((key: unknown) => typeof key === 'string' && key.startsWith('/follow/'), undefined, { revalidate: true });
    } catch (error: any) {
      console.error('Follow error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update follow status';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't render for own profile or when not authenticated
  if (isOwnProfile || !isAuthenticated) {
    return null;
  }

  if (checkingStatus) {
    return (
      <Button size={size} variant={variant} disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={isFollowing ? 'outline' : 'default'}
      onClick={handleFollowToggle}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {showIcon && (
            isFollowing ? (
              <UserMinus className="h-4 w-4 mr-1" />
            ) : (
              <UserPlus className="h-4 w-4 mr-1" />
            )
          )}
          {isFollowing ? 'Following' : 'Follow'}
        </>
      )}
    </Button>
  );
}
