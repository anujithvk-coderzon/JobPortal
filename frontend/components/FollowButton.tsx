'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { followAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing ?? false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(initialIsFollowing === undefined);

  // Check if this is the user's own profile
  const isOwnProfile = user?.id === userId;

  // Check follow status on mount if not provided
  useEffect(() => {
    if (initialIsFollowing === undefined && isAuthenticated && !isOwnProfile) {
      checkFollowStatus();
    }
  }, [userId, isAuthenticated, isOwnProfile, initialIsFollowing]);

  const checkFollowStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await followAPI.checkFollowStatus(userId);
      setIsFollowing(response.data.isFollowing);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please log in to follow users.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      if (isFollowing) {
        const response = await followAPI.unfollowUser(userId);
        if (response.data?.error) {
          throw new Error(response.data.error);
        }
        setIsFollowing(false);
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
        setIsFollowing(true);
        onFollowChange?.(true);
        toast({
          title: 'Following',
          description: 'You are now following this user.',
        });
      }
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
