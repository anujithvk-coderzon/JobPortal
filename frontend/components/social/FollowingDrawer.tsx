'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Loader2, ChevronRight, Eye, UserMinus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FollowButton } from '@/components/social/FollowButton';
import { followAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';

interface FollowingUser {
  id: string;
  name: string;
  profilePhoto?: string;
  headline?: string;
}

interface FollowingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilterByUser?: (userId: string | null) => void;
  selectedUserId?: string | null;
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
}

export const FollowingDrawer = ({ open, onOpenChange, onFilterByUser, selectedUserId, onFollowChange }: FollowingDrawerProps) => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && isAuthenticated) {
      fetchFollowing();
    }
  }, [open, isAuthenticated]);

  const fetchFollowing = async () => {
    try {
      setLoading(true);
      const response = await followAPI.getFollowing({ limit: 50 });
      setFollowing(response.data.users);
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId: string) => {
    router.push(`/user/${userId}`);
    onOpenChange(false);
  };

  const handleUnfollow = (userId: string) => {
    setFollowing((prev) => prev.filter((u) => u.id !== userId));
    onFollowChange?.(userId, false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[340px] sm:w-[420px] p-0 border-l border-border/60">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border/40">
          <div className="flex items-center justify-between mb-1">
            <SheetTitle className="text-[15px] font-semibold">Following</SheetTitle>
            <Badge variant="secondary" className="text-[11px] font-medium px-2 py-0.5 h-[20px]">
              {loading ? '...' : following.length}
            </Badge>
          </div>
          <p className="text-[12px] text-muted-foreground">People you follow in the community</p>
        </div>

        <ScrollArea className="h-[calc(100vh-90px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <p className="text-[12px] text-muted-foreground">Loading...</p>
            </div>
          ) : following.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-muted-foreground/30" />
              </div>
              <h3 className="text-[14px] font-semibold mb-1">No connections yet</h3>
              <p className="text-[12px] text-muted-foreground leading-relaxed max-w-[240px]">
                Follow people from their posts or profiles to see them here.
              </p>
            </div>
          ) : (
            <div className="py-2">
              {following.map((user) => (
                <div
                  key={user.id}
                  className="group px-3"
                >
                  <div className="flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-accent/40 transition-colors">
                    {/* Avatar */}
                    <div
                      className="relative flex-shrink-0 cursor-pointer"
                      onClick={() => handleUserClick(user.id)}
                    >
                      <Avatar className="h-10 w-10 border border-border/40">
                        <AvatarImage src={user.profilePhoto || undefined} alt={user.name} />
                        <AvatarFallback className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Info */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleUserClick(user.id)}
                    >
                      <p className="text-[13px] font-semibold truncate group-hover:text-primary transition-colors">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 truncate">
                        {user.headline || 'Community member'}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground/40 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleUserClick(user.id)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <FollowButton
                        userId={user.id}
                        size="sm"
                        showIcon={false}
                        className="h-7 text-[11px] px-2.5"
                        onFollowChange={(isFollowing) => {
                          if (!isFollowing) {
                            handleUnfollow(user.id);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default FollowingDrawer;
