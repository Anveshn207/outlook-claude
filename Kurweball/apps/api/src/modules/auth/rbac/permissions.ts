export type Permission =
  | 'candidates:read'
  | 'candidates:create'
  | 'candidates:update'
  | 'candidates:delete'
  | 'jobs:read'
  | 'jobs:create'
  | 'jobs:update'
  | 'jobs:delete'
  | 'clients:read'
  | 'clients:create'
  | 'clients:update'
  | 'clients:delete'
  | 'pipeline:read'
  | 'pipeline:update'
  | 'submissions:read'
  | 'submissions:create'
  | 'submissions:update'
  | 'submissions:delete'
  | 'interviews:read'
  | 'interviews:create'
  | 'interviews:update'
  | 'interviews:delete'
  | 'reports:read'
  | 'tasks:read'
  | 'tasks:create'
  | 'tasks:update'
  | 'tasks:delete'
  | 'custom-fields:read'
  | 'custom-fields:create'
  | 'custom-fields:update'
  | 'custom-fields:delete'
  | 'settings:read'
  | 'settings:update'
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'import-export:read'
  | 'import-export:create'
  | 'search:read'
  | 'search:reindex'
  | 'activities:read'
  | 'activities:create'
  | 'saved-views:read'
  | 'saved-views:create'
  | 'saved-views:update'
  | 'saved-views:delete'
  | 'notifications:read'
  | 'notifications:update'
  | 'bench-sales:read'
  | 'bench-sales:create'
  | 'bench-sales:update'
  | 'bench-sales:delete';

const ALL_PERMISSIONS: Permission[] = [
  'candidates:read',
  'candidates:create',
  'candidates:update',
  'candidates:delete',
  'jobs:read',
  'jobs:create',
  'jobs:update',
  'jobs:delete',
  'clients:read',
  'clients:create',
  'clients:update',
  'clients:delete',
  'pipeline:read',
  'pipeline:update',
  'submissions:read',
  'submissions:create',
  'submissions:update',
  'submissions:delete',
  'interviews:read',
  'interviews:create',
  'interviews:update',
  'interviews:delete',
  'reports:read',
  'tasks:read',
  'tasks:create',
  'tasks:update',
  'tasks:delete',
  'custom-fields:read',
  'custom-fields:create',
  'custom-fields:update',
  'custom-fields:delete',
  'settings:read',
  'settings:update',
  'users:read',
  'users:create',
  'users:update',
  'import-export:read',
  'import-export:create',
  'search:read',
  'search:reindex',
  'activities:read',
  'activities:create',
  'saved-views:read',
  'saved-views:create',
  'saved-views:update',
  'saved-views:delete',
  'notifications:read',
  'notifications:update',
  'bench-sales:read',
  'bench-sales:create',
  'bench-sales:update',
  'bench-sales:delete',
];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: [...ALL_PERMISSIONS],

  MANAGER: ALL_PERMISSIONS.filter(
    (p) =>
      p !== 'users:create' &&
      p !== 'users:update' &&
      p !== 'settings:update' &&
      p !== 'search:reindex' &&
      p !== 'tasks:delete',
  ),

  RECRUITER: [
    'candidates:read',
    'candidates:create',
    'candidates:update',
    'candidates:delete',
    'jobs:read',
    'jobs:create',
    'jobs:update',
    'jobs:delete',
    'clients:read',
    'clients:create',
    'clients:update',
    'clients:delete',
    'pipeline:read',
    'pipeline:update',
    'submissions:read',
    'submissions:create',
    'submissions:update',
    'submissions:delete',
    'interviews:read',
    'interviews:create',
    'interviews:update',
    'interviews:delete',
    'reports:read',
    'tasks:read',
    'tasks:create',
    'tasks:update',
    'custom-fields:read',
    'settings:read',
    'users:read',
    'import-export:read',
    'import-export:create',
    'search:read',
    'activities:read',
    'activities:create',
    'saved-views:read',
    'saved-views:create',
    'saved-views:update',
    'saved-views:delete',
    'notifications:read',
    'notifications:update',
    'bench-sales:read',
    'bench-sales:create',
    'bench-sales:update',
  ],

  VIEWER: [
    'candidates:read',
    'jobs:read',
    'clients:read',
    'pipeline:read',
    'submissions:read',
    'interviews:read',
    'reports:read',
    'tasks:read',
    'custom-fields:read',
    'settings:read',
    'users:read',
    'search:read',
    'activities:read',
    'saved-views:read',
    'notifications:read',
    'import-export:read',
    'bench-sales:read',
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}
