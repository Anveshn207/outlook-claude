import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ImportEntityType,
  ColumnMapping,
  FieldDefinition,
  CANDIDATE_FIELDS,
  JOB_FIELDS,
  CLIENT_FIELDS,
} from './types/import.types';

// Synonyms for each target field (all pre-normalized: lowercase, no spaces/underscores/hyphens)
const FIELD_ALIASES: Record<string, string[]> = {
  // Candidate
  applicantId: ['applicantid', 'candidateid', 'refid', 'referenceid', 'externalid', 'id'],
  fullName: ['fullname', 'applicantfullname', 'candidatename', 'candidatefullname', 'applicantname', 'name'],
  firstName: ['first', 'fname', 'givenname', 'namefirst'],
  lastName: ['last', 'lname', 'surname', 'familyname', 'namelast'],
  email: ['emailaddress', 'emailid', 'mail', 'emailaddr'],
  phone: ['mobile', 'cell', 'telephone', 'contactnumber', 'mobilenumber', 'cellphone', 'phoneno', 'tel'],
  title: ['position', 'designation', 'role', 'jobrole', 'jobtitle', 'currenttitle', 'currentrole'],
  currentEmployer: ['company', 'employer', 'organization', 'org', 'currentcompany', 'companyname', 'firm'],
  location: ['city', 'address', 'place', 'area', 'currentlocation', 'loc'],
  state: ['province', 'region'],
  visaStatus: ['visa', 'workauthorization', 'workauth', 'immigrationstatus', 'workstatus', 'authorization'],
  linkedinUrl: ['linkedin', 'linkedinlink', 'linkedinprofile', 'linkedinprofileurl', 'liurl', 'liprofile'],
  rate: ['salary', 'hourlyrate', 'compensation', 'expectedrate', 'currentrate', 'ctc'],
  availability: ['available', 'startdate', 'noticeperiod', 'availablefrom', 'joiningdate', 'notice'],
  dateOfBirth: ['dob', 'birthdate', 'birthday', 'dateofbirth', 'birth'],
  resumeAvailable: ['resumeavailable', 'resume', 'hasresume', 'cvavailable', 'cv'],
  skills: ['skillset', 'technicalskills', 'technologies', 'techstack', 'competencies', 'expertise', 'primaryskills', 'technology'],
  tags: ['labels', 'categories', 'keywords'],
  source: ['leadsource', 'referralsource', 'channel', 'origin', 'candidatesource'],
  status: ['applicantstatus', 'candidatestatus', 'currentstatus'],

  // Job
  clientName: ['client', 'customer', 'account', 'clientcompany', 'vendorclient'],
  description: ['jobdescription', 'jd', 'details', 'summary', 'overview', 'desc'],
  requirements: ['qualifications', 'prereqs', 'prerequisites', 'requiredqualifications', 'mandatoryskills'],
  positionsCount: ['openings', 'headcount', 'numberofpositions', 'vacancies', 'positions', 'noofpositions'],
  billRate: ['billingrate', 'clientrate', 'billrate'],
  payRate: ['pay', 'payrate', 'candidaterate'],
  skillsRequired: ['requiredskills', 'techstack', 'technologies', 'mandatoryskills', 'primaryskills'],
  jobType: ['employmenttype', 'contracttype', 'worktype', 'type', 'engagementtype'],
  priority: ['urgency', 'importance'],

  // Client
  name: ['companyname', 'clientname', 'organization', 'company', 'firm', 'orgname'],
  industry: ['sector', 'vertical', 'domain', 'businesstype', 'industrysector'],
  website: ['url', 'web', 'site', 'homepage', 'webpage', 'companyurl', 'websiteurl'],
  address: ['street', 'streetaddress', 'addr', 'officeaddress'],
  country: ['nation'],
  notes: ['comments', 'remarks', 'additionalinfo', 'info', 'memo'],
};

// Columns that should be auto-skipped (metadata from source systems)
const AUTO_SKIP_COLUMNS = ['createdby', 'createdon', 'createddate', 'modifiedby', 'modifiedon', 'modifieddate', 'updatedby', 'updatedon', 'updateddate', 'lastupdated'];

// Entity type restrictions: which entities each data pattern applies to.
// 'all' means the pattern is universal across candidate, job, and client.
type EntityScope = 'all' | ImportEntityType[];

interface DataPattern {
  field: string;
  test: (val: string) => boolean;
  entities: EntityScope;
  // Higher priority patterns are checked first and win ties
  priority: number;
}

// Common visa keywords regex (compiled once)
const VISA_REGEX = /\b(h[- ]?1[b]?|h[- ]?4|l[- ]?1|l[- ]?2|tn|f[- ]?1|opt|cpt|ead|gc|green\s*card|citizen|us\s*citizen|permanent\s*resident|work\s*permit)\b/i;

// US state abbreviations
const US_STATE_ABBRS = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
]);

const US_STATE_NAMES = new Set([
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado',
  'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho',
  'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana',
  'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota',
  'mississippi', 'missouri', 'montana', 'nebraska', 'nevada',
  'new hampshire', 'new jersey', 'new mexico', 'new york',
  'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon',
  'pennsylvania', 'rhode island', 'south carolina', 'south dakota',
  'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington',
  'west virginia', 'wisconsin', 'wyoming', 'district of columbia',
]);

// Common tech skill keywords for detecting skills columns
const TECH_KEYWORDS = new Set([
  'java', 'python', 'javascript', 'typescript', 'react', 'angular', 'vue',
  'node', 'nodejs', 'express', 'spring', 'django', 'flask', 'ruby', 'rails',
  'go', 'golang', 'rust', 'c++', 'c#', '.net', 'dotnet', 'php', 'laravel',
  'swift', 'kotlin', 'scala', 'html', 'css', 'sass', 'less', 'tailwind',
  'bootstrap', 'jquery', 'sql', 'mysql', 'postgresql', 'postgres', 'mongodb',
  'redis', 'elasticsearch', 'kafka', 'rabbitmq', 'docker', 'kubernetes',
  'k8s', 'aws', 'azure', 'gcp', 'terraform', 'ansible', 'jenkins',
  'git', 'github', 'gitlab', 'ci/cd', 'devops', 'agile', 'scrum',
  'rest', 'graphql', 'microservices', 'api', 'oauth', 'jwt',
  'linux', 'unix', 'bash', 'powershell', 'windows', 'macos',
  'figma', 'sketch', 'adobe', 'photoshop', 'illustrator',
  'tableau', 'power bi', 'excel', 'sap', 'salesforce', 'servicenow',
  'hadoop', 'spark', 'airflow', 'snowflake', 'databricks',
  'machine learning', 'ml', 'ai', 'deep learning', 'nlp', 'tensorflow',
  'pytorch', 'pandas', 'numpy', 'scikit-learn', 'r', 'matlab',
  'selenium', 'cypress', 'jest', 'mocha', 'junit', 'testng',
  'oracle', 'db2', 'sybase', 'teradata', 'informatica',
  'jira', 'confluence', 'trello', 'asana', 'monday',
  'nextjs', 'nuxt', 'svelte', 'ember', 'backbone',
  'redux', 'mobx', 'zustand', 'webpack', 'vite', 'rollup',
  'nginx', 'apache', 'caddy', 'iis',
]);

// Company suffix patterns
const COMPANY_SUFFIXES_REGEX = /\b(inc\.?|llc\.?|corp\.?|ltd\.?|co\.?|plc\.?|gmbh|technologies|solutions|services|systems|consulting|group|partners|associates|enterprises|labs|software|global|international|digital)\b/i;

// Source keywords
const SOURCE_KEYWORDS = new Set([
  'linkedin', 'referral', 'jobboard', 'indeed', 'direct', 'website',
  'career', 'careers', 'monster', 'dice', 'glassdoor', 'ziprecruiter',
  'naukri', 'internal', 'agency', 'vendor', 'portal', 'careerbuilder',
  'hired', 'angellist', 'stackoverflow', 'github', 'recruiter',
  'employee referral', 'walk-in', 'walkin', 'campus', 'job fair',
  'social media', 'facebook', 'twitter', 'other',
]);

// Status keywords for candidate/job
const STATUS_KEYWORDS = new Set([
  'active', 'passive', 'dnd', 'placed', 'available', 'open', 'closed',
  'on hold', 'onhold', 'on_hold', 'filled', 'inactive', 'prospect',
  'submitted', 'rejected', 'shortlisted', 'hired', 'withdrawn',
  'interviewing', 'offered', 'joined', 'archived', 'hot', 'normal', 'low',
]);

// Date format detection regex
const DATE_REGEX = /^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|\d{1,2}[\s\-](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\-]\d{2,4}|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\-]\d{1,2}[\s,\-]+\d{2,4})$/i;

// Boolean value detection
const BOOLEAN_REGEX = /^(yes|no|true|false|y|n|1|0)$/i;

// Applicant ID pattern: alphanumeric codes, often with prefix + numbers
const APPLICANT_ID_REGEX = /^[A-Z]{1,5}[\-_]?\d{2,10}$/i;

// Data patterns for detecting field types from sample values
const DATA_PATTERNS: DataPattern[] = [
  // --- High-specificity patterns first (unique data signatures) ---

  // Email: very distinctive pattern
  {
    field: 'email',
    test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    entities: 'all',
    priority: 100,
  },

  // LinkedIn URL: very distinctive
  {
    field: 'linkedinUrl',
    test: (v) => /linkedin\.com\/(in|pub|profile)\//i.test(v),
    entities: ['candidate'],
    priority: 99,
  },

  // Website/URL: generic HTTP(S) links (but NOT linkedin — that's caught above)
  {
    field: 'website',
    test: (v) => {
      const trimmed = v.trim();
      if (/linkedin\.com/i.test(trimmed)) return false;
      return /^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed) || /\.(com|org|net|io|co|us|uk)\s*$/i.test(trimmed);
    },
    entities: 'all',
    priority: 98,
  },

  // Visa status: contains visa-related keywords
  {
    field: 'visaStatus',
    test: (v) => VISA_REGEX.test(v),
    entities: ['candidate'],
    priority: 95,
  },

  // Skills: comma or semicolon separated values with tech keywords
  {
    field: 'skills',
    test: (v) => {
      const trimmed = v.trim();
      // Must contain a separator (comma or semicolon) suggesting a list
      if (!/[,;]/.test(trimmed)) return false;
      const parts = trimmed.split(/[,;]/).map((p) => p.trim().toLowerCase()).filter(Boolean);
      if (parts.length < 2) return false;
      // At least one part should be a recognized tech keyword
      const techMatches = parts.filter((p) => {
        // Check exact match or if the part contains a tech keyword
        for (const kw of TECH_KEYWORDS) {
          if (p === kw || p.includes(kw)) return true;
        }
        return false;
      });
      return techMatches.length >= 1;
    },
    entities: ['candidate'],
    priority: 93,
  },

  // Skills required (job variant — same logic, different target field)
  {
    field: 'skillsRequired',
    test: (v) => {
      const trimmed = v.trim();
      if (!/[,;]/.test(trimmed)) return false;
      const parts = trimmed.split(/[,;]/).map((p) => p.trim().toLowerCase()).filter(Boolean);
      if (parts.length < 2) return false;
      const techMatches = parts.filter((p) => {
        for (const kw of TECH_KEYWORDS) {
          if (p === kw || p.includes(kw)) return true;
        }
        return false;
      });
      return techMatches.length >= 1;
    },
    entities: ['job'],
    priority: 93,
  },

  // Boolean-like: Yes/No, True/False, Y/N
  {
    field: 'resumeAvailable',
    test: (v) => BOOLEAN_REGEX.test(v.trim()),
    entities: ['candidate'],
    priority: 90,
  },

  // Applicant ID: alphanumeric codes like APP-001, C12345
  {
    field: 'applicantId',
    test: (v) => {
      const trimmed = v.trim();
      // Must look like an ID: alphanumeric with optional dash/underscore prefix
      return APPLICANT_ID_REGEX.test(trimmed) || /^\d{4,10}$/.test(trimmed);
    },
    entities: ['candidate'],
    priority: 88,
  },

  // Phone: digits with common phone formatting
  {
    field: 'phone',
    test: (v) => {
      const trimmed = v.trim();
      // Must have at least 7 digit characters
      const digitCount = (trimmed.match(/\d/g) || []).length;
      if (digitCount < 7 || digitCount > 15) return false;
      // Must be mostly digits, spaces, parens, plus, hyphens, dots
      return /^[\d\s()+\-\.]+$/.test(trimmed);
    },
    entities: 'all',
    priority: 85,
  },

  // Date: various date formats
  {
    field: 'dateOfBirth',
    test: (v) => DATE_REGEX.test(v.trim()),
    entities: ['candidate'],
    priority: 82,
  },

  // Rate/salary: numbers with $ or rate keywords or large numbers
  {
    field: 'rate',
    test: (v) => {
      const trimmed = v.trim();
      // Contains $ sign with a number
      if (/\$\s*[\d,]+/.test(trimmed)) return true;
      // Contains "per hour" or "per year" or "/hr" or "/yr"
      if (/per\s*(hour|year|annum|month)|\/\s*(hr|yr|hour|year)/i.test(trimmed)) return true;
      // Pure number greater than 20 (likely a rate)
      const num = parseFloat(trimmed.replace(/[$,]/g, ''));
      if (!isNaN(num) && num > 20 && /^[\d$,.\s]+$/.test(trimmed)) return true;
      return false;
    },
    entities: ['candidate'],
    priority: 80,
  },

  // Bill Rate (job)
  {
    field: 'billRate',
    test: (v) => {
      const trimmed = v.trim();
      if (/\$\s*[\d,]+/.test(trimmed)) return true;
      if (/per\s*(hour|year|annum|month)|\/\s*(hr|yr|hour|year)/i.test(trimmed)) return true;
      const num = parseFloat(trimmed.replace(/[$,]/g, ''));
      if (!isNaN(num) && num > 20 && /^[\d$,.\s]+$/.test(trimmed)) return true;
      return false;
    },
    entities: ['job'],
    priority: 80,
  },

  // US State: two-letter abbreviations or full state names
  {
    field: 'state',
    test: (v) => {
      const trimmed = v.trim();
      if (trimmed.length === 2 && US_STATE_ABBRS.has(trimmed.toUpperCase())) return true;
      if (US_STATE_NAMES.has(trimmed.toLowerCase())) return true;
      return false;
    },
    entities: 'all',
    priority: 78,
  },

  // Source keywords
  {
    field: 'source',
    test: (v) => {
      const lower = v.trim().toLowerCase();
      if (SOURCE_KEYWORDS.has(lower)) return true;
      // Check partial matches for multi-word sources
      for (const kw of SOURCE_KEYWORDS) {
        if (lower.includes(kw)) return true;
      }
      return false;
    },
    entities: ['candidate'],
    priority: 75,
  },

  // Status keywords
  {
    field: 'status',
    test: (v) => {
      const lower = v.trim().toLowerCase();
      return STATUS_KEYWORDS.has(lower);
    },
    entities: 'all',
    priority: 74,
  },

  // Current employer / company name: ends with company suffixes
  {
    field: 'currentEmployer',
    test: (v) => {
      const trimmed = v.trim();
      if (trimmed.length < 2 || trimmed.length > 100) return false;
      // Must contain company suffix
      return COMPANY_SUFFIXES_REGEX.test(trimmed);
    },
    entities: ['candidate'],
    priority: 70,
  },

  // Client name (job context) — same company detection
  {
    field: 'clientName',
    test: (v) => {
      const trimmed = v.trim();
      if (trimmed.length < 2 || trimmed.length > 100) return false;
      return COMPANY_SUFFIXES_REGEX.test(trimmed);
    },
    entities: ['job'],
    priority: 70,
  },

  // Company name (client context) — same company detection
  {
    field: 'name',
    test: (v) => {
      const trimmed = v.trim();
      if (trimmed.length < 2 || trimmed.length > 100) return false;
      return COMPANY_SUFFIXES_REGEX.test(trimmed);
    },
    entities: ['client'],
    priority: 70,
  },

  // Full name: two+ words, mostly alpha, each word starts with uppercase
  {
    field: 'fullName',
    test: (v) => {
      const trimmed = v.trim();
      // Must have at least 2 words
      const words = trimmed.split(/\s+/);
      if (words.length < 2 || words.length > 5) return false;
      // No @, no digits (rules out emails and IDs)
      if (/@/.test(trimmed) || /\d/.test(trimmed)) return false;
      // No http (rules out URLs)
      if (/https?:/i.test(trimmed)) return false;
      // Each word should start with an uppercase letter and be mostly alpha
      return words.every((w) => /^[A-Z][a-zA-Z'.'-]{0,30}$/.test(w));
    },
    entities: ['candidate'],
    priority: 68,
  },

  // First name: single word, alpha, capitalized, short
  {
    field: 'firstName',
    test: (v) => {
      const trimmed = v.trim();
      // Single word only
      if (/\s/.test(trimmed)) return false;
      // No special chars except apostrophe/hyphen
      if (/@/.test(trimmed) || /\d/.test(trimmed)) return false;
      // Starts with uppercase, 2-20 chars
      return /^[A-Z][a-zA-Z'\-]{1,19}$/.test(trimmed);
    },
    entities: ['candidate'],
    priority: 65,
  },

  // Last name: single word, alpha, capitalized, short (same pattern as first name)
  {
    field: 'lastName',
    test: (v) => {
      const trimmed = v.trim();
      if (/\s/.test(trimmed)) return false;
      if (/@/.test(trimmed) || /\d/.test(trimmed)) return false;
      return /^[A-Z][a-zA-Z'\-]{1,25}$/.test(trimmed);
    },
    entities: ['candidate'],
    priority: 64,
  },

  // Location: city-like value (alpha + spaces + commas, no @ or http)
  {
    field: 'location',
    test: (v) => {
      const trimmed = v.trim();
      if (trimmed.length < 3 || trimmed.length > 80) return false;
      // No email chars, no URLs
      if (/@/.test(trimmed) || /https?:/i.test(trimmed)) return false;
      // Should contain at least one comma or be a known city-like format
      // "City, State" or "City, ST" pattern
      if (/^[A-Za-z\s]+,\s*[A-Za-z\s]+$/.test(trimmed)) return true;
      // "City, State ZIP" pattern
      if (/^[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}/.test(trimmed)) return true;
      return false;
    },
    entities: 'all',
    priority: 60,
  },

  // Job type keywords
  {
    field: 'jobType',
    test: (v) => {
      const lower = v.trim().toLowerCase();
      return /^(full\s*time|part\s*time|contract|c2h|contract\s*to\s*hire|freelance|intern|temporary|temp|permanent|perm|w2|1099|corp\s*to\s*corp|c2c)$/i.test(lower);
    },
    entities: ['job'],
    priority: 73,
  },

  // Priority keywords (job)
  {
    field: 'priority',
    test: (v) => {
      const lower = v.trim().toLowerCase();
      return /^(hot|normal|low|high|medium|critical|urgent)$/i.test(lower);
    },
    entities: ['job'],
    priority: 72,
  },

  // Positions count (small integer, typically 1-50)
  {
    field: 'positionsCount',
    test: (v) => {
      const trimmed = v.trim();
      const num = parseInt(trimmed, 10);
      return !isNaN(num) && num >= 1 && num <= 100 && String(num) === trimmed;
    },
    entities: ['job'],
    priority: 55,
  },

  // Industry (client)
  {
    field: 'industry',
    test: (v) => {
      const lower = v.trim().toLowerCase();
      const industries = [
        'technology', 'healthcare', 'finance', 'banking', 'insurance',
        'retail', 'manufacturing', 'education', 'government', 'telecom',
        'telecommunications', 'media', 'energy', 'automotive', 'pharma',
        'pharmaceutical', 'real estate', 'construction', 'hospitality',
        'logistics', 'transportation', 'agriculture', 'defense', 'aerospace',
        'it', 'information technology', 'biotech', 'biotechnology',
        'consulting', 'legal', 'non-profit', 'nonprofit', 'e-commerce',
        'ecommerce', 'fintech', 'edtech', 'healthtech', 'staffing',
        'oil & gas', 'oil and gas', 'mining', 'utilities', 'fmcg',
      ];
      return industries.some((ind) => lower === ind || lower.includes(ind));
    },
    entities: ['client'],
    priority: 70,
  },

  // Country
  {
    field: 'country',
    test: (v) => {
      const lower = v.trim().toLowerCase();
      const countries = [
        'usa', 'us', 'united states', 'united states of america',
        'india', 'uk', 'united kingdom', 'canada', 'australia',
        'germany', 'france', 'japan', 'china', 'brazil', 'mexico',
        'singapore', 'ireland', 'netherlands', 'switzerland', 'sweden',
        'israel', 'south korea', 'new zealand', 'uae', 'dubai',
        'qatar', 'saudi arabia', 'philippines', 'malaysia', 'indonesia',
        'thailand', 'vietnam', 'poland', 'czech republic', 'romania',
        'spain', 'italy', 'portugal', 'belgium', 'denmark', 'norway',
        'finland', 'austria', 'argentina', 'chile', 'colombia',
        'peru', 'south africa', 'nigeria', 'kenya', 'egypt',
        'pakistan', 'bangladesh', 'sri lanka', 'nepal',
      ];
      return countries.some((c) => lower === c);
    },
    entities: ['client'],
    priority: 65,
  },
];

// Sort DATA_PATTERNS by priority descending so higher-priority patterns are checked first
DATA_PATTERNS.sort((a, b) => b.priority - a.priority);

@Injectable()
export class AiMappingService {
  private readonly logger = new Logger(AiMappingService.name);
  private anthropicClient: any = null;

  constructor(private readonly configService: ConfigService) {
    this.initAnthropicClient();
  }

  private async initAnthropicClient(): Promise<void> {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) return;

    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      this.anthropicClient = new Anthropic({ apiKey });
      this.logger.log('Anthropic client initialized for AI-powered column mapping');
    } catch {
      this.logger.warn('Failed to initialize Anthropic client, falling back to heuristic matching');
    }
  }

  async analyzeMappings(
    entityType: ImportEntityType,
    columns: string[],
    sampleRows: Record<string, string>[],
  ): Promise<ColumnMapping[]> {
    const fields = this.getFieldDefinitions(entityType);

    if (this.anthropicClient) {
      try {
        return await this.analyzeWithClaude(fields, columns, sampleRows);
      } catch (error) {
        this.logger.warn(`AI mapping failed, falling back to heuristic: ${error.message}`);
      }
    }

    return this.analyzeWithHeuristic(entityType, fields, columns, sampleRows);
  }

  private getFieldDefinitions(entityType: ImportEntityType): FieldDefinition[] {
    switch (entityType) {
      case 'candidate':
        return CANDIDATE_FIELDS;
      case 'job':
        return JOB_FIELDS;
      case 'client':
        return CLIENT_FIELDS;
    }
  }

  /**
   * Analyze data values for a single column against all data patterns.
   * Returns the best matching field and a data-derived confidence score.
   */
  private analyzeColumnData(
    entityType: ImportEntityType,
    column: string,
    sampleRows: Record<string, string>[],
    fieldKeys: Set<string>,
    usedFields: Set<string>,
  ): { field: string; dataScore: number } | null {
    const samples = sampleRows
      .slice(0, 5)
      .map((r) => r[column] ?? '')
      .filter((v) => v.trim().length > 0);

    if (samples.length === 0) return null;

    let bestField: string | null = null;
    let bestDataScore = 0;
    let bestMatchRate = 0;

    for (const pattern of DATA_PATTERNS) {
      // Skip patterns not relevant to this entity type
      if (pattern.entities !== 'all') {
        if (!pattern.entities.includes(entityType)) continue;
      }

      // Skip if this field doesn't exist in the target schema or is already used
      if (!fieldKeys.has(pattern.field) || usedFields.has(pattern.field)) continue;

      const matchCount = samples.filter((s) => {
        try {
          return pattern.test(s);
        } catch {
          return false;
        }
      }).length;

      const matchRate = matchCount / samples.length;

      // Require at least 60% match rate
      if (matchRate < 0.6) continue;

      // Score: base 0.75 for 60%+, up to higher for 80%+
      let score: number;
      if (matchRate >= 0.8) {
        score = 0.80; // Strong data match — will be boosted if name also matches
      } else {
        score = 0.75; // Moderate data match
      }

      // Prefer higher match rates, and higher priority patterns on ties
      if (
        score > bestDataScore ||
        (score === bestDataScore && matchRate > bestMatchRate) ||
        (score === bestDataScore && matchRate === bestMatchRate && pattern.priority > 0)
      ) {
        bestDataScore = score;
        bestField = pattern.field;
        bestMatchRate = matchRate;
      }
    }

    if (bestField) {
      return { field: bestField, dataScore: bestDataScore };
    }

    return null;
  }

  /**
   * Compute the name-based score for a column against a specific field.
   */
  private computeNameScore(normalized: string, field: FieldDefinition): number {
    const normalizedKey = this.normalize(field.key);
    const normalizedLabel = this.normalize(field.label);

    // 1. Exact match on key or label (highest confidence)
    if (normalized === normalizedKey || normalized === normalizedLabel) {
      return 1.0;
    }

    // 2. Alias/synonym match
    if (this.matchesAlias(normalized, field.key)) {
      return 0.9;
    }

    // 3. Substring match (column contains field key/label or vice versa)
    if (normalizedKey.length >= 3 && (normalizedKey.includes(normalized) || normalized.includes(normalizedKey))) {
      return 0.8;
    }
    if (normalizedLabel.length >= 3 && (normalizedLabel.includes(normalized) || normalized.includes(normalizedLabel))) {
      return 0.75;
    }

    return 0;
  }

  /**
   * Check if the column name has ANY partial relevance to a field (used for boosting).
   * More lenient than computeNameScore — returns true if there's even a weak name signal.
   */
  private hasNameRelevance(normalized: string, fieldKey: string): boolean {
    const normalizedKey = this.normalize(fieldKey);

    // Direct name match or alias match already covered by computeNameScore
    if (normalized === normalizedKey) return true;
    if (this.matchesAlias(normalized, fieldKey)) return true;

    // Partial containment
    if (normalizedKey.length >= 3 && (normalizedKey.includes(normalized) || normalized.includes(normalizedKey))) return true;

    // Check if any alias partially matches
    const aliases = FIELD_ALIASES[fieldKey];
    if (aliases) {
      for (const alias of aliases) {
        if (alias.length >= 3 && (alias.includes(normalized) || normalized.includes(alias))) return true;
      }
    }

    // Check some common contextual keywords that hint at the field
    const fieldHints: Record<string, string[]> = {
      email: ['email', 'mail', 'eml'],
      phone: ['phone', 'mobile', 'cell', 'tel', 'contact', 'number'],
      linkedinUrl: ['linkedin', 'li', 'social', 'profile'],
      website: ['web', 'url', 'site', 'http', 'www', 'link'],
      visaStatus: ['visa', 'work', 'auth', 'immigration', 'status'],
      rate: ['rate', 'salary', 'comp', 'pay', 'ctc', 'wage', 'bill'],
      billRate: ['bill', 'rate', 'client'],
      payRate: ['pay', 'rate', 'candidate'],
      skills: ['skill', 'tech', 'stack', 'competenc', 'expert'],
      skillsRequired: ['skill', 'tech', 'stack', 'required', 'mandatory'],
      state: ['state', 'province', 'region', 'st'],
      source: ['source', 'origin', 'channel', 'lead', 'referr'],
      status: ['status', 'stage', 'state'],
      fullName: ['name', 'full', 'candidate', 'applicant'],
      firstName: ['first', 'fname', 'given'],
      lastName: ['last', 'lname', 'surname', 'family'],
      location: ['location', 'city', 'place', 'area', 'loc', 'address'],
      currentEmployer: ['employer', 'company', 'org', 'firm', 'current'],
      clientName: ['client', 'customer', 'account', 'company'],
      name: ['name', 'company', 'client', 'org', 'firm'],
      dateOfBirth: ['date', 'dob', 'birth', 'born'],
      resumeAvailable: ['resume', 'cv', 'available'],
      applicantId: ['id', 'ref', 'applicant', 'candidate', 'code', 'number'],
      industry: ['industry', 'sector', 'vertical', 'domain'],
      country: ['country', 'nation'],
      jobType: ['type', 'employment', 'contract', 'work'],
      priority: ['priority', 'urgency', 'importance'],
      positionsCount: ['position', 'opening', 'headcount', 'count', 'vacancy'],
      tags: ['tag', 'label', 'category', 'keyword'],
      availability: ['avail', 'start', 'notice', 'joining', 'date'],
    };

    const hints = fieldHints[fieldKey];
    if (hints) {
      for (const hint of hints) {
        if (normalized.includes(hint)) return true;
      }
    }

    return false;
  }

  private analyzeWithHeuristic(
    entityType: ImportEntityType,
    fields: FieldDefinition[],
    columns: string[],
    sampleRows: Record<string, string>[],
  ): ColumnMapping[] {
    const fieldKeys = new Set(fields.map((f) => f.key));
    const usedFields = new Set<string>();

    // Phase 1: Compute all scores for every column-field pair
    type ScoredMapping = {
      sourceColumn: string;
      targetField: string;
      confidence: number;
      nameScore: number;
      dataScore: number;
    };

    const allScored: ScoredMapping[] = [];

    for (const column of columns) {
      const normalized = this.normalize(column);

      // Auto-skip metadata columns (Created By, Created On, etc.)
      if (AUTO_SKIP_COLUMNS.includes(normalized)) {
        allScored.push({
          sourceColumn: column,
          targetField: 'SKIP',
          confidence: 0,
          nameScore: 0,
          dataScore: 0,
        });
        continue;
      }

      // Compute best name score across all fields
      let bestNameField = 'SKIP';
      let bestNameScore = 0;

      for (const field of fields) {
        const nameScore = this.computeNameScore(normalized, field);
        if (nameScore > bestNameScore) {
          bestNameScore = nameScore;
          bestNameField = field.key;
        }
      }

      // Compute data score from sample values
      const dataResult = this.analyzeColumnData(entityType, column, sampleRows, fieldKeys, new Set());

      // Combine name and data scores
      let finalField: string;
      let finalScore: number;

      if (bestNameScore >= 0.5 && dataResult) {
        // Both name and data have opinions
        if (bestNameField === dataResult.field) {
          // They agree! Boost the confidence
          const baseScore = Math.max(bestNameScore, dataResult.dataScore);
          // If data is strong (0.80) and name agrees, boost to 0.85
          if (dataResult.dataScore >= 0.80 && bestNameScore >= 0.75) {
            finalScore = 0.95;
          } else if (dataResult.dataScore >= 0.80) {
            finalScore = Math.max(baseScore, 0.85);
          } else {
            finalScore = Math.max(baseScore, 0.80);
          }
          finalField = bestNameField;
        } else {
          // They disagree — go with the higher scorer
          if (bestNameScore >= dataResult.dataScore) {
            finalField = bestNameField;
            finalScore = bestNameScore;
          } else {
            finalField = dataResult.field;
            finalScore = dataResult.dataScore;
          }
        }
      } else if (bestNameScore >= 0.5) {
        // Only name match
        finalField = bestNameField;
        finalScore = bestNameScore;
      } else if (dataResult) {
        // Only data match — check if column name has ANY relevance for a boost
        if (this.hasNameRelevance(normalized, dataResult.field) && dataResult.dataScore >= 0.80) {
          finalScore = 0.85;
        } else {
          finalScore = dataResult.dataScore;
        }
        finalField = dataResult.field;
      } else {
        // No match at all
        finalField = 'SKIP';
        finalScore = 0;
      }

      allScored.push({
        sourceColumn: column,
        targetField: finalScore >= 0.5 ? finalField : 'SKIP',
        confidence: finalScore >= 0.5 ? finalScore : 0,
        nameScore: bestNameScore,
        dataScore: dataResult?.dataScore ?? 0,
      });
    }

    // Phase 2: Resolve conflicts — if two columns want the same field, higher scorer wins
    const fieldToColumns: Map<string, ScoredMapping[]> = new Map();

    for (const scored of allScored) {
      if (scored.targetField === 'SKIP') continue;
      const existing = fieldToColumns.get(scored.targetField) || [];
      existing.push(scored);
      fieldToColumns.set(scored.targetField, existing);
    }

    for (const [field, candidates] of fieldToColumns) {
      if (candidates.length <= 1) continue;

      // Sort by confidence descending; on tie, prefer higher nameScore
      candidates.sort((a, b) => {
        if (b.confidence !== a.confidence) return b.confidence - a.confidence;
        return b.nameScore - a.nameScore;
      });

      // Winner keeps the field; losers need to be re-evaluated
      for (let i = 1; i < candidates.length; i++) {
        const loser = candidates[i];

        // Try to find the next best field for this loser via data analysis
        // (excluding all fields already won by someone)
        const alreadyUsed = new Set<string>();
        for (const [f, cs] of fieldToColumns) {
          if (cs.length > 0 && cs[0] !== loser) {
            alreadyUsed.add(f);
          }
        }

        // Also re-check name matching for an alternate field
        const normalized = this.normalize(loser.sourceColumn);
        let altField = 'SKIP';
        let altScore = 0;

        for (const fieldDef of fields) {
          if (alreadyUsed.has(fieldDef.key) || fieldDef.key === field) continue;
          const ns = this.computeNameScore(normalized, fieldDef);
          if (ns > altScore) {
            altScore = ns;
            altField = fieldDef.key;
          }
        }

        if (altScore >= 0.5) {
          loser.targetField = altField;
          loser.confidence = altScore;
        } else {
          loser.targetField = 'SKIP';
          loser.confidence = 0;
        }
      }
    }

    // Phase 3: Handle firstName/lastName disambiguation when both data-detected as same pattern
    // If we have two columns that look like single names, and one was mapped to firstName
    // but the other is SKIP, try mapping it to lastName (or vice versa)
    this.disambiguateFirstLastName(allScored, fields, columns, sampleRows);

    // Build final result
    return allScored.map((s) => ({
      sourceColumn: s.sourceColumn,
      targetField: s.targetField,
      confidence: s.confidence,
    }));
  }

  /**
   * Special handling: If firstName is mapped but lastName is not (or vice versa),
   * look for another column with similar single-name-like data and assign it.
   */
  private disambiguateFirstLastName(
    scored: {
      sourceColumn: string;
      targetField: string;
      confidence: number;
      nameScore: number;
      dataScore: number;
    }[],
    fields: FieldDefinition[],
    columns: string[],
    sampleRows: Record<string, string>[],
  ): void {
    const fieldKeys = new Set(fields.map((f) => f.key));
    if (!fieldKeys.has('firstName') || !fieldKeys.has('lastName')) return;

    const hasFirst = scored.some((s) => s.targetField === 'firstName');
    const hasLast = scored.some((s) => s.targetField === 'lastName');
    const hasFullName = scored.some((s) => s.targetField === 'fullName');

    // If we already have both, or we have fullName, no need to disambiguate
    if ((hasFirst && hasLast) || hasFullName) return;

    const missing = !hasFirst ? 'firstName' : !hasLast ? 'lastName' : null;
    if (!missing) return;

    // Look through unmapped (SKIP) columns for one that looks like a single name
    const singleNameTest = (v: string): boolean => {
      const trimmed = v.trim();
      if (/\s/.test(trimmed)) return false;
      if (/@/.test(trimmed) || /\d/.test(trimmed)) return false;
      return /^[A-Z][a-zA-Z'\-]{1,25}$/.test(trimmed);
    };

    for (const entry of scored) {
      if (entry.targetField !== 'SKIP') continue;

      const samples = sampleRows
        .slice(0, 5)
        .map((r) => r[entry.sourceColumn] ?? '')
        .filter((v) => v.trim().length > 0);

      if (samples.length === 0) continue;

      const matchCount = samples.filter((s) => singleNameTest(s)).length;
      const matchRate = matchCount / samples.length;

      if (matchRate >= 0.6) {
        // Check column name for hints
        const normalized = this.normalize(entry.sourceColumn);
        const nameHints = missing === 'firstName'
          ? ['first', 'fname', 'given']
          : ['last', 'lname', 'surname', 'family'];

        const nameRelevant = nameHints.some((h) => normalized.includes(h));

        entry.targetField = missing;
        entry.confidence = nameRelevant ? 0.85 : 0.70;
        break; // Only assign the first matching unassigned column
      }
    }
  }

  /** Check if a normalized column name matches any known alias for the given field key */
  private matchesAlias(normalizedColumn: string, fieldKey: string): boolean {
    const aliases = FIELD_ALIASES[fieldKey];
    if (!aliases) return false;
    // Use exact match only — substring matching causes false positives
    // (e.g. "applicantfullname" contains "lname" -> wrongly matches lastName).
    // Substring matching for key/label is handled separately in the heuristic.
    return aliases.some((alias) => normalizedColumn === alias);
  }

  private async analyzeWithClaude(
    fields: FieldDefinition[],
    columns: string[],
    sampleRows: Record<string, string>[],
  ): Promise<ColumnMapping[]> {
    const fieldDescriptions = fields
      .map((f) => {
        let desc = `- "${f.key}" (label: "${f.label}", type: ${f.type}`;
        if (f.required) desc += ', required';
        if (f.enumValues) desc += `, values: [${f.enumValues.join(', ')}]`;
        desc += ')';
        return desc;
      })
      .join('\n');

    const sampleData = sampleRows
      .slice(0, 5)
      .map((row, i) => `Row ${i + 1}: ${JSON.stringify(row)}`)
      .join('\n');

    const validTargets = [...fields.map((f) => f.key), 'SKIP'];

    const prompt = `You are a data mapping assistant. Map source columns from an uploaded file to the target entity fields.

Target fields:
${fieldDescriptions}

Source columns: ${JSON.stringify(columns)}

Sample data:
${sampleData}

For each source column, determine the best matching target field. Use "SKIP" if no field matches well.

Respond with ONLY a JSON array of objects, each with:
- "sourceColumn": the original column name
- "targetField": the matching field key or "SKIP"
- "confidence": a number between 0 and 1

JSON response:`;

    const response = await this.anthropicClient.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('');

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in AI response');
    }

    const parsed: ColumnMapping[] = JSON.parse(jsonMatch[0]);

    return parsed.map((mapping) => ({
      sourceColumn: mapping.sourceColumn,
      targetField: validTargets.includes(mapping.targetField) ? mapping.targetField : 'SKIP',
      confidence: Math.max(0, Math.min(1, Number(mapping.confidence) || 0)),
    }));
  }

  private normalize(value: string): string {
    return value.toLowerCase().replace(/[\s_\-]/g, '');
  }
}
