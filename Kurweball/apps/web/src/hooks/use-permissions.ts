import { useAuthStore } from "@/stores/auth-store";
import { hasPermission, type Permission } from "@/lib/permissions";

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "VIEWER";
  const userPermissions = user?.permissions;

  const can = (permission: Permission) =>
    userPermissions
      ? userPermissions.includes(permission)
      : hasPermission(role, permission);

  return {
    can,
    canAny: (...permissions: Permission[]) => permissions.some((p) => can(p)),
    isAdmin: role === "ADMIN",
    isManager: role === "MANAGER",
    isRecruiter: role === "RECRUITER",
    isViewer: role === "VIEWER",
    role,
  };
}
