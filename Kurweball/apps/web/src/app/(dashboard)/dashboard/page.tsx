"use client";

import {
  Briefcase,
  Users,
  Send,
  Trophy,
  Clock,
  UserPlus,
  FileText,
  CheckCircle2,
  PhoneCall,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";

const stats = [
  {
    label: "Open Jobs",
    value: "24",
    icon: Briefcase,
    color: "bg-blue-50 text-blue-600",
    accent: "border-l-blue-500",
  },
  {
    label: "Active Candidates",
    value: "156",
    icon: Users,
    color: "bg-emerald-50 text-emerald-600",
    accent: "border-l-emerald-500",
  },
  {
    label: "Submissions This Week",
    value: "12",
    icon: Send,
    color: "bg-amber-50 text-amber-600",
    accent: "border-l-amber-500",
  },
  {
    label: "Placements This Month",
    value: "3",
    icon: Trophy,
    color: "bg-purple-50 text-purple-600",
    accent: "border-l-purple-500",
  },
];

const recentActivity = [
  {
    icon: UserPlus,
    text: "Sarah Chen was added as a candidate for Senior React Developer",
    time: "12 minutes ago",
  },
  {
    icon: Send,
    text: "James Wilson was submitted to Acme Corp for Java Backend Engineer",
    time: "45 minutes ago",
  },
  {
    icon: PhoneCall,
    text: "Interview scheduled with Maria Garcia at TechFlow Inc",
    time: "2 hours ago",
  },
  {
    icon: CheckCircle2,
    text: "David Park accepted offer at NovaSoft — placement confirmed",
    time: "4 hours ago",
  },
  {
    icon: FileText,
    text: "New job posted: Product Manager at CloudBase (3 positions)",
    time: "Yesterday",
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();

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
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className={`border-l-4 ${stat.accent}`}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
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
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
