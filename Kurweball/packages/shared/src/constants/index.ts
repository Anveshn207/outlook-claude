export const CANDIDATE_SOURCES = ['REFERRAL', 'LINKEDIN', 'JOBBOARD', 'DIRECT', 'OTHER'] as const;
export const CANDIDATE_STATUSES = ['ACTIVE', 'PASSIVE', 'DND', 'PLACED'] as const;
export const JOB_TYPES = ['FULLTIME', 'CONTRACT', 'C2H'] as const;
export const JOB_STATUSES = ['OPEN', 'CLOSED', 'ON_HOLD', 'FILLED'] as const;
export const JOB_PRIORITIES = ['HOT', 'NORMAL', 'LOW'] as const;
export const SUBMISSION_STATUSES = ['SUBMITTED', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'PLACED', 'REJECTED', 'WITHDRAWN'] as const;
export const ACTIVITY_TYPES = ['NOTE', 'CALL', 'EMAIL', 'MEETING', 'STATUS_CHANGE', 'SUBMISSION'] as const;
export const CUSTOM_FIELD_TYPES = ['TEXT', 'NUMBER', 'DATE', 'SELECT', 'MULTI_SELECT', 'CHECKBOX', 'URL', 'EMAIL', 'PHONE', 'CURRENCY'] as const;
export const USER_ROLES = ['ADMIN', 'RECRUITER', 'MANAGER', 'VIEWER'] as const;

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export const DEFAULT_PIPELINE_STAGES = [
  { name: 'New', order: 0, color: '#6366f1' },
  { name: 'Screening', order: 1, color: '#8b5cf6' },
  { name: 'Submitted', order: 2, color: '#3b82f6' },
  { name: 'Interview', order: 3, color: '#f59e0b' },
  { name: 'Offered', order: 4, color: '#10b981' },
  { name: 'Placed', order: 5, color: '#22c55e', isTerminal: true },
  { name: 'Rejected', order: 6, color: '#ef4444', isTerminal: true },
] as const;
