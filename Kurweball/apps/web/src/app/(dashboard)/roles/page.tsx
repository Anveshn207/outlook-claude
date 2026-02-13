"use client";

import { useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Crown,
  UserCog,
  User,
  EyeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Permission = {
  key: string;
  label: string;
  description: string;
};

type PermissionGroup = {
  module: string;
  label: string;
  permissions: Permission[];
};

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    module: "candidates",
    label: "Candidates",
    permissions: [
      { key: "candidates:read", label: "View", description: "View candidate profiles and lists" },
      { key: "candidates:create", label: "Create", description: "Add new candidates" },
      { key: "candidates:update", label: "Edit", description: "Edit candidate information" },
      { key: "candidates:delete", label: "Delete", description: "Remove candidates" },
    ],
  },
  {
    module: "jobs",
    label: "Jobs",
    permissions: [
      { key: "jobs:read", label: "View", description: "View job postings" },
      { key: "jobs:create", label: "Create", description: "Create new jobs" },
      { key: "jobs:update", label: "Edit", description: "Edit job details" },
      { key: "jobs:delete", label: "Delete", description: "Remove job postings" },
    ],
  },
  {
    module: "clients",
    label: "Clients",
    permissions: [
      { key: "clients:read", label: "View", description: "View client companies" },
      { key: "clients:create", label: "Create", description: "Add new clients" },
      { key: "clients:update", label: "Edit", description: "Edit client details" },
      { key: "clients:delete", label: "Delete", description: "Remove clients" },
    ],
  },
  {
    module: "pipeline",
    label: "Pipeline",
    permissions: [
      { key: "pipeline:read", label: "View", description: "View hiring pipelines" },
      { key: "pipeline:update", label: "Edit", description: "Move candidates between stages" },
    ],
  },
  {
    module: "submissions",
    label: "Submissions",
    permissions: [
      { key: "submissions:read", label: "View", description: "View candidate submissions" },
      { key: "submissions:create", label: "Create", description: "Submit candidates to jobs" },
      { key: "submissions:update", label: "Edit", description: "Edit submissions" },
      { key: "submissions:delete", label: "Delete", description: "Remove submissions" },
    ],
  },
  {
    module: "interviews",
    label: "Interviews",
    permissions: [
      { key: "interviews:read", label: "View", description: "View scheduled interviews" },
      { key: "interviews:create", label: "Create", description: "Schedule interviews" },
      { key: "interviews:update", label: "Edit", description: "Reschedule or update" },
      { key: "interviews:delete", label: "Delete", description: "Cancel interviews" },
    ],
  },
  {
    module: "tasks",
    label: "Tasks",
    permissions: [
      { key: "tasks:read", label: "View", description: "View assigned tasks" },
      { key: "tasks:create", label: "Create", description: "Create new tasks" },
      { key: "tasks:update", label: "Edit", description: "Update task status" },
      { key: "tasks:delete", label: "Delete", description: "Remove tasks" },
    ],
  },
  {
    module: "reports",
    label: "Reports",
    permissions: [
      { key: "reports:read", label: "View", description: "Access dashboards and analytics" },
    ],
  },
  {
    module: "activities",
    label: "Activities",
    permissions: [
      { key: "activities:read", label: "View", description: "View activity feed" },
      { key: "activities:create", label: "Create", description: "Log activities" },
    ],
  },
  {
    module: "users",
    label: "Users",
    permissions: [
      { key: "users:read", label: "View", description: "View team members" },
      { key: "users:create", label: "Create", description: "Invite new users" },
      { key: "users:update", label: "Edit", description: "Edit user roles and status" },
    ],
  },
  {
    module: "settings",
    label: "Settings",
    permissions: [
      { key: "settings:read", label: "View", description: "View system settings" },
      { key: "settings:update", label: "Edit", description: "Modify system settings" },
    ],
  },
  {
    module: "custom-fields",
    label: "Custom Fields",
    permissions: [
      { key: "custom-fields:read", label: "View", description: "View custom fields" },
      { key: "custom-fields:create", label: "Create", description: "Add custom fields" },
      { key: "custom-fields:update", label: "Edit", description: "Edit custom fields" },
      { key: "custom-fields:delete", label: "Delete", description: "Remove custom fields" },
    ],
  },
  {
    module: "saved-views",
    label: "Saved Views",
    permissions: [
      { key: "saved-views:read", label: "View", description: "Access saved filters" },
      { key: "saved-views:create", label: "Create", description: "Save new views" },
      { key: "saved-views:update", label: "Edit", description: "Edit saved views" },
      { key: "saved-views:delete", label: "Delete", description: "Remove saved views" },
    ],
  },
  {
    module: "import-export",
    label: "Import / Export",
    permissions: [
      { key: "import-export:read", label: "Export", description: "Download data exports" },
      { key: "import-export:create", label: "Import", description: "Upload bulk data" },
    ],
  },
  {
    module: "search",
    label: "Search",
    permissions: [
      { key: "search:read", label: "Search", description: "Use global search" },
      { key: "search:reindex", label: "Reindex", description: "Trigger search reindex" },
    ],
  },
  {
    module: "notifications",
    label: "Notifications",
    permissions: [
      { key: "notifications:read", label: "View", description: "Receive notifications" },
      { key: "notifications:update", label: "Manage", description: "Mark as read, dismiss" },
    ],
  },
];

// Mirror the backend ROLE_PERMISSIONS
const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key),
);

const ROLE_PERMISSIONS: Record<string, Set<string>> = {
  ADMIN: new Set(ALL_PERMISSION_KEYS),
  MANAGER: new Set(
    ALL_PERMISSION_KEYS.filter(
      (p) =>
        p !== "users:create" &&
        p !== "users:update" &&
        p !== "settings:update" &&
        p !== "search:reindex",
    ),
  ),
  RECRUITER: new Set([
    "candidates:read", "candidates:create", "candidates:update", "candidates:delete",
    "jobs:read", "jobs:create", "jobs:update", "jobs:delete",
    "clients:read", "clients:create", "clients:update", "clients:delete",
    "pipeline:read", "pipeline:update",
    "submissions:read", "submissions:create", "submissions:update", "submissions:delete",
    "interviews:read", "interviews:create", "interviews:update", "interviews:delete",
    "reports:read",
    "tasks:read", "tasks:create", "tasks:update", "tasks:delete",
    "custom-fields:read",
    "settings:read",
    "users:read",
    "import-export:read", "import-export:create",
    "search:read",
    "activities:read", "activities:create",
    "saved-views:read", "saved-views:create", "saved-views:update", "saved-views:delete",
    "notifications:read", "notifications:update",
  ]),
  VIEWER: new Set([
    "candidates:read", "jobs:read", "clients:read", "pipeline:read",
    "submissions:read", "interviews:read", "reports:read", "tasks:read",
    "custom-fields:read", "settings:read", "users:read", "search:read",
    "activities:read", "saved-views:read", "notifications:read", "import-export:read",
  ]),
};

const ROLES = [
  {
    key: "ADMIN",
    label: "Admin",
    description: "Full system access. Can manage users, settings, and all data.",
    color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
    iconColor: "text-purple-600 dark:text-purple-400",
    icon: Crown,
    permCount: ROLE_PERMISSIONS.ADMIN.size,
  },
  {
    key: "MANAGER",
    label: "Manager",
    description: "Read + edit access to everything. Cannot manage users or system settings.",
    color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    iconColor: "text-amber-600 dark:text-amber-400",
    icon: UserCog,
    permCount: ROLE_PERMISSIONS.MANAGER.size,
  },
  {
    key: "RECRUITER",
    label: "Recruiter",
    description: "Core recruitment operations. Manage candidates, jobs, clients, and pipeline.",
    color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    iconColor: "text-blue-600 dark:text-blue-400",
    icon: User,
    permCount: ROLE_PERMISSIONS.RECRUITER.size,
  },
  {
    key: "VIEWER",
    label: "Viewer",
    description: "Read-only access. Can view all data but cannot create, edit, or delete.",
    color: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800",
    iconColor: "text-gray-500 dark:text-gray-400",
    icon: EyeIcon,
    permCount: ROLE_PERMISSIONS.VIEWER.size,
  },
];

function PermissionCell({ allowed }: { allowed: boolean }) {
  return (
    <td className="px-3 py-2 text-center">
      {allowed ? (
        <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
      ) : (
        <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-900/30">
          <X className="h-3.5 w-3.5 text-gray-400 dark:text-gray-600" />
        </div>
      )}
    </td>
  );
}

function PermissionGroupRow({ group }: { group: PermissionGroup }) {
  const [expanded, setExpanded] = useState(false);

  // Summary: how many permissions each role has in this group
  const totalPerms = group.permissions.length;

  return (
    <>
      {/* Group header row */}
      <tr
        className="cursor-pointer border-t border-border bg-muted/30 transition-colors hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-semibold text-foreground">
              {group.label}
            </span>
            <span className="text-xs text-muted-foreground">
              ({totalPerms})
            </span>
          </div>
        </td>
        {ROLES.map((role) => {
          const count = group.permissions.filter((p) =>
            ROLE_PERMISSIONS[role.key].has(p.key),
          ).length;
          return (
            <td key={role.key} className="px-3 py-3 text-center">
              <span
                className={cn(
                  "text-xs font-medium",
                  count === totalPerms
                    ? "text-emerald-600 dark:text-emerald-400"
                    : count > 0
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-gray-400 dark:text-gray-600",
                )}
              >
                {count}/{totalPerms}
              </span>
            </td>
          );
        })}
      </tr>

      {/* Expanded permission rows */}
      {expanded &&
        group.permissions.map((perm) => (
          <tr
            key={perm.key}
            className="border-t border-border/50 transition-colors hover:bg-muted/20"
          >
            <td className="py-2 pl-11 pr-4">
              <div>
                <span className="text-sm text-foreground">{perm.label}</span>
                <p className="text-xs text-muted-foreground">
                  {perm.description}
                </p>
              </div>
            </td>
            {ROLES.map((role) => (
              <PermissionCell
                key={role.key}
                allowed={ROLE_PERMISSIONS[role.key].has(perm.key)}
              />
            ))}
          </tr>
        ))}
    </>
  );
}

export default function RolesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Roles & Permissions
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage what each role can access across the platform. Permissions are
          assigned per role and apply to all users with that role.
        </p>
      </div>

      {/* Role cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((role) => (
          <div
            key={role.key}
            className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  role.color,
                )}
              >
                <role.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground">{role.label}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {role.description}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">Permissions</span>
              <span className="text-sm font-semibold text-foreground">
                {role.permCount}{" "}
                <span className="font-normal text-muted-foreground">
                  / {ALL_PERMISSION_KEYS.length}
                </span>
              </span>
            </div>
            {/* Permission bar */}
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  role.key === "ADMIN"
                    ? "bg-purple-500"
                    : role.key === "MANAGER"
                      ? "bg-amber-500"
                      : role.key === "RECRUITER"
                        ? "bg-blue-500"
                        : "bg-gray-400",
                )}
                style={{
                  width: `${(role.permCount / ALL_PERMISSION_KEYS.length) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Permission matrix */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h3 className="font-semibold text-foreground">Permission Matrix</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Click a module to expand and see individual permissions
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Module / Permission
                </th>
                {ROLES.map((role) => (
                  <th
                    key={role.key}
                    className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-md",
                          role.color,
                        )}
                      >
                        <role.icon className="h-3.5 w-3.5" />
                      </div>
                      {role.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.map((group) => (
                <PermissionGroupRow key={group.module} group={group} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
