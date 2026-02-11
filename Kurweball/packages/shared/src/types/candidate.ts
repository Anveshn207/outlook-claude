export type CandidateSource = 'REFERRAL' | 'LINKEDIN' | 'JOBBOARD' | 'DIRECT' | 'OTHER';
export type CandidateStatus = 'ACTIVE' | 'PASSIVE' | 'DND' | 'PLACED';
export type RateType = 'HOURLY' | 'ANNUAL';

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  source: CandidateSource;
  status: CandidateStatus;
  title: string | null;
  currentEmployer: string | null;
  location: string | null;
  visaStatus: string | null;
  linkedinUrl: string | null;
  rate: number | null;
  rateType: RateType | null;
  availability: string | null;
  skills: string[];
  tags: string[];
  customData: Record<string, unknown>;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCandidateRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  source?: CandidateSource;
  status?: CandidateStatus;
  title?: string;
  currentEmployer?: string;
  location?: string;
  visaStatus?: string;
  linkedinUrl?: string;
  rate?: number;
  rateType?: RateType;
  availability?: string;
  skills?: string[];
  tags?: string[];
  customData?: Record<string, unknown>;
}

export interface UpdateCandidateRequest extends Partial<CreateCandidateRequest> {}
