/**
 * Smart search query parser that extracts location, employment type, and other filters
 * from natural language search queries
 */

export interface ParsedSearchQuery {
  cleanedQuery: string; // Search query with extracted keywords removed
  location?: string;
  locationType?: 'REMOTE' | 'ONSITE' | 'HYBRID';
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';
  experienceLevel?: 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
  salaryMin?: number;
  salaryMax?: number;
}

// Location type keywords - Comprehensive list
const REMOTE_KEYWORDS = [
  'remote', 'work from home', 'wfh', 'telecommute', 'virtual',
  'work remotely', 'remote work', 'distributed', 'anywhere',
  'home based', 'home-based', 'remote first', 'remote-first',
  'telework', 'location independent', 'work from anywhere'
];

const HYBRID_KEYWORDS = [
  'hybrid', 'flexible location', 'part remote', 'semi remote',
  'semi-remote', 'flexible work', 'mixed location', 'hybrid work',
  'partly remote', 'hybrid model'
];

const ONSITE_KEYWORDS = [
  'onsite', 'on-site', 'office', 'in-office', 'on site',
  'office based', 'office-based', 'in person', 'in-person',
  'physical location', 'on location', 'on-location'
];

// Employment type keywords - Comprehensive list
const FULL_TIME_KEYWORDS = [
  'full time', 'full-time', 'fulltime', 'permanent',
  'ft', 'full-time permanent', 'permanent position',
  'regular employment', 'regular position', 'salaried'
];

const PART_TIME_KEYWORDS = [
  'part time', 'part-time', 'parttime', 'pt',
  'half time', 'half-time', 'hourly', 'flexible hours',
  'part time hours', 'reduced hours'
];

const CONTRACT_KEYWORDS = [
  'contract', 'contractor', 'contractual', 'c2c',
  'contract to hire', 'contract-to-hire', 'temporary',
  'temp', 'project based', 'project-based', 'fixed term',
  'fixed-term', 'consulting', 'consultant'
];

const INTERNSHIP_KEYWORDS = [
  'intern', 'internship', 'trainee', 'apprentice',
  'apprenticeship', 'student', 'co-op', 'coop',
  'graduate program', 'graduate scheme', 'learning opportunity'
];

const FREELANCE_KEYWORDS = [
  'freelance', 'freelancer', 'gig', 'independent',
  'self employed', 'self-employed', '1099',
  'per project', 'on demand', 'on-demand'
];

// Experience level keywords - Comprehensive list
const ENTRY_KEYWORDS = [
  'entry level', 'entry-level', 'junior', 'fresher', 'graduate',
  'jr', 'beginner', 'trainee', 'associate', 'entry',
  '0-2 years', '0-1 years', '1-2 years', 'recent graduate',
  'new grad', 'college graduate', 'early career'
];

const MID_KEYWORDS = [
  'mid level', 'mid-level', 'intermediate', 'experienced',
  'mid', 'middle', '2-5 years', '3-5 years', '3-7 years',
  'professional', 'mid-career', 'seasoned'
];

const SENIOR_KEYWORDS = [
  'senior', 'sr', 'lead', 'principal', 'staff',
  'expert', 'advanced', '5+ years', '7+ years', '10+ years',
  'senior level', 'senior-level', 'leadership', 'architect',
  'distinguished', 'veteran', 'highly experienced'
];

// Location prepositions and connectors
const LOCATION_PREPOSITIONS = [
  'in', 'at', 'near', 'around', 'from', 'based in',
  'located in', 'location', 'city'
];

/**
 * Parse a search query and extract filters
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
  if (!query || query.trim() === '') {
    return { cleanedQuery: '' };
  }

  let cleanedQuery = query.toLowerCase().trim();
  const result: ParsedSearchQuery = { cleanedQuery: query.trim() };

  // Extract location type (remote, hybrid, onsite)
  const locationTypeResult = extractLocationType(cleanedQuery);
  if (locationTypeResult.found) {
    result.locationType = locationTypeResult.type;
    cleanedQuery = locationTypeResult.cleanedQuery;
  }

  // Extract employment type
  const employmentTypeResult = extractEmploymentType(cleanedQuery);
  if (employmentTypeResult.found) {
    result.employmentType = employmentTypeResult.type;
    cleanedQuery = employmentTypeResult.cleanedQuery;
  }

  // Extract experience level
  const experienceLevelResult = extractExperienceLevel(cleanedQuery);
  if (experienceLevelResult.found) {
    result.experienceLevel = experienceLevelResult.type;
    cleanedQuery = experienceLevelResult.cleanedQuery;
  }

  // Extract location from query (e.g., "developer in Kochi", "jobs in Kerala")
  const locationResult = extractLocation(cleanedQuery);
  if (locationResult.found) {
    result.location = locationResult.location;
    cleanedQuery = locationResult.cleanedQuery;
  }

  // Extract salary from query (e.g., "jobs with salary greater than 35000", "above 50k")
  const salaryResult = extractSalary(cleanedQuery);
  if (salaryResult.found) {
    if (salaryResult.min !== undefined) result.salaryMin = salaryResult.min;
    if (salaryResult.max !== undefined) result.salaryMax = salaryResult.max;
    cleanedQuery = salaryResult.cleanedQuery;
  }

  // Clean up extra spaces and common filler words
  result.cleanedQuery = cleanedQuery
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/\b(job|jobs|position|positions|opening|openings|role|roles|with|salary)\b/gi, '') // Remove job-related filler words
    .replace(/\s+/g, ' ')
    .trim();

  return result;
}

/**
 * Extract location type (remote, hybrid, onsite) from query
 */
function extractLocationType(query: string): {
  found: boolean;
  type?: 'REMOTE' | 'HYBRID' | 'ONSITE';
  cleanedQuery: string;
} {
  let cleanedQuery = query;
  let foundType: 'REMOTE' | 'HYBRID' | 'ONSITE' | undefined;

  // Check for remote keywords (highest priority)
  for (const keyword of REMOTE_KEYWORDS) {
    const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'gi');
    if (regex.test(cleanedQuery)) {
      foundType = 'REMOTE';
      cleanedQuery = cleanedQuery.replace(regex, '').trim();
      break;
    }
  }

  // Check for hybrid keywords
  if (!foundType) {
    for (const keyword of HYBRID_KEYWORDS) {
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'gi');
      if (regex.test(cleanedQuery)) {
        foundType = 'HYBRID';
        cleanedQuery = cleanedQuery.replace(regex, '').trim();
        break;
      }
    }
  }

  // Check for onsite keywords
  if (!foundType) {
    for (const keyword of ONSITE_KEYWORDS) {
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'gi');
      if (regex.test(cleanedQuery)) {
        foundType = 'ONSITE';
        cleanedQuery = cleanedQuery.replace(regex, '').trim();
        break;
      }
    }
  }

  return {
    found: !!foundType,
    type: foundType,
    cleanedQuery,
  };
}

/**
 * Extract employment type from query
 */
function extractEmploymentType(query: string): {
  found: boolean;
  type?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';
  cleanedQuery: string;
} {
  let cleanedQuery = query;
  let foundType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE' | undefined;

  // Check for full-time
  for (const keyword of FULL_TIME_KEYWORDS) {
    const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'gi');
    if (regex.test(cleanedQuery)) {
      foundType = 'FULL_TIME';
      cleanedQuery = cleanedQuery.replace(regex, '').trim();
      break;
    }
  }

  // Check for part-time
  if (!foundType) {
    for (const keyword of PART_TIME_KEYWORDS) {
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'gi');
      if (regex.test(cleanedQuery)) {
        foundType = 'PART_TIME';
        cleanedQuery = cleanedQuery.replace(regex, '').trim();
        break;
      }
    }
  }

  // Check for contract
  if (!foundType) {
    for (const keyword of CONTRACT_KEYWORDS) {
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'gi');
      if (regex.test(cleanedQuery)) {
        foundType = 'CONTRACT';
        cleanedQuery = cleanedQuery.replace(regex, '').trim();
        break;
      }
    }
  }

  // Check for internship
  if (!foundType) {
    for (const keyword of INTERNSHIP_KEYWORDS) {
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'gi');
      if (regex.test(cleanedQuery)) {
        foundType = 'INTERNSHIP';
        cleanedQuery = cleanedQuery.replace(regex, '').trim();
        break;
      }
    }
  }

  // Check for freelance
  if (!foundType) {
    for (const keyword of FREELANCE_KEYWORDS) {
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'gi');
      if (regex.test(cleanedQuery)) {
        foundType = 'FREELANCE';
        cleanedQuery = cleanedQuery.replace(regex, '').trim();
        break;
      }
    }
  }

  return {
    found: !!foundType,
    type: foundType,
    cleanedQuery,
  };
}

/**
 * Extract experience level from query
 */
function extractExperienceLevel(query: string): {
  found: boolean;
  type?: 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
  cleanedQuery: string;
} {
  let cleanedQuery = query;
  let foundType: 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE' | undefined;

  // Check for senior keywords
  for (const keyword of SENIOR_KEYWORDS) {
    const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'gi');
    if (regex.test(cleanedQuery)) {
      foundType = 'SENIOR';
      cleanedQuery = cleanedQuery.replace(regex, '').trim();
      break;
    }
  }

  // Check for mid-level keywords
  if (!foundType) {
    for (const keyword of MID_KEYWORDS) {
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'gi');
      if (regex.test(cleanedQuery)) {
        foundType = 'MID';
        cleanedQuery = cleanedQuery.replace(regex, '').trim();
        break;
      }
    }
  }

  // Check for entry-level keywords
  if (!foundType) {
    for (const keyword of ENTRY_KEYWORDS) {
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'gi');
      if (regex.test(cleanedQuery)) {
        foundType = 'ENTRY';
        cleanedQuery = cleanedQuery.replace(regex, '').trim();
        break;
      }
    }
  }

  return {
    found: !!foundType,
    type: foundType,
    cleanedQuery,
  };
}

/**
 * Extract location from query (e.g., "developer in Kochi", "jobs in Kerala")
 */
function extractLocation(query: string): {
  found: boolean;
  location?: string;
  cleanedQuery: string;
} {
  let cleanedQuery = query;
  let foundLocation: string | undefined;

  // Pattern: "in [location]", "at [location]", "near [location]", etc.
  // Look for preposition followed by 1-3 words (location name)
  for (const prep of LOCATION_PREPOSITIONS) {
    // Match pattern: preposition + 1-3 capitalized or lowercase words
    const pattern = new RegExp(
      `\\b${prep}\\s+([A-Z][a-z]+(?:\\s+[A-Z]?[a-z]+){0,2})\\b`,
      'g'
    );
    const match = pattern.exec(query);

    if (match && match[1]) {
      foundLocation = match[1].trim();
      // Remove the entire phrase "in Kerala", "at Kochi", etc.
      cleanedQuery = cleanedQuery.replace(match[0], '').trim();
      break;
    }
  }

  // Also try lowercase locations (common city/state names)
  if (!foundLocation) {
    for (const prep of LOCATION_PREPOSITIONS) {
      const pattern = new RegExp(
        `\\b${prep}\\s+([a-z]+(?:\\s+[a-z]+){0,2})\\b`,
        'gi'
      );
      const match = pattern.exec(query);

      if (match && match[1]) {
        const potentialLocation = match[1].trim();
        // Only accept if it's at least 3 characters (avoid words like "in it", "at me")
        if (potentialLocation.length >= 3) {
          foundLocation = potentialLocation;
          cleanedQuery = cleanedQuery.replace(match[0], '').trim();
          break;
        }
      }
    }
  }

  return {
    found: !!foundLocation,
    location: foundLocation,
    cleanedQuery,
  };
}

/**
 * Extract salary range from query
 * Examples:
 *   - "jobs with salary greater than 35000"
 *   - "above 50k"
 *   - "50k-100k"
 *   - "minimum 40000"
 *   - "between 30000 and 60000"
 */
function extractSalary(query: string): {
  found: boolean;
  min?: number;
  max?: number;
  cleanedQuery: string;
} {
  let cleanedQuery = query;
  let salaryMin: number | undefined;
  let salaryMax: number | undefined;

  // Pattern 1: "greater than X", "above X", "minimum X", "at least X", etc.
  // Supports: 50k, $50k, ₹50000, 5lpa, etc.
  const greaterThanPattern = /\b(greater\s+than|above|minimum|min|at\s+least|more\s+than|over|starting\s+at|starting\s+from|from|\>|\+)\s+([$₹]?\d+(?:k|lpa|l)?)\b/gi;
  let match = greaterThanPattern.exec(cleanedQuery);
  if (match) {
    salaryMin = parseAmount(match[2]);
    cleanedQuery = cleanedQuery.replace(match[0], '').trim();
  }

  // Pattern 2: "less than X", "below X", "maximum X", "up to X", etc.
  const lessThanPattern = /\b(less\s+than|below|maximum|max|up\s+to|under|not\s+more\s+than|\<)\s+([$₹]?\d+(?:k|lpa|l)?)\b/gi;
  match = lessThanPattern.exec(cleanedQuery);
  if (match) {
    salaryMax = parseAmount(match[2]);
    cleanedQuery = cleanedQuery.replace(match[0], '').trim();
  }

  // Pattern 3: "between X and Y"
  const betweenPattern = /\b(between)\s+([$₹]?\d+(?:k|lpa|l)?)\s+(and|to|-)\s+([$₹]?\d+(?:k|lpa|l)?)\b/gi;
  match = betweenPattern.exec(cleanedQuery);
  if (match) {
    salaryMin = parseAmount(match[2]);
    salaryMax = parseAmount(match[4]);
    cleanedQuery = cleanedQuery.replace(match[0], '').trim();
  }

  // Pattern 4: "X-Y" or "X to Y"
  if (!salaryMin && !salaryMax) {
    const rangePattern = /\b([$₹]?\d+(?:k|lpa|l)?)\s*(-|to)\s*([$₹]?\d+(?:k|lpa|l)?)\b/gi;
    match = rangePattern.exec(cleanedQuery);
    if (match) {
      salaryMin = parseAmount(match[1]);
      salaryMax = parseAmount(match[3]);
      cleanedQuery = cleanedQuery.replace(match[0], '').trim();
    }
  }

  // Pattern 5: "with salary X" or "salary X" (exact amount - treat as minimum)
  // This handles cases like "developer job with salary 45000"
  if (!salaryMin && !salaryMax) {
    const exactSalaryPattern = /\b(with\s+)?salary\s+([$₹]?\d+(?:k|lpa|l)?)\b/gi;
    match = exactSalaryPattern.exec(cleanedQuery);
    if (match) {
      salaryMin = parseAmount(match[2]);
      cleanedQuery = cleanedQuery.replace(match[0], '').trim();
    }
  }

  // Pattern 6: Standalone number after removing other keywords
  // Only if we still haven't found a salary and there's a large number (>= 10000)
  if (!salaryMin && !salaryMax) {
    const standaloneNumberPattern = /\b(\d{5,})\b/g;
    match = standaloneNumberPattern.exec(cleanedQuery);
    if (match) {
      const amount = parseInt(match[1]);
      // Only treat as salary if it's a reasonable salary amount (10k+)
      if (amount >= 10000) {
        salaryMin = amount;
        cleanedQuery = cleanedQuery.replace(match[0], '').trim();
      }
    }
  }

  return {
    found: salaryMin !== undefined || salaryMax !== undefined,
    min: salaryMin,
    max: salaryMax,
    cleanedQuery,
  };
}

/**
 * Parse salary amount (handles various formats)
 * Supports:
 *  - 'k' suffix for thousands: 50k = 50,000
 *  - 'lpa' or 'l' for lakhs per annum: 5lpa = 500,000
 *  - Currency symbols: $50k, ₹50000
 */
function parseAmount(amount: string): number {
  const cleaned = amount.toLowerCase().trim()
    .replace(/[$₹,]/g, ''); // Remove currency symbols and commas

  // Handle LPA (Lakhs Per Annum) - common in India
  if (cleaned.includes('lpa') || cleaned.includes('l')) {
    const value = parseFloat(cleaned.replace(/[lpa]/g, ''));
    return Math.round(value * 100000); // 1 lakh = 100,000
  }

  // Handle 'k' suffix for thousands
  if (cleaned.endsWith('k')) {
    return parseInt(cleaned.slice(0, -1)) * 1000;
  }

  // Plain number
  return parseInt(cleaned);
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
