import { useAuthStore } from "@/stores/auth-store";
import { hasPermission, type Permission } from "@/lib/permissions";

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "VIEWER";

  return {
    can: (permission: Permission) => hasPermission(role, permission),
    canAny: (...permissions: Permission[]) =>
      permissions.some((p) => hasPermission(role, p)),
    isAdmin: role === "ADMIN",
    isManager: role === "MANAGER",
    isRecruiter: role === "RECRUITER",
    isViewer: role === "VIEWER",
    role,
  };
}
