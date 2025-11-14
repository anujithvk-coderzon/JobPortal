'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, ChevronRight, User } from 'lucide-react';
import Link from 'next/link';

interface ProfileCompletionCardProps {
  user: any;
  profile: any;
  className?: string;
}

export function ProfileCompletionCard({ user, profile, className = '' }: ProfileCompletionCardProps) {
  // Use completion score from backend
  const completionScore = profile?.completionScore || 20; // Default to base score if no profile

  // Track completion items for displaying count
  const items = [
    { completed: !!user?.profilePhoto, points: 10 },
    { completed: !!profile?.bio, points: 10 },
    { completed: !!profile?.resume, points: 15 },
    { completed: profile?.skills && profile.skills.length > 0, points: 15 },
    { completed: profile?.experiences && profile.experiences.length > 0, points: 15 },
    { completed: profile?.education && profile.education.length > 0, points: 15 },
  ];

  const completedItems = items.filter((item) => item.completed);

  if (completionScore === 100) {
    return null; // Don't show if profile is complete
  }

  const getBadgeStyles = () => {
    if (completionScore >= 80) {
      return 'bg-green-600 text-white border-green-600 hover:bg-green-700';
    }
    if (completionScore >= 50) {
      return 'bg-yellow-600 text-white border-yellow-600 hover:bg-yellow-700';
    }
    return 'bg-red-600 text-white border-red-600 hover:bg-red-700';
  };

  const getCompletionMessage = () => {
    if (completionScore >= 80) return 'Almost there! Just a few more steps.';
    if (completionScore >= 50) return 'You\'re halfway there!';
    return 'Complete your profile to stand out!';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Complete Your Profile
            </CardTitle>
            <CardDescription className="mt-1">{getCompletionMessage()}</CardDescription>
          </div>
          <Badge
            variant="outline"
            className={`text-base px-2.5 py-0.5 ${getBadgeStyles()}`}
          >
            {completionScore}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={completionScore} className="h-2.5" />

        <div className="text-sm text-muted-foreground">
          <p className="mb-3">
            {completedItems.length} of {items.length} sections completed
          </p>
          <ul className="space-y-1 text-xs">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
              <span>Stand out to employers</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
              <span>Get better job matches</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
              <span>Increase interview chances</span>
            </li>
          </ul>
        </div>

        <Button asChild className="w-full" size="sm">
          <Link href="/profile">
            Complete Profile
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
