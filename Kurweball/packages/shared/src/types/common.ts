export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface SavedView {
  id: string;
  entityType: string;
  name: string;
  isDefault: boolean;
  isShared: boolean;
  config: ViewConfig;
  createdById: string;
  createdAt: string;
}

export interface ViewConfig {
  columns: string[];
  filters: ViewFilter[];
  sorts: ViewSort[];
  groupBy?: string;
  pageSize: number;
}

export interface ViewFilter {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in' | 'is_empty' | 'is_not_empty';
  value: unknown;
}

export interface ViewSort {
  field: string;
  direction: 'asc' | 'desc';
}
