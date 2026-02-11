export type ActivityType = 'NOTE' | 'CALL' | 'EMAIL' | 'MEETING' | 'STATUS_CHANGE' | 'SUBMISSION';
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Activity {
  id: string;
  entityType: string;
  entityId: string;
  type: ActivityType;
  subject: string | null;
  body: string | null;
  metadata: Record<string, unknown> | null;
  createdById: string;
  createdAt: string;
}

export interface CreateActivityRequest {
  entityType: string;
  entityId: string;
  type: ActivityType;
  subject?: string;
  body?: string;
  metadata?: Record<string, unknown>;
}

export interface Task {
  id: string;
  assignedToId: string | null;
  entityType: string | null;
  entityId: string | null;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  createdById: string;
  createdAt: string;
  completedAt: string | null;
}

export interface CreateTaskRequest {
  assignedToId?: string;
  entityType?: string;
  entityId?: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
}
