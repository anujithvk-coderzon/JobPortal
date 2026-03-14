'use client';

import {
  CheckCircle2,
  Camera,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  User,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProfileCompletionProps {
  user: any;
  profile: any;
  onNavigate?: (tab: string) => void;
  className?: string;
}

interface CompletionItem {
  id: string;
  label: string;
  completed: boolean;
  points: number;
  icon: React.ReactNode;
  tab?: string;
}

export const ProfileCompletion = ({ user, profile, onNavigate, className = '' }: ProfileCompletionProps) => {
  const completionItems: CompletionItem[] = [
    { id: 'photo', label: 'Profile Photo', completed: !!user?.profilePhoto, points: 10, icon: <Camera className="h-3.5 w-3.5" />, tab: 'basic' },
    { id: 'bio', label: 'Bio', completed: !!profile?.bio, points: 10, icon: <User className="h-3.5 w-3.5" />, tab: 'basic' },
    { id: 'resume', label: 'Resume', completed: !!profile?.resume, points: 15, icon: <FileText className="h-3.5 w-3.5" />, tab: 'basic' },
    { id: 'skills', label: 'Skills', completed: profile?.skills?.length > 0, points: 15, icon: <Award className="h-3.5 w-3.5" />, tab: 'skills' },
    { id: 'experience', label: 'Experience', completed: profile?.experiences?.length > 0, points: 15, icon: <Briefcase className="h-3.5 w-3.5" />, tab: 'experience' },
    { id: 'education', label: 'Education', completed: profile?.education?.length > 0, points: 15, icon: <GraduationCap className="h-3.5 w-3.5" />, tab: 'education' },
  ];

  const completedItems = completionItems.filter((item) => item.completed);
  const incompleteItems = completionItems.filter((item) => !item.completed);
  const completionScore = profile?.completionScore || 20;

  const getColor = () => {
    if (completionScore >= 80) return 'text-emerald-600';
    if (completionScore >= 50) return 'text-amber-600';
    return 'text-red-500';
  };

  const getBarColor = () => {
    if (completionScore >= 80) return 'bg-emerald-500';
    if (completionScore >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Card className={className}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Profile Completion</h2>
          <span className={`text-lg font-semibold ${getColor()}`}>{completionScore}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-1.5 mb-1.5">
          <div className={`${getBarColor()} rounded-full h-1.5 transition-all`} style={{ width: `${completionScore}%` }} />
        </div>
        <p className="text-[11px] text-muted-foreground mb-4">
          {completedItems.length}/{completionItems.length} sections completed
        </p>

        {/* Incomplete Items */}
        {incompleteItems.length > 0 && (
          <div className="space-y-0.5 mb-3">
            <p className="text-[11px] font-medium text-muted-foreground mb-1.5">To do</p>
            {incompleteItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.tab || 'basic')}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-[13px] hover:bg-accent/60 transition-colors group"
              >
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
                  {item.icon}
                </div>
                <span className="flex-1 text-left">{item.label}</span>
                <Badge variant="outline" className="text-[10px] h-5 px-1.5">+{item.points}%</Badge>
                <ChevronRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
              </button>
            ))}
          </div>
        )}

        {/* Completed Items */}
        {completedItems.length > 0 && (
          <div className="space-y-0.5">
            <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Done</p>
            {completedItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2.5 px-2 py-1.5 text-[13px] text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Success */}
        {completionScore === 100 && (
          <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <p className="text-[12px] font-medium">Profile complete!</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProfileCompletion;
