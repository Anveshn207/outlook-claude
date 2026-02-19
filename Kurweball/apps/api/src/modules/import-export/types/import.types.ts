export type ImportEntityType = 'candidate' | 'job' | 'client';
export type ExportEntityType = 'candidate' | 'job' | 'client' | 'submission';
export type ExportFormat = 'csv' | 'xlsx' | 'docx';

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
}

export interface ParsedFileResult {
  fileId: string;
  columns: string[];
  sampleRows: Record<string, string>[];
  totalRows: number;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

export interface FieldDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'enum' | 'array' | 'date';
  required?: boolean;
  enumValues?: string[];
  virtual?: boolean; // Not a real DB column — transformed during import
}

export const CANDIDATE_FIELDS: FieldDefinition[] = [
  { key: 'applicantId', label: 'Applicant ID', type: 'string' },
  { key: 'fullName', label: 'Full Name', type: 'string', virtual: true },
  { key: 'firstName', label: 'First Name', type: 'string', required: true },
  { key: 'lastName', label: 'Last Name', type: 'string', required: true },
  { key: 'email', label: 'Email', type: 'string' },
  { key: 'phone', label: 'Phone', type: 'string' },
  { key: 'title', label: 'Job Title', type: 'string' },
  { key: 'currentEmployer', label: 'Current Employer', type: 'string' },
  { key: 'location', label: 'Location', type: 'string' },
  { key: 'state', label: 'State', type: 'string' },
  { key: 'visaStatus', label: 'Visa Status', type: 'string' },
  { key: 'linkedinUrl', label: 'LinkedIn URL', type: 'string' },
  { key: 'rate', label: 'Rate', type: 'number' },
  { key: 'availability', label: 'Availability', type: 'string' },
  { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
  { key: 'resumeAvailable', label: 'Resume Available', type: 'string' },
  { key: 'skills', label: 'Skills', type: 'array' },
  { key: 'tags', label: 'Tags', type: 'array' },
  {
    key: 'source',
    label: 'Source',
    type: 'enum',
    enumValues: ['REFERRAL', 'LINKEDIN', 'JOBBOARD', 'DIRECT', 'OTHER'],
  },
  {
    key: 'status',
    label: 'Status',
    type: 'enum',
    enumValues: ['ACTIVE', 'PASSIVE', 'DND', 'PLACED'],
  },
];

export const JOB_FIELDS: FieldDefinition[] = [
  { key: 'title', label: 'Job Title', type: 'string', required: true },
  { key: 'clientName', label: 'Client Name', type: 'string', required: true },
  { key: 'description', label: 'Description', type: 'string' },
  { key: 'requirements', label: 'Requirements', type: 'string' },
  { key: 'location', label: 'Location', type: 'string' },
  { key: 'positionsCount', label: 'Positions', type: 'number' },
  { key: 'billRate', label: 'Bill Rate', type: 'number' },
  { key: 'payRate', label: 'Pay Rate', type: 'number' },
  { key: 'skillsRequired', label: 'Required Skills', type: 'array' },
  {
    key: 'jobType',
    label: 'Job Type',
    type: 'enum',
    enumValues: ['FULLTIME', 'CONTRACT', 'C2H'],
  },
  {
    key: 'status',
    label: 'Status',
    type: 'enum',
    enumValues: ['OPEN', 'CLOSED', 'ON_HOLD', 'FILLED'],
  },
  {
    key: 'priority',
    label: 'Priority',
    type: 'enum',
    enumValues: ['HOT', 'NORMAL', 'LOW'],
  },
];

export const CLIENT_FIELDS: FieldDefinition[] = [
  { key: 'name', label: 'Company Name', type: 'string', required: true },
  { key: 'industry', label: 'Industry', type: 'string' },
  { key: 'website', label: 'Website', type: 'string' },
  { key: 'address', label: 'Address', type: 'string' },
  { key: 'city', label: 'City', type: 'string' },
  { key: 'state', label: 'State', type: 'string' },
  { key: 'country', label: 'Country', type: 'string' },
  { key: 'notes', label: 'Notes', type: 'string' },
  {
    key: 'status',
    label: 'Status',
    type: 'enum',
    enumValues: ['ACTIVE', 'INACTIVE', 'PROSPECT'],
  },
];
