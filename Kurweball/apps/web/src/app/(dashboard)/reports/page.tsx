"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingDown, PieChart, Loader2, Clock, Target, Zap, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

interface TimeToHireStat {
  jobTitle: string;
  avgDays: number;
  count: number;
}

interface SourceEffectiveness {
  source: string;
  total: number;
  placed: number;
  conversionRate: number;
}

interface PipelineVelocity {
  stageName: string;
  stageColor: string | null;
  avgDays: number;
  order: number;
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
  const [timeToHire, setTimeToHire] = useState<TimeToHireStat[]>([]);
  const [sourceEffectiveness, setSourceEffectiveness] = useState<SourceEffectiveness[]>([]);
  const [pipelineVelocity, setPipelineVelocity] = useState<PipelineVelocity[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    async function loadReports() {
      try {
        const [recruiters, pipeline, jobs, tth, sources, velocity] = await Promise.all([
          apiFetch<RecruiterStat[]>("/reports/submissions-by-recruiter"),
          apiFetch<FunnelStage[]>("/reports/pipeline-funnel"),
          apiFetch<JobsOverview>("/reports/jobs-overview"),
          apiFetch<TimeToHireStat[]>("/reports/time-to-hire"),
          apiFetch<SourceEffectiveness[]>("/reports/source-effectiveness"),
          apiFetch<PipelineVelocity[]>("/reports/pipeline-velocity"),
        ]);
        setRecruiterStats(recruiters);
        setFunnel(pipeline);
        setJobsOverview(jobs);
        setTimeToHire(tth);
        setSourceEffectiveness(sources);
        setPipelineVelocity(velocity);
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
  const maxTimeToHire = Math.max(...timeToHire.map((t) => t.avgDays), 1);
  const maxSourceTotal = Math.max(...sourceEffectiveness.map((s) => s.total), 1);
  const maxVelocityDays = Math.max(...pipelineVelocity.map((v) => v.avgDays), 1);

  const handleExport = async (type: "candidates" | "submissions") => {
    setExporting(type);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/reports/export/${type}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`[Reports] Export ${type} failed:`, err);
    } finally {
      setExporting(null);
    }
  };

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

          {/* Time to Hire */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-orange-500" />
                Time to Hire
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Average days from submission to placement by job
              </p>
            </CardHeader>
            <CardContent>
              {timeToHire.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No time-to-hire data yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {timeToHire.map((t) => (
                    <div key={t.jobTitle}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">
                          {t.jobTitle}
                        </span>
                        <span className="text-muted-foreground">
                          {t.avgDays.toFixed(1)} days{" "}
                          <span className="text-xs">({t.count} placements)</span>
                        </span>
                      </div>
                      <div className="h-6 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-orange-500 transition-all"
                          style={{
                            width: `${(t.avgDays / maxTimeToHire) * 100}%`,
                            minWidth: t.avgDays > 0 ? "1rem" : "0",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Source Effectiveness */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-cyan-500" />
                Source Effectiveness
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Candidate sources with placement conversion rates
              </p>
            </CardHeader>
            <CardContent>
              {sourceEffectiveness.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No source data yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {sourceEffectiveness.map((s) => (
                    <div key={s.source}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">
                          {s.source}
                        </span>
                        <span className="text-muted-foreground">
                          {s.placed}/{s.total} placed &mdash;{" "}
                          <span className="font-bold text-cyan-600">
                            {s.conversionRate.toFixed(1)}%
                          </span>
                        </span>
                      </div>
                      <div className="relative h-6 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-cyan-200 transition-all"
                          style={{
                            width: `${(s.total / maxSourceTotal) * 100}%`,
                            minWidth: s.total > 0 ? "1rem" : "0",
                          }}
                        />
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-cyan-500 transition-all"
                          style={{
                            width: `${(s.placed / maxSourceTotal) * 100}%`,
                            minWidth: s.placed > 0 ? "0.5rem" : "0",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pipeline Velocity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-5 w-5 text-violet-500" />
                Pipeline Velocity
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Average days candidates spend at each stage
              </p>
            </CardHeader>
            <CardContent>
              {pipelineVelocity.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No pipeline velocity data yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {pipelineVelocity
                    .sort((a, b) => a.order - b.order)
                    .map((v) => (
                      <div key={v.stageName}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 font-medium text-foreground">
                            <span
                              className="inline-block h-3 w-3 rounded-full"
                              style={{ backgroundColor: v.stageColor || "#8B5CF6" }}
                            />
                            {v.stageName}
                          </span>
                          <span className="text-muted-foreground">
                            {v.avgDays.toFixed(1)} days
                          </span>
                        </div>
                        <div className="h-6 w-full overflow-hidden rounded bg-muted">
                          <div
                            className="h-full rounded bg-violet-500 transition-all"
                            style={{
                              width: `${(v.avgDays / maxVelocityDays) * 100}%`,
                              minWidth: v.avgDays > 0 ? "1rem" : "0",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Data */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Download className="h-5 w-5 text-gray-500" />
                Export Data
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Download your recruiting data as CSV files
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button
                  variant="outline"
                  disabled={exporting === "candidates"}
                  onClick={() => handleExport("candidates")}
                >
                  {exporting === "candidates" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Export Candidates CSV
                </Button>
                <Button
                  variant="outline"
                  disabled={exporting === "submissions"}
                  onClick={() => handleExport("submissions")}
                >
                  {exporting === "submissions" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Export Submissions CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
