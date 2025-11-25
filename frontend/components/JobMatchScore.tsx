'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import {
  CheckCircle2,
  XCircle,
  Award,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';

interface MatchScore {
  overall: number;
  skillsMatch: number;
  experienceMatch: number;
  educationMatch: number;
  breakdown: {
    matchedSkills: string[];
    missingSkills: string[];
    experienceYears: number;
    experienceLevelMatch: boolean;
    hasRelevantEducation: boolean;
  };
}

interface JobMatchScoreProps {
  jobId: string;
  applicantId?: string; // Optional: if provided, calculates match for this user instead of logged-in user
  variant?: 'full' | 'compact' | 'badge';
}

export function JobMatchScore({ jobId, applicantId, variant = 'compact' }: JobMatchScoreProps) {
  const [matchScore, setMatchScore] = useState<MatchScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchMatchScore();
  }, [jobId, applicantId]);

  const fetchMatchScore = async () => {
    try {
      setLoading(true);
      setError(false);
      const url = applicantId
        ? `/jobs/${jobId}/match?userId=${applicantId}`
        : `/jobs/${jobId}/match`;
      const response = await api.get(url);
      setMatchScore(response.data);
    } catch (err) {
      console.error('Error fetching match score:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const getMatchLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Low Match';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-blue-600';
    if (score >= 40) return 'bg-yellow-600';
    return 'bg-orange-600';
  };

  if (loading) {
    if (variant === 'badge') {
      return (
        <Badge variant="outline" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-xs">Loading...</span>
        </Badge>
      );
    }
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Calculating match...</span>
      </div>
    );
  }

  if (error || !matchScore) {
    return null;
  }

  // Badge variant - minimal display with detailed hover
  if (variant === 'badge') {
    return (
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <Badge
            variant="outline"
            className={`gap-1 cursor-help ${getMatchColor(matchScore.overall)}`}
          >
            <TrendingUp className="h-3 w-3" />
            <span className="font-semibold">{matchScore.overall}%</span>
            <span className="hidden sm:inline text-xs">Match</span>
          </Badge>
        </HoverCardTrigger>
        <HoverCardContent className="w-80" align="end">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="font-semibold">Match Analysis</span>
              </div>
              <Badge className={getMatchColor(matchScore.overall)}>
                {matchScore.overall}%
              </Badge>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Award className="h-3.5 w-3.5" />
                  <span>Skills</span>
                </div>
                <span className="text-sm font-medium">{matchScore.skillsMatch}%</span>
              </div>
              <Progress
                value={matchScore.skillsMatch}
                className="h-1.5"
                indicatorClassName={getProgressColor(matchScore.skillsMatch)}
              />
              {matchScore.breakdown.matchedSkills.length > 0 && (
                <div className="flex items-start gap-1.5 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {matchScore.breakdown.matchedSkills.slice(0, 5).map((skill, idx) => (
                      <span key={idx} className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                        {skill}
                      </span>
                    ))}
                    {matchScore.breakdown.matchedSkills.length > 5 && (
                      <span className="text-muted-foreground">
                        +{matchScore.breakdown.matchedSkills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              {matchScore.breakdown.missingSkills.length > 0 && (
                <div className="flex items-start gap-1.5 text-xs">
                  <XCircle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    <span className="text-muted-foreground">Missing:</span>
                    {matchScore.breakdown.missingSkills.slice(0, 5).map((skill, idx) => (
                      <span key={idx} className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                        {skill}
                      </span>
                    ))}
                    {matchScore.breakdown.missingSkills.length > 5 && (
                      <span className="text-muted-foreground">
                        +{matchScore.breakdown.missingSkills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Experience</span>
                </div>
                <span className="text-sm font-medium">{matchScore.experienceMatch}%</span>
              </div>
              <Progress
                value={matchScore.experienceMatch}
                className="h-1.5"
                indicatorClassName={getProgressColor(matchScore.experienceMatch)}
              />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {matchScore.breakdown.experienceLevelMatch ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                ) : (
                  <XCircle className="h-3 w-3 text-orange-500" />
                )}
                <span>{matchScore.breakdown.experienceYears} years of experience</span>
              </div>
            </div>

            {/* Education */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>Education</span>
                </div>
                <span className="text-sm font-medium">{matchScore.educationMatch}%</span>
              </div>
              <Progress
                value={matchScore.educationMatch}
                className="h-1.5"
                indicatorClassName={getProgressColor(matchScore.educationMatch)}
              />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {matchScore.breakdown.hasRelevantEducation ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                ) : (
                  <XCircle className="h-3 w-3 text-orange-500" />
                )}
                <span>
                  {matchScore.breakdown.hasRelevantEducation
                    ? 'Relevant education background'
                    : 'Education background available'}
                </span>
              </div>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  // Compact variant - single line with progress
  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className={`h-4 w-4 ${getMatchColor(matchScore.overall).split(' ')[0]}`} />
            <span className="text-sm font-medium">
              {matchScore.overall}% Match
            </span>
            <Badge variant="outline" className="text-xs">
              {getMatchLabel(matchScore.overall)}
            </Badge>
          </div>
        </div>
        <Progress
          value={matchScore.overall}
          className="h-2"
          indicatorClassName={getProgressColor(matchScore.overall)}
        />
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Award className="h-3 w-3" />
            <span>Skills: {matchScore.skillsMatch}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            <span>Exp: {matchScore.experienceMatch}%</span>
          </div>
          <div className="flex items-center gap-1">
            <GraduationCap className="h-3 w-3" />
            <span>Edu: {matchScore.educationMatch}%</span>
          </div>
        </div>
      </div>
    );
  }

  // Full variant - detailed card
  return (
    <Card className={`border ${getMatchColor(matchScore.overall)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle className="text-lg">Job Match Score</CardTitle>
          </div>
          <Badge className={`text-lg font-bold ${getMatchColor(matchScore.overall)}`}>
            {matchScore.overall}%
          </Badge>
        </div>
        <CardDescription>{getMatchLabel(matchScore.overall)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Overall Match</span>
            <span>{matchScore.overall}%</span>
          </div>
          <Progress
            value={matchScore.overall}
            className="h-3"
            indicatorClassName={getProgressColor(matchScore.overall)}
          />
        </div>

        {/* Skills Match */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span className="font-medium text-sm">Skills</span>
            </div>
            <span className="text-sm">{matchScore.skillsMatch}%</span>
          </div>
          <Progress
            value={matchScore.skillsMatch}
            className="h-2"
            indicatorClassName={getProgressColor(matchScore.skillsMatch)}
          />
          {matchScore.breakdown.matchedSkills.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {matchScore.breakdown.matchedSkills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          {matchScore.breakdown.missingSkills.length > 0 && (
            <div className="mt-1 space-y-1">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <XCircle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs">Missing:</span>
                  {matchScore.breakdown.missingSkills.map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Experience Match */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="font-medium text-sm">Experience</span>
            </div>
            <span className="text-sm">{matchScore.experienceMatch}%</span>
          </div>
          <Progress
            value={matchScore.experienceMatch}
            className="h-2"
            indicatorClassName={getProgressColor(matchScore.experienceMatch)}
          />
          <div className="mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {matchScore.breakdown.experienceLevelMatch ? (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              ) : (
                <XCircle className="h-3 w-3 text-orange-500" />
              )}
              <span>
                {matchScore.breakdown.experienceYears} years of experience
              </span>
            </div>
          </div>
        </div>

        {/* Education Match */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="font-medium text-sm">Education</span>
            </div>
            <span className="text-sm">{matchScore.educationMatch}%</span>
          </div>
          <Progress
            value={matchScore.educationMatch}
            className="h-2"
            indicatorClassName={getProgressColor(matchScore.educationMatch)}
          />
          <div className="mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {matchScore.breakdown.hasRelevantEducation ? (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              ) : (
                <XCircle className="h-3 w-3 text-orange-500" />
              )}
              <span>
                {matchScore.breakdown.hasRelevantEducation
                  ? 'Has relevant education'
                  : 'Education background available'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
