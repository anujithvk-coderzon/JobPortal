'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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

interface FollowingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilterByUser?: (userId: string | null) => void;
  selectedUserId?: string | null;
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
}

export function FollowingDrawer({ open, onOpenChange, onFilterByUser, selectedUserId, onFollowChange }: FollowingDrawerProps) {
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[320px] sm:w-[400px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Following ({following.length})
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : following.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                You're not following anyone yet.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Follow users to see their posts!
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {following.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98] bg-muted/30 border border-border hover:bg-muted/60 hover:border-muted-foreground/20"
                  onClick={() => handleUserClick(user.id)}
                >
                  <Avatar className="h-12 w-12 flex-shrink-0 border-2 border-background shadow-sm">
                    <AvatarImage src={user.profilePhoto || undefined} />
                    <AvatarFallback className="text-sm font-medium">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{user.name}</p>
                    {user.headline && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{user.headline}</p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
