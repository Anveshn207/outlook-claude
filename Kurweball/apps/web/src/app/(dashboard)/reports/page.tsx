"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingDown, PieChart, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

interface RecruiterStat {
  recruiter: { id: string; firstName: string; lastName: string };
  total: number;
  placed: number;
  rejected: number;
  pending: number;
}

interface FunnelStage {
  stageName: string;
  stageColor: string;
  count: number;
  order: number;
}

interface JobsOverview {
  open: number;
  closed: number;
  onHold: number;
  filled: number;
  total: number;
}

const jobStatusColors: Record<string, string> = {
  open: "#3B82F6",
  closed: "#6B7280",
  onHold: "#F59E0B",
  filled: "#10B981",
};

export default function ReportsPage() {
  const [recruiterStats, setRecruiterStats] = useState<RecruiterStat[]>([]);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [jobsOverview, setJobsOverview] = useState<JobsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const [recruiters, pipeline, jobs] = await Promise.all([
          apiFetch<RecruiterStat[]>("/reports/submissions-by-recruiter"),
          apiFetch<FunnelStage[]>("/reports/pipeline-funnel"),
          apiFetch<JobsOverview>("/reports/jobs-overview"),
        ]);
        setRecruiterStats(recruiters);
        setFunnel(pipeline);
        setJobsOverview(jobs);
      } catch (err) {
        console.error("[Reports] Failed to load:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const maxSubmissions = Math.max(...recruiterStats.map((r) => r.total), 1);
  const maxFunnelCount = Math.max(...funnel.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Reports</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Analyze your recruiting metrics and team performance.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Submissions by Recruiter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Submissions by Recruiter
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Total submission counts across the team
              </p>
            </CardHeader>
            <CardContent>
              {recruiterStats.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No submission data yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {recruiterStats.map((r) => (
                    <div key={r.recruiter.id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">
                          {r.recruiter.firstName} {r.recruiter.lastName}
                        </span>
                        <span className="text-muted-foreground">
                          {r.total} total
                        </span>
                      </div>
                      <div className="flex h-6 w-full overflow-hidden rounded-full bg-muted">
                        {r.placed > 0 && (
                          <div
                            className="bg-emerald-500 transition-all"
                            style={{
                              width: `${(r.placed / maxSubmissions) * 100}%`,
                            }}
                            title={`Placed: ${r.placed}`}
                          />
                        )}
                        {r.pending > 0 && (
                          <div
                            className="bg-blue-500 transition-all"
                            style={{
                              width: `${(r.pending / maxSubmissions) * 100}%`,
                            }}
                            title={`Active: ${r.pending}`}
                          />
                        )}
                        {r.rejected > 0 && (
                          <div
                            className="bg-red-400 transition-all"
                            style={{
                              width: `${(r.rejected / maxSubmissions) * 100}%`,
                            }}
                            title={`Rejected: ${r.rejected}`}
                          />
                        )}
                      </div>
                      <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                        {r.placed > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                            Placed: {r.placed}
                          </span>
                        )}
                        {r.pending > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                            Active: {r.pending}
                          </span>
                        )}
                        {r.rejected > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                            Rejected: {r.rejected}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pipeline Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingDown className="h-5 w-5 text-emerald-500" />
                Pipeline Funnel
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Candidates at each stage across all jobs
              </p>
            </CardHeader>
            <CardContent>
              {funnel.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No pipeline data yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {funnel.map((stage) => (
                    <div key={stage.stageName}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">
                          {stage.stageName}
                        </span>
                        <span className="font-semibold text-foreground">
                          {stage.count}
                        </span>
                      </div>
                      <div className="h-8 w-full overflow-hidden rounded bg-muted">
                        <div
                          className="h-full rounded transition-all"
                          style={{
                            width: `${(stage.count / maxFunnelCount) * 100}%`,
                            backgroundColor: stage.stageColor || "#3B82F6",
                            minWidth: stage.count > 0 ? "2rem" : "0",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Jobs Overview */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChart className="h-5 w-5 text-purple-500" />
                Jobs Overview
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Distribution of jobs by status
              </p>
            </CardHeader>
            <CardContent>
              {!jobsOverview || jobsOverview.total === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No jobs data yet.
                </p>
              ) : (
                <div>
                  {/* Visual bar */}
                  <div className="mb-6 flex h-12 w-full overflow-hidden rounded-lg">
                    {jobsOverview.open > 0 && (
                      <div
                        className="flex items-center justify-center text-xs font-medium text-white transition-all"
                        style={{
                          width: `${(jobsOverview.open / jobsOverview.total) * 100}%`,
                          backgroundColor: jobStatusColors.open,
                        }}
                      >
                        {jobsOverview.open}
                      </div>
                    )}
                    {jobsOverview.filled > 0 && (
                      <div
                        className="flex items-center justify-center text-xs font-medium text-white transition-all"
                        style={{
                          width: `${(jobsOverview.filled / jobsOverview.total) * 100}%`,
                          backgroundColor: jobStatusColors.filled,
                        }}
                      >
                        {jobsOverview.filled}
                      </div>
                    )}
                    {jobsOverview.onHold > 0 && (
                      <div
                        className="flex items-center justify-center text-xs font-medium text-white transition-all"
                        style={{
                          width: `${(jobsOverview.onHold / jobsOverview.total) * 100}%`,
                          backgroundColor: jobStatusColors.onHold,
                        }}
                      >
                        {jobsOverview.onHold}
                      </div>
                    )}
                    {jobsOverview.closed > 0 && (
                      <div
                        className="flex items-center justify-center text-xs font-medium text-white transition-all"
                        style={{
                          width: `${(jobsOverview.closed / jobsOverview.total) * 100}%`,
                          backgroundColor: jobStatusColors.closed,
                        }}
                      >
                        {jobsOverview.closed}
                      </div>
                    )}
                  </div>

                  {/* Legend grid */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      { label: "Open", value: jobsOverview.open, color: jobStatusColors.open },
                      { label: "Filled", value: jobsOverview.filled, color: jobStatusColors.filled },
                      { label: "On Hold", value: jobsOverview.onHold, color: jobStatusColors.onHold },
                      { label: "Closed", value: jobsOverview.closed, color: jobStatusColors.closed },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-lg border border-border p-3 text-center"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-2xl font-bold text-foreground">
                            {item.value}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-center text-sm text-muted-foreground">
                    {jobsOverview.total} total jobs
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
