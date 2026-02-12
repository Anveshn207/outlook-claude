export type Permission =
  | 'candidates:read' | 'candidates:create' | 'candidates:update' | 'candidates:delete'
  | 'jobs:read' | 'jobs:create' | 'jobs:update' | 'jobs:delete'
  | 'clients:read' | 'clients:create' | 'clients:update' | 'clients:delete'
  | 'pipeline:read' | 'pipeline:update'
  | 'submissions:read' | 'submissions:create' | 'submissions:update' | 'submissions:delete'
  | 'interviews:read' | 'interviews:create' | 'interviews:update' | 'interviews:delete'
  | 'reports:read'
  | 'tasks:read' | 'tasks:create' | 'tasks:update' | 'tasks:delete'
  | 'custom-fields:read' | 'custom-fields:create' | 'custom-fields:update' | 'custom-fields:delete'
  | 'settings:read' | 'settings:update'
  | 'users:read' | 'users:create' | 'users:update'
  | 'import-export:read' | 'import-export:create'
  | 'search:read' | 'search:reindex'
  | 'activities:read' | 'activities:create'
  | 'saved-views:read' | 'saved-views:create' | 'saved-views:update' | 'saved-views:delete'
  | 'notifications:read' | 'notifications:update';

const ALL_PERMISSIONS: Permission[] = [
  'candidates:read', 'candidates:create', 'candidates:update', 'candidates:delete',
  'jobs:read', 'jobs:create', 'jobs:update', 'jobs:delete',
  'clients:read', 'clients:create', 'clients:update', 'clients:delete',
  'pipeline:read', 'pipeline:update',
  'submissions:read', 'submissions:create', 'submissions:update', 'submissions:delete',
  'interviews:read', 'interviews:create', 'interviews:update', 'interviews:delete',
  'reports:read',
  'tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete',
  'custom-fields:read', 'custom-fields:create', 'custom-fields:update', 'custom-fields:delete',
  'settings:read', 'settings:update',
  'users:read', 'users:create', 'users:update',
  'import-export:read', 'import-export:create',
  'search:read', 'search:reindex',
  'activities:read', 'activities:create',
  'saved-views:read', 'saved-views:create', 'saved-views:update', 'saved-views:delete',
  'notifications:read', 'notifications:update',
];

const READ_PERMISSIONS: Permission[] = ALL_PERMISSIONS.filter(p => p.endsWith(':read'));

const RECRUITER_PERMISSIONS: Permission[] = [
  ...READ_PERMISSIONS,
  'candidates:create', 'candidates:update', 'candidates:delete',
  'jobs:create', 'jobs:update', 'jobs:delete',
  'clients:create', 'clients:update', 'clients:delete',
  'pipeline:update',
  'submissions:create', 'submissions:update', 'submissions:delete',
  'interviews:create', 'interviews:update', 'interviews:delete',
  'tasks:create', 'tasks:update', 'tasks:delete',
  'activities:create',
  'saved-views:create', 'saved-views:update', 'saved-views:delete',
  'import-export:create',
  'notifications:update',
];

const MANAGER_PERMISSIONS: Permission[] = [
  ...RECRUITER_PERMISSIONS,
  'custom-fields:create', 'custom-fields:update', 'custom-fields:delete',
  'search:reindex',
];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: ALL_PERMISSIONS,
  MANAGER: MANAGER_PERMISSIONS,
  RECRUITER: RECRUITER_PERMISSIONS,
  VIEWER: READ_PERMISSIONS,
};

export function hasPermission(role: string, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
