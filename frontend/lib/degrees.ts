// Comprehensive degree and field of study options for education forms

export const DEGREE_OPTIONS = [
  // Undergraduate - Engineering
  { value: 'B.Tech', label: 'B.Tech (Bachelor of Technology)', category: 'engineering' },
  { value: 'B.E.', label: 'B.E. (Bachelor of Engineering)', category: 'engineering' },

  // Undergraduate - Science
  { value: 'B.Sc', label: 'B.Sc (Bachelor of Science)', category: 'science' },
  { value: 'B.Sc (Hons)', label: 'B.Sc (Hons)', category: 'science' },

  // Undergraduate - Commerce
  { value: 'B.Com', label: 'B.Com (Bachelor of Commerce)', category: 'commerce' },
  { value: 'B.Com (Hons)', label: 'B.Com (Hons)', category: 'commerce' },

  // Undergraduate - Arts & Humanities
  { value: 'BA', label: 'BA (Bachelor of Arts)', category: 'arts' },
  { value: 'BA (Hons)', label: 'BA (Hons)', category: 'arts' },

  // Undergraduate - Computer Applications
  { value: 'BCA', label: 'BCA (Bachelor of Computer Applications)', category: 'computer' },

  // Undergraduate - Business
  { value: 'BBA', label: 'BBA (Bachelor of Business Administration)', category: 'business' },

  // Undergraduate - Other Professional
  { value: 'LLB', label: 'LLB (Bachelor of Laws)', category: 'law' },
  { value: 'MBBS', label: 'MBBS (Bachelor of Medicine, Bachelor of Surgery)', category: 'medical' },
  { value: 'BDS', label: 'BDS (Bachelor of Dental Surgery)', category: 'medical' },
  { value: 'B.Pharm', label: 'B.Pharm (Bachelor of Pharmacy)', category: 'pharmacy' },
  { value: 'B.Arch', label: 'B.Arch (Bachelor of Architecture)', category: 'architecture' },
  { value: 'BFA', label: 'BFA (Bachelor of Fine Arts)', category: 'arts' },

  // Postgraduate - Engineering
  { value: 'M.Tech', label: 'M.Tech (Master of Technology)', category: 'engineering' },
  { value: 'M.E.', label: 'M.E. (Master of Engineering)', category: 'engineering' },

  // Postgraduate - Science
  { value: 'M.Sc', label: 'M.Sc (Master of Science)', category: 'science' },

  // Postgraduate - Commerce
  { value: 'M.Com', label: 'M.Com (Master of Commerce)', category: 'commerce' },

  // Postgraduate - Arts & Humanities
  { value: 'MA', label: 'MA (Master of Arts)', category: 'arts' },

  // Postgraduate - Computer Applications
  { value: 'MCA', label: 'MCA (Master of Computer Applications)', category: 'computer' },

  // Postgraduate - Business
  { value: 'MBA', label: 'MBA (Master of Business Administration)', category: 'business' },
  { value: 'PGDM', label: 'PGDM (Post Graduate Diploma in Management)', category: 'business' },

  // Postgraduate - Other Professional
  { value: 'LLM', label: 'LLM (Master of Laws)', category: 'law' },
  { value: 'MD', label: 'MD (Doctor of Medicine)', category: 'medical' },
  { value: 'MS', label: 'MS (Master of Surgery)', category: 'medical' },
  { value: 'M.Pharm', label: 'M.Pharm (Master of Pharmacy)', category: 'pharmacy' },
  { value: 'M.Arch', label: 'M.Arch (Master of Architecture)', category: 'architecture' },

  // Doctorate
  { value: 'Ph.D.', label: 'Ph.D. (Doctor of Philosophy)', category: 'doctorate' },
  { value: 'D.Sc.', label: 'D.Sc. (Doctor of Science)', category: 'doctorate' },
  { value: 'DBA', label: 'DBA (Doctor of Business Administration)', category: 'doctorate' },

  // Diploma
  { value: 'Diploma', label: 'Diploma', category: 'diploma' },
  { value: 'Advanced Diploma', label: 'Advanced Diploma', category: 'diploma' },
  { value: 'Polytechnic Diploma', label: 'Polytechnic Diploma', category: 'diploma' },

  // International Degrees
  { value: 'Bachelor\'s Degree', label: 'Bachelor\'s Degree', category: 'international' },
  { value: 'Master\'s Degree', label: 'Master\'s Degree', category: 'international' },
  { value: 'Associate Degree', label: 'Associate Degree', category: 'international' },

  // Other
  { value: 'Other', label: 'Other (Specify)', category: 'other' },
];

export const FIELD_OF_STUDY_OPTIONS: { [key: string]: string[] } = {
  // Engineering & Technology
  engineering: [
    'Computer Science Engineering',
    'Information Technology',
    'Electronics and Communication Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Aerospace Engineering',
    'Automobile Engineering',
    'Biotechnology',
    'Instrumentation Engineering',
    'Production Engineering',
    'Industrial Engineering',
    'Petroleum Engineering',
    'Mining Engineering',
    'Metallurgical Engineering',
    'Agricultural Engineering',
    'Environmental Engineering',
    'Other Engineering',
  ],

  // Computer Applications
  computer: [
    'Computer Applications',
    'Computer Science',
    'Information Technology',
    'Software Engineering',
    'Data Science',
    'Artificial Intelligence',
    'Cyber Security',
    'Cloud Computing',
    'Other Computer Field',
  ],

  // Science
  science: [
    'Physics',
    'Chemistry',
    'Mathematics',
    'Biology',
    'Zoology',
    'Botany',
    'Microbiology',
    'Biochemistry',
    'Biotechnology',
    'Environmental Science',
    'Statistics',
    'Geology',
    'Astronomy',
    'Forensic Science',
    'Nutrition',
    'Other Science',
  ],

  // Commerce & Economics
  commerce: [
    'Accounting',
    'Finance',
    'Banking',
    'Taxation',
    'Business Economics',
    'International Business',
    'E-Commerce',
    'Insurance',
    'Investment Management',
    'Other Commerce',
  ],

  // Business & Management
  business: [
    'Finance',
    'Marketing',
    'Human Resources',
    'Operations Management',
    'Business Analytics',
    'International Business',
    'Entrepreneurship',
    'Supply Chain Management',
    'Information Systems',
    'Retail Management',
    'Healthcare Management',
    'Hospitality Management',
    'Banking & Finance',
    'Other Management',
  ],

  // Arts & Humanities
  arts: [
    'English Literature',
    'History',
    'Political Science',
    'Sociology',
    'Psychology',
    'Economics',
    'Philosophy',
    'Geography',
    'Journalism',
    'Mass Communication',
    'Film Studies',
    'Music',
    'Fine Arts',
    'Performing Arts',
    'Languages',
    'Anthropology',
    'Archaeology',
    'Other Arts/Humanities',
  ],

  // Law
  law: [
    'Corporate Law',
    'Criminal Law',
    'Constitutional Law',
    'International Law',
    'Intellectual Property Rights',
    'Tax Law',
    'Cyber Law',
    'Environmental Law',
    'Other Law',
  ],

  // Medical
  medical: [
    'General Medicine',
    'Surgery',
    'Pediatrics',
    'Orthopedics',
    'Cardiology',
    'Neurology',
    'Dermatology',
    'Radiology',
    'Anesthesiology',
    'Pathology',
    'Gynecology',
    'Psychiatry',
    'Ophthalmology',
    'ENT',
    'Dentistry',
    'Nursing',
    'Physiotherapy',
    'Other Medical',
  ],

  // Pharmacy
  pharmacy: [
    'Pharmaceutics',
    'Pharmacology',
    'Pharmaceutical Chemistry',
    'Pharmacy Practice',
    'Clinical Pharmacy',
    'Other Pharmacy',
  ],

  // Architecture
  architecture: [
    'Architecture',
    'Urban Planning',
    'Landscape Architecture',
    'Interior Design',
    'Sustainable Architecture',
    'Other Architecture',
  ],

  // Diploma
  diploma: [
    'Engineering',
    'Computer Science',
    'Mechanical',
    'Civil',
    'Electrical',
    'Electronics',
    'Hotel Management',
    'Fashion Design',
    'Other Diploma',
  ],

  // Doctorate
  doctorate: [
    'Computer Science',
    'Engineering',
    'Science',
    'Mathematics',
    'Management',
    'Economics',
    'Social Sciences',
    'Humanities',
    'Medicine',
    'Law',
    'Other Research',
  ],

  // International
  international: [
    'Business Administration',
    'Computer Science',
    'Engineering',
    'Liberal Arts',
    'Sciences',
    'Social Sciences',
    'Humanities',
    'Education',
    'Communications',
    'Other Field',
  ],

  // Other
  other: [
    'Please specify your field',
  ],
};

// Helper function to get field of study options based on degree
export function getFieldsOfStudy(degree: string): string[] {
  const degreeObj = DEGREE_OPTIONS.find(d => d.value === degree);
  if (!degreeObj) return [];

  return FIELD_OF_STUDY_OPTIONS[degreeObj.category] || [];
}
