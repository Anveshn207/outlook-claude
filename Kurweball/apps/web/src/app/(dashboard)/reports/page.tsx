"use client";

import { BarChart3, PieChart, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const reports = [
  {
    title: "Submissions by Recruiter",
    description: "Weekly submission counts across the team",
    icon: BarChart3,
    color: "text-blue-500",
    bg: "bg-blue-50",
    height: "h-64",
  },
  {
    title: "Pipeline Funnel",
    description: "Conversion rates through each hiring stage",
    icon: TrendingDown,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    height: "h-64",
  },
  {
    title: "Jobs Overview",
    description: "Distribution of jobs by status and client",
    icon: PieChart,
    color: "text-purple-500",
    bg: "bg-purple-50",
    height: "h-64",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Reports</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Analyze your recruiting metrics and team performance.
        </p>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <report.icon className={`h-5 w-5 ${report.color}`} />
                {report.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {report.description}
              </p>
            </CardHeader>
            <CardContent>
              <div
                className={`flex ${report.height} items-center justify-center rounded-lg border border-dashed border-border ${report.bg}`}
              >
                <div className="text-center">
                  <report.icon
                    className={`mx-auto h-10 w-10 ${report.color} opacity-30`}
                  />
                  <p className="mt-3 text-sm font-medium text-muted-foreground">
                    Charts coming soon
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Interactive charts will be added in a future sprint
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
