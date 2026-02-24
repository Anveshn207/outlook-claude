"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GripVertical, Loader2, UserPlus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { usePermissions } from "@/hooks/use-permissions";
import { ExportDropdown } from "@/components/shared/export-dropdown";

/* ─── Types ─── */

interface KanbanSubmission {
  id: string;
  status: string;
  submittedAt: string;
  notes: string | null;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
    email: string | null;
  };
  currentStage: { id: string; name: string } | null;
  submittedBy: { id: string; firstName: string; lastName: string };
}

interface KanbanStage {
  id: string;
  name: string;
  order: number;
  color: string | null;
  isTerminal: boolean;
  submissions: KanbanSubmission[];
}

interface KanbanData {
  job: {
    id: string;
    title: string;
    status: string;
    client: { id: string; name: string };
  };
  stages: KanbanStage[];
}

interface PipelineJob {
  id: string;
  title: string;
  status: string;
  client: { id: string; name: string };
  _count: { submissions: number };
}

interface CandidateOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  title: string | null;
}

/* ─── Stage color mapping (hex → Tailwind utility) ─── */

const stageColorMap: Record<string, { dot: string; bg: string }> = {
  "#64748b": { dot: "bg-slate-500", bg: "bg-slate-50 dark:bg-slate-900/30" },
  "#6B7280": { dot: "bg-gray-500", bg: "bg-gray-50 dark:bg-gray-900/30" },
  "#3B82F6": { dot: "bg-blue-500", bg: "bg-blue-50 dark:bg-blue-900/30" },
  "#3b82f6": { dot: "bg-blue-500", bg: "bg-blue-50 dark:bg-blue-900/30" },
  "#6366f1": { dot: "bg-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/30" },
  "#8B5CF6": { dot: "bg-violet-500", bg: "bg-violet-50 dark:bg-violet-900/30" },
  "#8b5cf6": { dot: "bg-violet-500", bg: "bg-violet-50 dark:bg-violet-900/30" },
  "#F59E0B": { dot: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-900/30" },
  "#f59e0b": { dot: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-900/30" },
  "#10B981": { dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
  "#10b981": { dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
  "#059669": { dot: "bg-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
  "#22c55e": { dot: "bg-green-500", bg: "bg-green-50 dark:bg-green-900/30" },
  "#EF4444": { dot: "bg-red-500", bg: "bg-red-50 dark:bg-red-900/30" },
  "#ef4444": { dot: "bg-red-500", bg: "bg-red-50 dark:bg-red-900/30" },
  "#06b6d4": { dot: "bg-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/30" },
};

function getStageColors(hex: string | null) {
  if (hex && stageColorMap[hex]) return stageColorMap[hex];
  return { dot: "bg-slate-500", bg: "bg-slate-50 dark:bg-slate-900/30" };
}

/* ─── Submission status colors ─── */

const statusColors: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  SHORTLISTED: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
  INTERVIEW: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  OFFERED: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  PLACED: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  REJECTED: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  WITHDRAWN: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700",
};

/* ─── Main Page ─── */

export default function PipelinePage() {
  const { can } = usePermissions();
  const [jobs, setJobs] = useState<PipelineJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [kanban, setKanban] = useState<KanbanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [kanbanLoading, setKanbanLoading] = useState(false);

  // Submit candidate dialog
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<string>("");

  // Drag state
  const dragItem = useRef<{ submissionId: string; fromStageId: string } | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Load jobs with submissions
  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<PipelineJob[]>("/pipeline/jobs");
        setJobs(data);
        if (data.length > 0) {
          setSelectedJobId(data[0].id);
        }
      } catch (err) {
        console.error("[PipelinePage] Failed to load jobs:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load kanban data when job changes
  const loadKanban = useCallback(async (jobId: string) => {
    if (!jobId) return;
    setKanbanLoading(true);
    try {
      const data = await apiFetch<KanbanData>(`/pipeline/jobs/${jobId}`);
      setKanban(data);
    } catch (err) {
      console.error("[PipelinePage] Failed to load kanban:", err);
      setKanban(null);
    } finally {
      setKanbanLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      loadKanban(selectedJobId);
    }
  }, [selectedJobId, loadKanban]);

  // Search candidates for the submit dialog
  useEffect(() => {
    if (!showSubmit) return;
    const timer = setTimeout(async () => {
      try {
        const query = new URLSearchParams({ page: "1", limit: "20" });
        if (candidateSearch) query.set("search", candidateSearch);
        const res = await apiFetch<{
          data: CandidateOption[];
          meta: { total: number };
        }>(`/candidates?${query}`);
        setCandidates(res.data);
      } catch (err) {
        console.error("[PipelinePage] Failed to search candidates:", err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [candidateSearch, showSubmit]);

  /* ─── Drag & Drop ─── */

  const handleDragStart = (submissionId: string, fromStageId: string) => {
    dragItem.current = { submissionId, fromStageId };
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    setDragOverStage(null);

    if (!dragItem.current || !kanban) return;
    const { submissionId, fromStageId } = dragItem.current;
    dragItem.current = null;

    if (fromStageId === targetStageId) return;

    // Optimistic update
    setKanban((prev) => {
      if (!prev) return prev;
      const stages = prev.stages.map((stage) => ({
        ...stage,
        submissions: [...stage.submissions],
      }));

      const fromStage = stages.find((s) => s.id === fromStageId);
      const toStage = stages.find((s) => s.id === targetStageId);
      if (!fromStage || !toStage) return prev;

      const subIdx = fromStage.submissions.findIndex((s) => s.id === submissionId);
      if (subIdx === -1) return prev;

      const [moved] = fromStage.submissions.splice(subIdx, 1);
      moved.currentStage = { id: toStage.id, name: toStage.name };
      toStage.submissions.unshift(moved);

      return { ...prev, stages };
    });

    // API call
    try {
      await apiFetch(`/submissions/${submissionId}/stage`, {
        method: "PATCH",
        body: JSON.stringify({ stageId: targetStageId }),
      });
    } catch (err) {
      console.error("[PipelinePage] Move stage failed:", err);
      // Revert on failure
      loadKanban(selectedJobId);
    }
  };

  /* ─── Submit Candidate ─── */

  const handleSubmitCandidate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCandidate || !selectedJobId) return;
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      await apiFetch("/submissions", {
        method: "POST",
        body: JSON.stringify({
          candidateId: selectedCandidate,
          jobId: selectedJobId,
          notes: form.get("notes") || undefined,
          payRate: form.get("payRate") ? Number(form.get("payRate")) : undefined,
          billRate: form.get("billRate") ? Number(form.get("billRate")) : undefined,
        }),
      });
      setShowSubmit(false);
      setSelectedCandidate("");
      setCandidateSearch("");
      loadKanban(selectedJobId);
    } catch (err) {
      console.error("[PipelinePage] Submit candidate failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Render ─── */

  if (!can("pipeline:read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          You don&apos;t have permission to access this page.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pipeline</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track candidates through the hiring stages.
          </p>
        </div>
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border">
          <p className="text-sm text-muted-foreground">
            No jobs with submissions yet. Submit a candidate to a job to see the
            pipeline.
          </p>
        </div>
      </div>
    );
  }

  const totalSubmissions =
    kanban?.stages.reduce((acc, s) => acc + s.submissions.length, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pipeline</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track candidates through the hiring stages.
            {kanban && (
              <span className="ml-2 font-medium text-foreground">
                {totalSubmissions} submission{totalSubmissions !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Job selector */}
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="Select a job..." />
            </SelectTrigger>
            <SelectContent>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title} — {job.client.name} ({job._count.submissions})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {can("import-export:read") && <ExportDropdown entity="submissions" />}

          {/* Submit candidate button */}
          <Button onClick={() => setShowSubmit(true)}>
            <UserPlus className="h-4 w-4" />
            Submit Candidate
          </Button>
        </div>
      </div>

      {/* Kanban board */}
      {kanbanLoading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : kanban ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanban.stages.map((stage) => {
            const colors = getStageColors(stage.color);
            const isOver = dragOverStage === stage.id;

            return (
              <div key={stage.id} className="flex w-[280px] shrink-0 flex-col">
                {/* Column header */}
                <div
                  className={`flex items-center gap-2 rounded-t-lg px-3 py-2.5 ${colors.bg}`}
                >
                  <div className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                  <span className="text-sm font-semibold text-foreground">
                    {stage.name}
                  </span>
                  {stage.isTerminal && (
                    <Badge variant="outline" className="ml-1 text-[10px]">
                      Final
                    </Badge>
                  )}
                  <span className="ml-auto rounded-full bg-white/80 dark:bg-white/10 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {stage.submissions.length}
                  </span>
                </div>

                {/* Drop zone */}
                <div
                  className={`flex flex-1 flex-col gap-2 rounded-b-lg border border-t-0 p-2 transition-colors ${
                    isOver
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/30"
                  }`}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  {stage.submissions.length === 0 && (
                    <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-border">
                      <p className="text-xs text-muted-foreground">
                        Drop here
                      </p>
                    </div>
                  )}
                  {stage.submissions.map((sub) => (
                    <Card
                      key={sub.id}
                      draggable
                      onDragStart={() => handleDragStart(sub.id, stage.id)}
                      className="cursor-grab transition-shadow hover:shadow-md active:cursor-grabbing"
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {sub.candidate.firstName} {sub.candidate.lastName}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {sub.candidate.title ?? "No title"}
                            </p>
                          </div>
                          <GripVertical className="ml-1 h-4 w-4 shrink-0 text-muted-foreground/40" />
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <Badge
                            className={
                              statusColors[sub.status] ?? ""
                            }
                            variant="outline"
                          >
                            {sub.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(sub.submittedAt).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )}
                          </span>
                        </div>
                        {sub.notes && (
                          <p className="mt-1.5 line-clamp-2 text-[11px] text-muted-foreground">
                            {sub.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Submit Candidate Dialog */}
      <Dialog open={showSubmit} onOpenChange={setShowSubmit}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit Candidate to Job</DialogTitle>
            <DialogDescription>
              Submit a candidate to{" "}
              <span className="font-medium">{kanban?.job.title ?? "this job"}</span>.
              They will be placed in the first pipeline stage.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCandidate}>
            <div className="grid gap-4 py-4">
              {/* Candidate search */}
              <div className="space-y-2">
                <Label>Candidate *</Label>
                <Input
                  placeholder="Search candidates by name or email..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                />
                {candidates.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-md border border-border">
                    {candidates.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCandidate(c.id);
                          setCandidateSearch(
                            `${c.firstName} ${c.lastName}`,
                          );
                          setCandidates([]);
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted ${
                          selectedCandidate === c.id ? "bg-muted" : ""
                        }`}
                      >
                        <div>
                          <p className="font-medium">
                            {c.firstName} {c.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {c.email ?? c.title ?? ""}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedCandidate && (
                  <p className="text-xs text-emerald-600">
                    Candidate selected
                  </p>
                )}
              </div>

              {/* Rates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payRate">Pay Rate</Label>
                  <Input
                    id="payRate"
                    name="payRate"
                    type="number"
                    step="0.01"
                    placeholder="$/hr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billRate">Bill Rate</Label>
                  <Input
                    id="billRate"
                    name="billRate"
                    type="number"
                    step="0.01"
                    placeholder="$/hr"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Optional submission notes..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSubmit(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !selectedCandidate}
              >
                {submitting ? "Submitting..." : "Submit Candidate"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
