"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  Kanban,
  CalendarDays,
  ClipboardList,
  BarChart3,
  UsersRound,
  Upload,
  Settings,
  ShieldCheck,
  LogOut,
  X,
  Circle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { usePermissions } from "@/hooks/use-permissions";
import type { Permission } from "@/lib/permissions";

const navigation: { name: string; href: string; icon: typeof LayoutDashboard; permission?: Permission }[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Candidates", href: "/candidates", icon: Users, permission: "candidates:read" },
  { name: "Jobs", href: "/jobs", icon: Briefcase, permission: "jobs:read" },
  { name: "Clients", href: "/clients", icon: Building2, permission: "clients:read" },
  { name: "Pipeline", href: "/pipeline", icon: Kanban, permission: "pipeline:read" },
  { name: "Interviews", href: "/interviews", icon: CalendarDays, permission: "interviews:read" },
  { name: "Tasks", href: "/tasks", icon: ClipboardList, permission: "tasks:read" },
  { name: "Reports", href: "/reports", icon: BarChart3, permission: "reports:read" },
  { name: "Import", href: "/import", icon: Upload, permission: "import-export:create" },
  { name: "Team", href: "/team", icon: UsersRound, permission: "users:read" },
  { name: "Roles", href: "/roles", icon: ShieldCheck, permission: "users:read" },
  { name: "Settings", href: "/settings", icon: Settings, permission: "settings:read" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { can } = usePermissions();

  const filteredNavigation = navigation.filter(
    (item) => !item.permission || can(item.permission),
  );

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : "U";

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b from-sidebar to-sidebar/95 text-sidebar-foreground transition-transform duration-200 ease-in-out lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo / Brand */}
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Circle className="h-4 w-4 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              KurweBall
            </span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-sidebar-muted hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {filteredNavigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "text-primary-foreground"
                    : "text-sidebar-muted hover:bg-sidebar-accent hover:text-white",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-primary"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <span className="relative flex items-center gap-3">
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-accent p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user ? `${user.firstName} ${user.lastName}` : "User"}
              </p>
              <p className="truncate text-xs text-sidebar-muted">
                {user?.role || "Recruiter"}
              </p>
            </div>
            <button
              onClick={logout}
              className="rounded-md p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-white"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
