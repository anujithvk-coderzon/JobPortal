'use client';

import { Badge } from '@/components/ui/badge';
import { Award, TrendingUp } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CredibilityScore {
  level: string;
  score: number;
  nextLevel: string;
  nextLevelAt: number;
}

interface CredibilityBadgeProps {
  credibilityScore: CredibilityScore;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  showProgress?: boolean;
}

const credibilityConfig = {
  Newbie: {
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: '🌱',
    description: 'New to the community',
  },
  Contributor: {
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: '🥉',
    description: 'Making helpful contributions',
  },
  Trusted: {
    color: 'bg-slate-100 text-slate-800 border-slate-400',
    icon: '🥈',
    description: 'Trusted community member',
  },
  Expert: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-400',
    icon: '🥇',
    description: 'Expert contributor',
  },
  Authority: {
    color: 'bg-purple-100 text-purple-800 border-purple-400',
    icon: '👑',
    description: 'Community authority',
  },
};

export function CredibilityBadge({
  credibilityScore,
  size = 'sm',
  showTooltip = true,
  showProgress = false,
}: CredibilityBadgeProps) {
  const config = credibilityConfig[credibilityScore.level as keyof typeof credibilityConfig] || credibilityConfig.Newbie;

  const sizeClasses = {
    sm: 'text-xs h-5 px-2',
    md: 'text-sm h-6 px-3',
    lg: 'text-base h-7 px-4',
  };

  const iconSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const progress = credibilityScore.level === 'Authority'
    ? 100
    : ((credibilityScore.score / credibilityScore.nextLevelAt) * 100);

  const badgeContent = (
    <div className="flex items-center gap-1">
      <span className={iconSizeClasses[size]}>{config.icon}</span>
      <span className="font-semibold">{credibilityScore.level}</span>
      {showProgress && credibilityScore.level !== 'Authority' && (
        <span className="text-[10px] opacity-70">({credibilityScore.score}/{credibilityScore.nextLevelAt})</span>
      )}
    </div>
  );

  const badge = (
    <Badge
      variant="outline"
      className={`${config.color} border ${sizeClasses[size]} font-medium`}
    >
      {badgeContent}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <p className="font-semibold">{credibilityScore.level}</p>
            </div>
            <p className="text-xs text-muted-foreground">{config.description}</p>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Helpful Marks</span>
                <span className="font-semibold">{credibilityScore.score}</span>
              </div>
              {credibilityScore.level !== 'Authority' && (
                <>
                  <div className="w-full bg-muted rounded-full h-1.5 mb-1">
                    <div
                      className="bg-primary rounded-full h-1.5 transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>
                      {credibilityScore.nextLevelAt - credibilityScore.score} more to reach{' '}
                      <span className="font-semibold">{credibilityScore.nextLevel}</span>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact version for use in cards/lists
export function CredibilityBadgeCompact({
  credibilityScore,
}: {
  credibilityScore: CredibilityScore;
}) {
  const config = credibilityConfig[credibilityScore.level as keyof typeof credibilityConfig] || credibilityConfig.Newbie;

  // Show badge for all users, not just non-newbies
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${config.color} border cursor-help flex-shrink-0`}
            aria-label={`${credibilityScore.level} - ${credibilityScore.score} helpful marks`}
          >
            {config.icon}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{credibilityScore.level}</p>
              <span className="text-xs text-muted-foreground">({credibilityScore.score} helpful)</span>
            </div>
            <p className="text-xs text-muted-foreground">{config.description}</p>
            {credibilityScore.level !== 'Authority' && (
              <p className="text-xs text-primary">
                {credibilityScore.nextLevelAt - credibilityScore.score} more to reach {credibilityScore.nextLevel}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
