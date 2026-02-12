"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Send,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  PhoneCall,
  Mail,
  FileText,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { apiFetch } from "@/lib/api";

interface DashboardStats {
  openJobs: number;
  activeCandidates: number;
  totalSubmissions: number;
  submissionsThisWeek: number;
  submissionsThisMonth: number;
  placements: number;
  totalClients: number;
  totalInterviews: number;
}

interface ActivityItem {
  id: string;
  type: string;
  subject: string;
  body: string | null;
  entityType: string;
  entityId: string;
  createdAt: string;
  createdBy: { id: string; firstName: string; lastName: string };
}

interface TaskItem {
  id: string;
  title: string;
  dueDate: string | null;
  priority: string;
  status: string;
  assignedTo: { id: string; firstName: string; lastName: string };
}

const activityIcons: Record<string, typeof MessageSquare> = {
  NOTE: MessageSquare,
  CALL: PhoneCall,
  EMAIL: Mail,
  MEETING: Calendar,
  STATUS_CHANGE: CheckCircle2,
  SUBMISSION: Send,
};

const priorityColors: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700 border-red-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  LOW: "bg-gray-100 text-gray-600 border-gray-200",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [dashStats, recentActivities, upcomingTasks] = await Promise.all([
          apiFetch<DashboardStats>("/reports/dashboard"),
          apiFetch<ActivityItem[]>("/activities/recent?limit=8"),
          apiFetch<TaskItem[]>("/tasks/upcoming?limit=5"),
        ]);
        setStats(dashStats);
        setActivities(recentActivities);
        setTasks(upcomingTasks);
      } catch (err) {
        console.error("[Dashboard] Failed to load:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const statCards = [
    {
      label: "Open Jobs",
      value: stats?.openJobs ?? 0,
      icon: Briefcase,
      color: "bg-blue-50 text-blue-600",
      accent: "border-l-blue-500",
      href: "/jobs",
    },
    {
      label: "Active Candidates",
      value: stats?.activeCandidates ?? 0,
      icon: Users,
      color: "bg-emerald-50 text-emerald-600",
      accent: "border-l-emerald-500",
      href: "/candidates",
    },
    {
      label: "Submissions",
      value: stats?.totalSubmissions ?? 0,
      sub: stats?.submissionsThisWeek ? `${stats.submissionsThisWeek} this week` : undefined,
      icon: Send,
      color: "bg-amber-50 text-amber-600",
      accent: "border-l-amber-500",
      href: "/pipeline",
    },
    {
      label: "Placements",
      value: stats?.placements ?? 0,
      icon: CheckCircle2,
      color: "bg-purple-50 text-purple-600",
      accent: "border-l-purple-500",
      href: "/reports",
    },
  ];

  const secondaryStats = [
    { label: "Clients", value: stats?.totalClients ?? 0, href: "/clients" },
    { label: "Scheduled Interviews", value: stats?.totalInterviews ?? 0 },
    { label: "Submissions (30d)", value: stats?.submissionsThisMonth ?? 0 },
  ];

  return (
    <div className="space-y-8 overflow-hidden">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.firstName || "there"}!
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here is what is happening with your recruiting pipeline today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className={`border-l-4 ${stat.accent} transition-shadow hover:shadow-md`}>
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${stat.color}`}
                >
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </p>
                      {"sub" in stat && stat.sub && (
                        <p className="text-xs text-muted-foreground">{stat.sub}</p>
                      )}
                    </>
                  )}
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Secondary stats row */}
      {!loading && stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {secondaryStats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className="text-xl font-semibold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Two-column: Activity + Tasks */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity — 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Recent Activity
            </CardTitle>
            <Link href="/candidates">
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : activities.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No recent activity yet.
              </p>
            ) : (
              <div className="space-y-0">
                {activities.map((activity) => {
                  const Icon = activityIcons[activity.type] ?? FileText;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 border-b border-border py-3.5 last:border-b-0 last:pb-0 first:pt-0"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">
                            {activity.createdBy.firstName} {activity.createdBy.lastName}
                          </span>{" "}
                          {activity.subject}
                        </p>
                        {activity.body && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {activity.body}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {timeAgo(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks — 1 col */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              Upcoming Tasks
            </CardTitle>
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No upcoming tasks.
              </p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => {
                  const isOverdue =
                    task.dueDate && new Date(task.dueDate) < new Date();
                  return (
                    <div
                      key={task.id}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground line-clamp-2">
                          {task.title}
                        </p>
                        <Badge
                          className={priorityColors[task.priority] ?? ""}
                          variant="outline"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        {task.dueDate ? (
                          <span
                            className={
                              isOverdue
                                ? "flex items-center gap-1 font-medium text-red-600"
                                : ""
                            }
                          >
                            {isOverdue && (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                            {new Date(task.dueDate).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )}
                          </span>
                        ) : (
                          <span>No due date</span>
                        )}
                        <span>&middot;</span>
                        <span>{task.assignedTo.firstName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
