import { PrismaClient, ExperienceLevel } from '@prisma/client';

const prisma = new PrismaClient();

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

/**
 * Calculate job match score for a user
 */
export const calculateJobMatch = async (
  userId: string,
  jobId: string
): Promise<MatchScore> => {
  // Fetch user profile with all related data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          skills: true,
          experiences: true,
          education: true,
        },
      },
    },
  });

  // Fetch job details
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!user || !job) {
    throw new Error('User or Job not found');
  }

  // Calculate individual match scores
  const skillsMatch = calculateSkillsMatch(
    user.profile?.skills || [],
    job.requiredSkills
  );

  const experienceMatch = calculateExperienceMatch(
    user.profile?.experiences || [],
    job.experienceLevel
  );

  const educationMatch = calculateEducationMatch(
    user.profile?.education || [],
    job.requiredQualifications
  );

  // Calculate overall match (weighted average)
  const overall = Math.round(
    skillsMatch.score * 0.4 +
    experienceMatch.score * 0.3 +
    educationMatch.score * 0.3
  );

  return {
    overall,
    skillsMatch: skillsMatch.score,
    experienceMatch: experienceMatch.score,
    educationMatch: educationMatch.score,
    breakdown: {
      matchedSkills: skillsMatch.matched,
      missingSkills: skillsMatch.missing,
      experienceYears: experienceMatch.years,
      experienceLevelMatch: experienceMatch.levelMatch,
      hasRelevantEducation: educationMatch.hasRelevant,
    },
  };
};

/**
 * Calculate skills match score
 */
function calculateSkillsMatch(
  userSkills: Array<{ name: string; level?: string | null }>,
  requiredSkillsJson: string | null
): { score: number; matched: string[]; missing: string[] } {
  if (!requiredSkillsJson) {
    return { score: 100, matched: [], missing: [] };
  }

  let requiredSkills: string[] = [];
  try {
    requiredSkills = JSON.parse(requiredSkillsJson);
  } catch {
    return { score: 100, matched: [], missing: [] };
  }

  if (requiredSkills.length === 0) {
    return { score: 100, matched: [], missing: [] };
  }

  // Normalize skill names for comparison (lowercase, trim)
  const userSkillNames = userSkills.map(s => s.name.toLowerCase().trim());
  const requiredSkillsNormalized = requiredSkills.map(s => s.toLowerCase().trim());

  // Find matched and missing skills
  const matched: string[] = [];
  const missing: string[] = [];

  requiredSkillsNormalized.forEach((reqSkill, index) => {
    if (userSkillNames.some(userSkill =>
      userSkill.includes(reqSkill) || reqSkill.includes(userSkill)
    )) {
      matched.push(requiredSkills[index]);
    } else {
      missing.push(requiredSkills[index]);
    }
  });

  // Calculate score (percentage of matched skills)
  const score = Math.round((matched.length / requiredSkills.length) * 100);

  return { score, matched, missing };
}

/**
 * Calculate experience match score
 */
function calculateExperienceMatch(
  experiences: Array<{
    startDate: Date;
    endDate: Date | null;
    current: boolean
  }>,
  requiredLevel: ExperienceLevel
): { score: number; years: number; levelMatch: boolean } {
  // Calculate total years of experience
  const totalYears = experiences.reduce((total, exp) => {
    const startDate = new Date(exp.startDate);
    const endDate = exp.current ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date());
    const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return total + years;
  }, 0);

  // Map experience years to level
  let userLevel: ExperienceLevel;
  if (totalYears < 2) {
    userLevel = 'ENTRY';
  } else if (totalYears < 5) {
    userLevel = 'MID';
  } else if (totalYears < 10) {
    userLevel = 'SENIOR';
  } else {
    userLevel = 'EXECUTIVE';
  }

  // Define level hierarchy
  const levelHierarchy: Record<ExperienceLevel, number> = {
    'ENTRY': 1,
    'MID': 2,
    'SENIOR': 3,
    'EXECUTIVE': 4,
  };

  const userLevelValue = levelHierarchy[userLevel];
  const requiredLevelValue = levelHierarchy[requiredLevel];

  // Calculate score based on level match
  let score = 0;
  let levelMatch = false;

  if (userLevelValue === requiredLevelValue) {
    score = 100;
    levelMatch = true;
  } else if (userLevelValue === requiredLevelValue + 1) {
    // One level above required (slightly overqualified)
    score = 95;
  } else if (userLevelValue === requiredLevelValue - 1) {
    // One level below required
    score = 70;
  } else if (userLevelValue > requiredLevelValue) {
    // Overqualified
    score = 85;
  } else {
    // Underqualified
    score = 50;
  }

  // Bonus for having any experience
  if (experiences.length === 0) {
    score = requiredLevel === 'ENTRY' ? 60 : 30;
  }

  return { score, years: Math.round(totalYears * 10) / 10, levelMatch };
}

/**
 * Calculate education match score
 */
function calculateEducationMatch(
  education: Array<{ degree: string; fieldOfStudy: string }>,
  requiredQualificationsJson: string | null
): { score: number; hasRelevant: boolean } {
  if (!requiredQualificationsJson) {
    return { score: 100, hasRelevant: false };
  }

  let requiredQualifications: string[] = [];
  try {
    requiredQualifications = JSON.parse(requiredQualificationsJson);
  } catch {
    return { score: 100, hasRelevant: false };
  }

  if (requiredQualifications.length === 0 || education.length === 0) {
    return { score: education.length > 0 ? 80 : 60, hasRelevant: false };
  }

  // Check for relevant education
  const normalizedQualifications = requiredQualifications.map(q => q.toLowerCase());
  const normalizedEducation = education.map(e => ({
    degree: e.degree.toLowerCase(),
    field: e.fieldOfStudy.toLowerCase(),
  }));

  let hasRelevant = false;
  let score = 60; // Base score

  // Check if user has required degree or field
  for (const qual of normalizedQualifications) {
    for (const edu of normalizedEducation) {
      if (
        edu.degree.includes(qual) ||
        edu.field.includes(qual) ||
        qual.includes(edu.degree) ||
        qual.includes(edu.field)
      ) {
        hasRelevant = true;
        score = 100;
        break;
      }
    }
    if (hasRelevant) break;
  }

  // Bonus for having higher education even if not exact match
  if (!hasRelevant && education.length > 0) {
    const hasBachelor = normalizedEducation.some(e =>
      e.degree.includes('bachelor') || e.degree.includes('b.') || e.degree.includes('bs') || e.degree.includes('ba')
    );
    const hasMaster = normalizedEducation.some(e =>
      e.degree.includes('master') || e.degree.includes('m.') || e.degree.includes('ms') || e.degree.includes('ma')
    );
    const hasPhd = normalizedEducation.some(e =>
      e.degree.includes('phd') || e.degree.includes('doctorate')
    );

    if (hasPhd) score = 90;
    else if (hasMaster) score = 85;
    else if (hasBachelor) score = 75;
    else score = 70;
  }

  return { score, hasRelevant };
}

/**
 * Calculate match scores for multiple jobs
 */
export const calculateJobMatches = async (
  userId: string,
  jobIds: string[]
): Promise<Record<string, MatchScore>> => {
  const matches: Record<string, MatchScore> = {};

  for (const jobId of jobIds) {
    try {
      matches[jobId] = await calculateJobMatch(userId, jobId);
    } catch (error) {
      console.error(`Error calculating match for job ${jobId}:`, error);
      // Return a default low score for errors
      matches[jobId] = {
        overall: 0,
        skillsMatch: 0,
        experienceMatch: 0,
        educationMatch: 0,
        breakdown: {
          matchedSkills: [],
          missingSkills: [],
          experienceYears: 0,
          experienceLevelMatch: false,
          hasRelevantEducation: false,
        },
      };
    }
  }

  return matches;
};
