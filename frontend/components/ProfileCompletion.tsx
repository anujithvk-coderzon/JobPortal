'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  Circle,
  Camera,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  User,
  ChevronRight,
} from 'lucide-react';

interface ProfileCompletionProps {
  user: any;
  profile: any;
  onNavigate?: (tab: string) => void;
  className?: string;
}

interface CompletionItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  points: number;
  icon: React.ReactNode;
  tab?: string;
}

export function ProfileCompletion({ user, profile, onNavigate, className = '' }: ProfileCompletionProps) {
  // Calculate completion items
  const completionItems: CompletionItem[] = [
    {
      id: 'photo',
      label: 'Profile Photo',
      description: 'Upload a professional photo',
      completed: !!user?.profilePhoto,
      points: 10,
      icon: <Camera className="h-4 w-4" />,
      tab: 'basic',
    },
    {
      id: 'bio',
      label: 'Bio',
      description: 'Tell us about yourself',
      completed: !!profile?.bio,
      points: 10,
      icon: <User className="h-4 w-4" />,
      tab: 'basic',
    },
    {
      id: 'resume',
      label: 'Resume',
      description: 'Upload your resume/CV',
      completed: !!profile?.resume,
      points: 15,
      icon: <FileText className="h-4 w-4" />,
      tab: 'basic',
    },
    {
      id: 'skills',
      label: 'Skills',
      description: 'Add your technical skills',
      completed: profile?.skills && profile.skills.length > 0,
      points: 15,
      icon: <Award className="h-4 w-4" />,
      tab: 'skills',
    },
    {
      id: 'experience',
      label: 'Work Experience',
      description: 'Add your work history',
      completed: profile?.experiences && profile.experiences.length > 0,
      points: 15,
      icon: <Briefcase className="h-4 w-4" />,
      tab: 'experience',
    },
    {
      id: 'education',
      label: 'Education',
      description: 'Add your educational background',
      completed: profile?.education && profile.education.length > 0,
      points: 15,
      icon: <GraduationCap className="h-4 w-4" />,
      tab: 'education',
    },
  ];

  const completedItems = completionItems.filter((item) => item.completed);
  const incompleteItems = completionItems.filter((item) => !item.completed);

  // Use completion score from backend if available, otherwise calculate it
  const completionScore = profile?.completionScore || 20; // Default to base score if no profile

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
    if (completionScore === 100) return 'Your profile is complete!';
    if (completionScore >= 80) return 'Almost there! Just a few more steps.';
    if (completionScore >= 50) return 'You\'re halfway there!';
    return 'Let\'s get your profile started!';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">Profile Completion</CardTitle>
            <CardDescription>{getCompletionMessage()}</CardDescription>
          </div>
          <Badge
            variant="outline"
            className={`text-lg px-3 py-1 ${getBadgeStyles()}`}
          >
            {completionScore}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={completionScore} className="h-3" />
          <p className="text-xs text-muted-foreground text-center">
            {completedItems.length} of {completionItems.length} sections completed
          </p>
        </div>

        {/* Incomplete Items */}
        {incompleteItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Complete your profile:</h4>
            <div className="space-y-2">
              {incompleteItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.tab || 'basic')}
                  className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors group text-left"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 p-2 bg-primary/10 rounded-full text-primary">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        +{item.points}%
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Completed Items */}
        {completedItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Completed:</h4>
            <div className="space-y-1">
              {completedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    +{item.points}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completion Incentive */}
        {completionScore < 100 && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium mb-1">Why complete your profile?</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Stand out to potential employers</li>
              <li>• Get better job recommendations</li>
              <li>• Increase your chances of being contacted</li>
            </ul>
          </div>
        )}

        {/* Success Message */}
        {completionScore === 100 && (
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm font-semibold">Profile Complete!</p>
            </div>
            <p className="text-xs text-green-600 dark:text-green-500">
              Your profile is fully optimized. Keep it updated to attract the best opportunities!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
