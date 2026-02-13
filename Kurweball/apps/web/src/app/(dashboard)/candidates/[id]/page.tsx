"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  Linkedin,
  Send,
  Calendar,
  Loader2,
  User,
  Upload,
  FileText,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useCustomFields } from "@/hooks/use-custom-fields";
import { CustomFieldDisplay } from "@/components/shared/custom-field-display";

interface CandidateDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  source: string;
  status: string;
  title: string | null;
  currentEmployer: string | null;
  location: string | null;
  visaStatus: string | null;
  linkedinUrl: string | null;
  rate: string | null;
  rateType: string | null;
  availability: string | null;
  skills: string[];
  tags: string[];
  createdAt: string;
  createdBy: { id: string; firstName: string; lastName: string };
  customData: Record<string, unknown> | null;
  submissions: SubmissionRow[];
  resumes: ResumeRow[];
}

interface SubmissionRow {
  id: string;
  status: string;
  submittedAt: string;
  job: { id: string; title: string };
}

interface ResumeRow {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  isPrimary: boolean;
}

interface InterviewRow {
  id: string;
  type: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  interviewerName: string | null;
  job: { id: string; title: string };
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  PASSIVE: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  PLACED: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  DND: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

const submissionStatusColors: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  SHORTLISTED: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
  INTERVIEW: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  OFFERED: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  PLACED: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  REJECTED: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  WITHDRAWN: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800",
};

const interviewTypeLabels: Record<string, string> = {
  PHONE_SCREEN: "Phone Screen",
  TECHNICAL: "Technical",
  ONSITE: "Onsite",
  PANEL: "Panel",
  FINAL: "Final",
};

const interviewStatusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800",
  NO_SHOW: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "submissions", label: "Submissions" },
  { id: "interviews", label: "Interviews" },
];

export default function CandidateProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fields: customFields } = useCustomFields("candidate");

  useEffect(() => {
    async function load() {
      try {
        const [c, interviewRes] = await Promise.all([
          apiFetch<CandidateDetail>(`/candidates/${params.id}`),
          apiFetch<{ data: InterviewRow[] }>(
            `/interviews?candidateId=${params.id}&limit=50`,
          ).catch(() => ({ data: [] as InterviewRow[] })),
        ]);
        setCandidate(c);
        setInterviews(interviewRes.data);
      } catch (err) {
        console.error("[CandidateProfile] Load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  const reloadResumes = useCallback(async () => {
    try {
      const resumes = await apiFetch<ResumeRow[]>(
        `/resumes/candidate/${params.id}`,
      );
      setCandidate((prev) => (prev ? { ...prev, resumes } : prev));
    } catch (err) {
      console.error("[CandidateProfile] Reload resumes failed:", err);
    }
  }, [params.id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !params.id) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "/api"}/resumes/upload/${params.id}`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        },
      );
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      await reloadResumes();
    } catch (err) {
      console.error("[CandidateProfile] Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    try {
      await apiFetch(`/resumes/${resumeId}`, { method: "DELETE" });
      await reloadResumes();
    } catch (err) {
      console.error("[CandidateProfile] Delete resume failed:", err);
    }
  };

  const handleSetPrimary = async (resumeId: string) => {
    try {
      await apiFetch(`/resumes/${resumeId}/primary`, { method: "PATCH" });
      await reloadResumes();
    } catch (err) {
      console.error("[CandidateProfile] Set primary failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <p className="text-muted-foreground">Candidate not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => router.push("/candidates")}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Candidates
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {candidate.firstName} {candidate.lastName}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {candidate.title && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {candidate.title}
                  </span>
                )}
                {candidate.currentEmployer && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {candidate.currentEmployer}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Badge
            className={statusColors[candidate.status] ?? ""}
            variant="outline"
          >
            {candidate.status}
          </Badge>
        </div>
      </div>

      {/* Contact info bar */}
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground sm:gap-4">
        {candidate.email && (
          <span className="flex items-center gap-1.5">
            <Mail className="h-4 w-4" /> {candidate.email}
          </span>
        )}
        {candidate.phone && (
          <span className="flex items-center gap-1.5">
            <Phone className="h-4 w-4" /> {candidate.phone}
          </span>
        )}
        {candidate.location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" /> {candidate.location}
          </span>
        )}
        {candidate.linkedinUrl && /^https?:\/\//i.test(candidate.linkedinUrl) && (
          <a
            href={candidate.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-primary hover:underline"
          >
            <Linkedin className="h-4 w-4" /> LinkedIn
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {tab.label}
              {tab.id === "submissions" && candidate.submissions.length > 0 && (
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                  {candidate.submissions.length}
                </span>
              )}
              {tab.id === "interviews" && interviews.length > 0 && (
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                  {interviews.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Details card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DetailRow label="Source" value={candidate.source} />
              <DetailRow
                label="Visa Status"
                value={candidate.visaStatus ?? "-"}
              />
              <DetailRow
                label="Rate"
                value={
                  candidate.rate
                    ? `$${candidate.rate}/${candidate.rateType === "HOURLY" ? "hr" : "yr"}`
                    : "-"
                }
              />
              <DetailRow
                label="Availability"
                value={candidate.availability ?? "-"}
              />
              <DetailRow
                label="Added"
                value={new Date(candidate.createdAt).toLocaleDateString()}
              />
              <DetailRow
                label="Added By"
                value={`${candidate.createdBy.firstName} ${candidate.createdBy.lastName}`}
              />
            </CardContent>
          </Card>

          {/* Skills & Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Skills & Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {candidate.skills.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                    Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {candidate.tags.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {candidate.skills.length === 0 &&
                candidate.tags.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No skills or tags added yet.
                  </p>
                )}
            </CardContent>
          </Card>

          {/* Custom Fields */}
          {customFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Custom Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {customFields.map((cf) => (
                  <div key={cf.id} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{cf.fieldName}</span>
                    <CustomFieldDisplay
                      field={cf}
                      value={candidate.customData?.[cf.fieldKey]}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Resumes */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Resumes</CardTitle>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.rtf"
                  className="hidden"
                  onChange={handleUpload}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? "Uploading..." : "Upload Resume"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {candidate.resumes.length === 0 ? (
                <div className="flex h-24 flex-col items-center justify-center rounded-lg border border-dashed border-border">
                  <FileText className="mb-2 h-6 w-6 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No resumes uploaded yet. Upload a PDF, DOC, or DOCX file.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {candidate.resumes.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-sm font-medium">
                            {r.fileName}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {(r.fileSize / 1024).toFixed(0)} KB
                          </span>
                        </div>
                        {r.isPrimary && (
                          <Badge
                            variant="secondary"
                            className="text-xs"
                          >
                            <Star className="mr-1 h-3 w-3" /> Primary
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!r.isPrimary && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-muted-foreground"
                            onClick={() => handleSetPrimary(r.id)}
                            title="Set as primary"
                          >
                            <Star className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => handleDeleteResume(r.id)}
                          title="Delete resume"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "submissions" && (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            {candidate.submissions.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                No submissions yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Job
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {candidate.submissions.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Send className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{s.job.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            submissionStatusColors[s.status] ?? ""
                          }
                          variant="outline"
                        >
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(s.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "interviews" && (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            {interviews.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                No interviews scheduled.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Job
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Scheduled
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Interviewer
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.map((iv) => (
                    <tr
                      key={iv.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{iv.job.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {interviewTypeLabels[iv.type] ?? iv.type}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(iv.scheduledAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {iv.interviewerName ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            interviewStatusColors[iv.status] ?? ""
                          }
                          variant="outline"
                        >
                          {iv.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
