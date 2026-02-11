export type SubmissionStatus = 'SUBMITTED' | 'SHORTLISTED' | 'INTERVIEW' | 'OFFERED' | 'PLACED' | 'REJECTED' | 'WITHDRAWN';

export interface Submission {
  id: string;
  candidateId: string;
  jobId: string;
  submittedById: string;
  status: SubmissionStatus;
  submittedAt: string;
  payRate: number | null;
  billRate: number | null;
  notes: string | null;
  currentStageId: string | null;
  customData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubmissionRequest {
  candidateId: string;
  jobId: string;
  payRate?: number;
  billRate?: number;
  notes?: string;
  customData?: Record<string, unknown>;
}
