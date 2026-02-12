"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, CalendarDays, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, Column } from "@/components/shared/data-table";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

interface InterviewRow {
  id: string;
  type: string;
  scheduledAt: string;
  durationMinutes: number;
  location: string | null;
  meetingLink: string | null;
  status: string;
  feedback: string | null;
  rating: number | null;
  interviewerName: string | null;
  interviewerEmail: string | null;
  candidate: { id: string; firstName: string; lastName: string };
  job: { id: string; title: string };
  submission: { id: string; status: string } | null;
  createdAt: string;
}

interface CandidateOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface JobOption {
  id: string;
  title: string;
}

const typeColors: Record<string, string> = {
  PHONE_SCREEN: "bg-gray-100 text-gray-700 border-gray-200",
  TECHNICAL: "bg-blue-100 text-blue-700 border-blue-200",
  ONSITE: "bg-amber-100 text-amber-700 border-amber-200",
  PANEL: "bg-purple-100 text-purple-700 border-purple-200",
  FINAL: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700 border-blue-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
  NO_SHOW: "bg-red-100 text-red-700 border-red-200",
};

const typeLabels: Record<string, string> = {
  PHONE_SCREEN: "Phone Screen",
  TECHNICAL: "Technical",
  ONSITE: "On-site",
  PANEL: "Panel",
  FINAL: "Final",
};

const statusLabels: Record<string, string> = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
};

export default function InterviewsPage() {
  const { user: _user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Feedback dialog state
  const [feedbackInterview, setFeedbackInterview] =
    useState<InterviewRow | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState("COMPLETED");
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Create dialog - candidate search state
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateResults, setCandidateResults] = useState<CandidateOption[]>(
    [],
  );
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateOption | null>(null);
  const [showCandidateDropdown, setShowCandidateDropdown] = useState(false);
  const candidateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Create dialog - job search state
  const [jobSearch, setJobSearch] = useState("");
  const [jobResults, setJobResults] = useState<JobOption[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobOption | null>(null);
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const jobDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Candidate search effect
  useEffect(() => {
    if (candidateDebounceRef.current)
      clearTimeout(candidateDebounceRef.current);
    if (!candidateSearch.trim()) {
      setCandidateResults([]);
      setShowCandidateDropdown(false);
      return;
    }
    candidateDebounceRef.current = setTimeout(async () => {
      try {
        const res = await apiFetch<{
          data: CandidateOption[];
          meta: { total: number };
        }>(
          `/candidates?page=1&limit=10&search=${encodeURIComponent(candidateSearch)}`,
        );
        setCandidateResults(res.data);
        setShowCandidateDropdown(true);
      } catch (err) {
        console.error("[InterviewsPage] Candidate search failed:", err);
      }
    }, 300);
    return () => {
      if (candidateDebounceRef.current)
        clearTimeout(candidateDebounceRef.current);
    };
  }, [candidateSearch]);

  // Job search effect
  useEffect(() => {
    if (jobDebounceRef.current) clearTimeout(jobDebounceRef.current);
    if (!jobSearch.trim()) {
      setJobResults([]);
      setShowJobDropdown(false);
      return;
    }
    jobDebounceRef.current = setTimeout(async () => {
      try {
        const res = await apiFetch<{
          data: JobOption[];
          meta: { total: number };
        }>(`/jobs?page=1&limit=10&search=${encodeURIComponent(jobSearch)}`);
        setJobResults(res.data);
        setShowJobDropdown(true);
      } catch (err) {
        console.error("[InterviewsPage] Job search failed:", err);
      }
    }, 300);
    return () => {
      if (jobDebounceRef.current) clearTimeout(jobDebounceRef.current);
    };
  }, [jobSearch]);

  const fetchInterviews = useCallback(
    async (params: {
      page: number;
      limit: number;
      search?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }) => {
      const query = new URLSearchParams();
      query.set("page", String(params.page));
      query.set("limit", String(params.limit));
      if (params.sortBy) query.set("sortBy", params.sortBy);
      if (params.sortOrder) query.set("sortOrder", params.sortOrder);
      if (statusFilter && statusFilter !== "all")
        query.set("status", statusFilter);
      if (typeFilter && typeFilter !== "all") query.set("type", typeFilter);

      const res = await apiFetch<{
        data: InterviewRow[];
        meta: { total: number };
      }>(`/interviews?${query}`);
      return { data: res.data, total: res.meta.total };
    },
    [statusFilter, typeFilter],
  );

  const resetCreateForm = () => {
    setCandidateSearch("");
    setCandidateResults([]);
    setSelectedCandidate(null);
    setShowCandidateDropdown(false);
    setJobSearch("");
    setJobResults([]);
    setSelectedJob(null);
    setShowJobDropdown(false);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCandidate || !selectedJob) return;
    setCreating(true);
    const form = new FormData(e.currentTarget);
    try {
      await apiFetch("/interviews", {
        method: "POST",
        body: JSON.stringify({
          candidateId: selectedCandidate.id,
          jobId: selectedJob.id,
          type: form.get("type"),
          scheduledAt: form.get("scheduledAt")
            ? new Date(form.get("scheduledAt") as string).toISOString()
            : undefined,
          durationMinutes: Number(form.get("durationMinutes")) || 60,
          interviewerName: form.get("interviewerName") || undefined,
          interviewerEmail: form.get("interviewerEmail") || undefined,
          location: form.get("location") || undefined,
          meetingLink: form.get("meetingLink") || undefined,
        }),
      });
      setShowCreate(false);
      resetCreateForm();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("[InterviewsPage] Create failed:", err);
    } finally {
      setCreating(false);
    }
  };

  const openFeedbackDialog = (interview: InterviewRow) => {
    setFeedbackInterview(interview);
    setFeedbackStatus(interview.status === "SCHEDULED" ? "COMPLETED" : interview.status);
    setFeedbackRating(interview.rating ?? 0);
    setFeedbackText(interview.feedback ?? "");
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackInterview) return;
    setSubmittingFeedback(true);
    try {
      await apiFetch(`/interviews/${feedbackInterview.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: feedbackStatus,
          rating: feedbackRating > 0 ? feedbackRating : undefined,
          feedback: feedbackText || undefined,
        }),
      });
      setFeedbackInterview(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("[InterviewsPage] Feedback submit failed:", err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const columns: Column<InterviewRow>[] = [
    {
      key: "candidate",
      header: "Candidate",
      render: (row) => (
        <span className="font-medium text-foreground">
          {row.candidate.firstName} {row.candidate.lastName}
        </span>
      ),
    },
    {
      key: "job",
      header: "Job Title",
      render: (row) => (
        <span className="text-muted-foreground">{row.job.title}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (row) => (
        <Badge className={typeColors[row.type] ?? ""} variant="outline">
          {typeLabels[row.type] ?? row.type}
        </Badge>
      ),
    },
    {
      key: "scheduledAt",
      header: "Scheduled At",
      sortable: true,
      render: (row) => {
        const d = new Date(row.scheduledAt);
        return (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            {d.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            {d.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        );
      },
    },
    {
      key: "durationMinutes",
      header: "Duration",
      render: (row) => (
        <span className="text-muted-foreground">{row.durationMinutes} min</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => (
        <Badge className={statusColors[row.status] ?? ""} variant="outline">
          {statusLabels[row.status] ?? row.status}
        </Badge>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      render: (row) => {
        if (row.status !== "COMPLETED" || row.rating == null) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`h-3.5 w-3.5 ${
                  n <= row.rating!
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      render: (row) =>
        row.status === "SCHEDULED" ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-blue-600 hover:text-blue-700"
            onClick={(e) => {
              e.stopPropagation();
              openFeedbackDialog(row);
            }}
          >
            <MessageSquare className="mr-1 h-3.5 w-3.5" />
            Feedback
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Interviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule and manage candidate interviews.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Schedule Interview
        </Button>
      </div>

      {/* DataTable */}
      <DataTable
        key={refreshKey}
        columns={columns}
        fetchData={fetchInterviews}
        searchPlaceholder="Search interviews..."
        keyExtractor={(row) => row.id}
        emptyMessage="No interviews found. Schedule your first interview to get started."
        toolbar={
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="NO_SHOW">No Show</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PHONE_SCREEN">Phone Screen</SelectItem>
                <SelectItem value="TECHNICAL">Technical</SelectItem>
                <SelectItem value="ONSITE">On-site</SelectItem>
                <SelectItem value="PANEL">Panel</SelectItem>
                <SelectItem value="FINAL">Final</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Schedule Interview Dialog */}
      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              Schedule a new interview with a candidate.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              {/* Candidate Search */}
              <div className="space-y-2">
                <Label>Candidate *</Label>
                {selectedCandidate ? (
                  <div className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm">
                    <span className="flex-1">
                      {selectedCandidate.firstName} {selectedCandidate.lastName}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-xs text-muted-foreground"
                      onClick={() => {
                        setSelectedCandidate(null);
                        setCandidateSearch("");
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      placeholder="Search candidates..."
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      onFocus={() => {
                        if (candidateResults.length > 0)
                          setShowCandidateDropdown(true);
                      }}
                      onBlur={() =>
                        setTimeout(() => setShowCandidateDropdown(false), 200)
                      }
                    />
                    {showCandidateDropdown && candidateResults.length > 0 && (
                      <div className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
                        {candidateResults.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSelectedCandidate(c);
                              setCandidateSearch("");
                              setShowCandidateDropdown(false);
                            }}
                          >
                            {c.firstName} {c.lastName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Job Search */}
              <div className="space-y-2">
                <Label>Job *</Label>
                {selectedJob ? (
                  <div className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm">
                    <span className="flex-1">{selectedJob.title}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-xs text-muted-foreground"
                      onClick={() => {
                        setSelectedJob(null);
                        setJobSearch("");
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      placeholder="Search jobs..."
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      onFocus={() => {
                        if (jobResults.length > 0) setShowJobDropdown(true);
                      }}
                      onBlur={() =>
                        setTimeout(() => setShowJobDropdown(false), 200)
                      }
                    />
                    {showJobDropdown && jobResults.length > 0 && (
                      <div className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
                        {jobResults.map((j) => (
                          <button
                            key={j.id}
                            type="button"
                            className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSelectedJob(j);
                              setJobSearch("");
                              setShowJobDropdown(false);
                            }}
                          >
                            {j.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Type + DateTime */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <select
                    id="type"
                    name="type"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  >
                    <option value="PHONE_SCREEN">Phone Screen</option>
                    <option value="TECHNICAL">Technical</option>
                    <option value="ONSITE">On-site</option>
                    <option value="PANEL">Panel</option>
                    <option value="FINAL">Final</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Date & Time *</Label>
                  <Input
                    id="scheduledAt"
                    name="scheduledAt"
                    type="datetime-local"
                    required
                  />
                </div>
              </div>

              {/* Duration + Interviewer Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">Duration (min)</Label>
                  <Input
                    id="durationMinutes"
                    name="durationMinutes"
                    type="number"
                    defaultValue={60}
                    min={15}
                    max={480}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interviewerName">Interviewer Name</Label>
                  <Input id="interviewerName" name="interviewerName" />
                </div>
              </div>

              {/* Interviewer Email + Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interviewerEmail">Interviewer Email</Label>
                  <Input
                    id="interviewerEmail"
                    name="interviewerEmail"
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" />
                </div>
              </div>

              {/* Meeting Link */}
              <div className="space-y-2">
                <Label htmlFor="meetingLink">Meeting Link</Label>
                <Input
                  id="meetingLink"
                  name="meetingLink"
                  type="url"
                  placeholder="https://..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreate(false);
                  resetCreateForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating || !selectedCandidate || !selectedJob}
              >
                {creating ? "Scheduling..." : "Schedule Interview"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog
        open={!!feedbackInterview}
        onOpenChange={(open) => {
          if (!open) setFeedbackInterview(null);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Interview Feedback</DialogTitle>
            <DialogDescription>
              {feedbackInterview && (
                <>
                  {feedbackInterview.candidate.firstName}{" "}
                  {feedbackInterview.candidate.lastName} &mdash;{" "}
                  {feedbackInterview.job.title}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={feedbackStatus} onValueChange={setFeedbackStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="NO_SHOW">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Star Rating */}
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="rounded p-0.5 hover:scale-110 transition-transform"
                    onClick={() =>
                      setFeedbackRating(feedbackRating === n ? 0 : n)
                    }
                  >
                    <Star
                      className={`h-6 w-6 ${
                        n <= feedbackRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300 hover:text-amber-200"
                      }`}
                    />
                  </button>
                ))}
                {feedbackRating > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    {feedbackRating}/5
                  </span>
                )}
              </div>
            </div>

            {/* Feedback Text */}
            <div className="space-y-2">
              <Label htmlFor="feedbackText">Feedback</Label>
              <Textarea
                id="feedbackText"
                rows={4}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="How did the interview go? Share your observations..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFeedbackInterview(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFeedbackSubmit}
              disabled={submittingFeedback}
            >
              {submittingFeedback ? "Saving..." : "Save Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
