'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { followAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';
import { Users, Loader2, ChevronRight } from 'lucide-react';

interface FollowingUser {
  id: string;
  name: string;
  profilePhoto?: string;
  headline?: string;
}

interface FollowingSidebarProps {
  onFilterByUser?: (userId: string | null) => void;
  selectedUserId?: string | null;
  refreshKey?: number;
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
}

export function FollowingSidebar({ onFilterByUser, selectedUserId, refreshKey, onFollowChange }: FollowingSidebarProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFollowing();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, refreshKey]);

  const fetchFollowing = async () => {
    try {
      const response = await followAPI.getFollowing({ limit: 200 });
      setFollowing(response.data.users);
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId: string) => {
    if (onFilterByUser) {
      onFilterByUser(selectedUserId === userId ? null : userId);
    }
  };

  const handleViewProfile = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/user/${userId}`);
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            Log in to follow users and see personalized content
          </p>
          <Button size="sm" onClick={() => router.push('/auth/login')}>
            Log In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />
          Following ({following.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : following.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            You're not following anyone yet. Follow users to see their posts here!
          </p>
        ) : (
          <ScrollArea className="h-full pr-3">
            <div className="space-y-2">
              {following.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedUserId === user.id
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => handleUserClick(user.id)}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={user.profilePhoto || undefined} />
                    <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    {user.headline && (
                      <p className="text-xs text-muted-foreground truncate">{user.headline}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={(e) => handleViewProfile(user.id, e)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
