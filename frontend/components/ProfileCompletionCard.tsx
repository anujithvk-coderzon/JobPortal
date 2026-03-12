'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface ProfileCompletionCardProps {
  user: any;
  profile: any;
  className?: string;
}

export function ProfileCompletionCard({ user, profile, className = '' }: ProfileCompletionCardProps) {
  const completionScore = profile?.completionScore || 20;

  const items = [
    { label: 'Profile photo', completed: !!user?.profilePhoto, points: 10 },
    { label: 'Bio', completed: !!profile?.bio, points: 10 },
    { label: 'Resume', completed: !!profile?.resume, points: 15 },
    { label: 'Skills', completed: profile?.skills && profile.skills.length > 0, points: 15 },
    { label: 'Experience', completed: profile?.experiences && profile.experiences.length > 0, points: 15 },
    { label: 'Education', completed: profile?.education && profile.education.length > 0, points: 15 },
  ];

  const completedCount = items.filter((item) => item.completed).length;

  if (completionScore === 100) return null;

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <p className="text-[13px] font-semibold">Complete your profile</p>
              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                completionScore >= 80 ? 'bg-emerald-500/10 text-emerald-600' :
                completionScore >= 50 ? 'bg-amber-500/10 text-amber-600' :
                'bg-destructive/10 text-destructive'
              }`}>
                {completionScore}%
              </span>
            </div>
            <Progress value={completionScore} className="h-1.5 mb-2" />
            <p className="text-[12px] text-muted-foreground">
              {completedCount} of {items.length} sections completed
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="flex-shrink-0">
            <Link href="/profile">
              Complete <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
