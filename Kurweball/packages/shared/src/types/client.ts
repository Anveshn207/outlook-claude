export type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'PROSPECT';

export interface Client {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  status: ClientStatus;
  notes: string | null;
  customData: Record<string, unknown>;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientRequest {
  name: string;
  industry?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  status?: ClientStatus;
  notes?: string;
  customData?: Record<string, unknown>;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {}
