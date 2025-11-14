'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProfileAvatarProps {
  user: any;
  className?: string;
  showCompletionRing?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProfileAvatar({
  user,
  className = '',
  showCompletionRing = true,
  size = 'md'
}: ProfileAvatarProps) {
  const router = useRouter();
  const profileUpdateTrigger = useAuthStore((state) => state.profileUpdateTrigger);
  const [completionScore, setCompletionScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (showCompletionRing && user) {
      fetchCompletionScore();
    }
  }, [user, showCompletionRing, profileUpdateTrigger]);

  const fetchCompletionScore = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const profile = data.data.profile;

        // Use completion score from backend
        const score = profile?.completionScore || 20;

        setCompletionScore(score);
      }
    } catch (error) {
      console.error('Error fetching completion score:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBorderColor = () => {
    if (!completionScore) return 'border-gray-300';
    if (completionScore >= 80) return 'border-green-500';
    if (completionScore >= 50) return 'border-yellow-500';
    return 'border-red-500';
  };

  const getTextColor = () => {
    if (!completionScore) return '#94a3b8'; // gray
    if (completionScore >= 80) return '#22c55e'; // green
    if (completionScore >= 50) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const shouldShowCompletion = showCompletionRing && !loading && completionScore !== null && completionScore < 100;

  const avatarContent = (
    <div className={`relative inline-block ${className}`}>
      <Avatar className={`${sizeClasses[size]} ${shouldShowCompletion ? `border-2 ${getBorderColor()}` : ''}`}>
        <AvatarImage
          src={user?.profilePhoto || undefined}
          alt={user?.name}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
        />
        <AvatarFallback>{getInitials(user?.name || 'U')}</AvatarFallback>
      </Avatar>
      {shouldShowCompletion && completionScore !== null && (
        <span
          className="absolute bg-white rounded-full px-1 py-0 text-[10px] font-bold shadow-md ring-1 ring-black/5 leading-tight"
          style={{
            bottom: '-0.125rem',
            right: '-0.625rem',
            color: getTextColor()
          }}
        >
          {completionScore}%
        </span>
      )}
    </div>
  );

  if (!shouldShowCompletion) {
    return avatarContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-block cursor-pointer">
            {avatarContent}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="font-semibold">Profile {completionScore}% complete</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click to complete your profile and stand out to employers
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
