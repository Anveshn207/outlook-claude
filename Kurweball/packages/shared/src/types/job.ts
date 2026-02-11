export type JobType = 'FULLTIME' | 'CONTRACT' | 'C2H';
export type JobStatus = 'OPEN' | 'CLOSED' | 'ON_HOLD' | 'FILLED';
export type JobPriority = 'HOT' | 'NORMAL' | 'LOW';

export interface Job {
  id: string;
  clientId: string;
  contactId: string | null;
  title: string;
  description: string | null;
  requirements: string | null;
  location: string | null;
  jobType: JobType;
  status: JobStatus;
  positionsCount: number;
  billRate: number | null;
  payRate: number | null;
  priority: JobPriority;
  skillsRequired: string[];
  pipelineTemplateId: string | null;
  customData: Record<string, unknown>;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobRequest {
  clientId: string;
  contactId?: string;
  title: string;
  description?: string;
  requirements?: string;
  location?: string;
  jobType?: JobType;
  status?: JobStatus;
  positionsCount?: number;
  billRate?: number;
  payRate?: number;
  priority?: JobPriority;
  skillsRequired?: string[];
  pipelineTemplateId?: string;
  customData?: Record<string, unknown>;
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {}
