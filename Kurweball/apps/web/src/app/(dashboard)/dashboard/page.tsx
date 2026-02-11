"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  Users,
  Send,
  Building2,
  Clock,
  UserPlus,
  FileText,
  CheckCircle2,
  PhoneCall,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { apiFetch } from "@/lib/api";

interface DashboardStats {
  openJobs: number;
  activeCandidates: number;
  totalSubmissions: number;
  totalClients: number;
}

const recentActivity = [
  {
    icon: UserPlus,
    text: "New candidate added to the pipeline",
    time: "Recent",
  },
  {
    icon: Send,
    text: "Candidate submitted for review",
    time: "Recent",
  },
  {
    icon: PhoneCall,
    text: "Interview scheduled",
    time: "Recent",
  },
  {
    icon: CheckCircle2,
    text: "Placement confirmed",
    time: "Recent",
  },
  {
    icon: FileText,
    text: "New job requisition created",
    time: "Recent",
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [candidates, jobs, clients] = await Promise.all([
          apiFetch<{ meta: { total: number } }>("/candidates?limit=1&status=ACTIVE"),
          apiFetch<{ meta: { total: number } }>("/jobs?limit=1&status=OPEN"),
          apiFetch<{ meta: { total: number } }>("/clients?limit=1"),
        ]);

        // Get total submissions count from all jobs
        const allJobs = await apiFetch<{ data: { _count: { submissions: number } }[] }>("/jobs?limit=100");
        const totalSubmissions = allJobs.data.reduce((sum, j) => sum + j._count.submissions, 0);

        setStats({
          activeCandidates: candidates.meta.total,
          openJobs: jobs.meta.total,
          totalClients: clients.meta.total,
          totalSubmissions,
        });
      } catch (err) {
        console.error("[Dashboard] Failed to load stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    {
      label: "Open Jobs",
      value: stats?.openJobs ?? 0,
      icon: Briefcase,
      color: "bg-blue-50 text-blue-600",
      accent: "border-l-blue-500",
    },
    {
      label: "Active Candidates",
      value: stats?.activeCandidates ?? 0,
      icon: Users,
      color: "bg-emerald-50 text-emerald-600",
      accent: "border-l-emerald-500",
    },
    {
      label: "Total Submissions",
      value: stats?.totalSubmissions ?? 0,
      icon: Send,
      color: "bg-amber-50 text-amber-600",
      accent: "border-l-amber-500",
    },
    {
      label: "Clients",
      value: stats?.totalClients ?? 0,
      icon: Building2,
      color: "bg-purple-50 text-purple-600",
      accent: "border-l-purple-500",
    },
  ];

  return (
    <div className="space-y-8">
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
          <Card key={stat.label} className={`border-l-4 ${stat.accent}`}>
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
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {recentActivity.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 border-b border-border py-3.5 last:border-b-0 last:pb-0 first:pt-0"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{item.text}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
