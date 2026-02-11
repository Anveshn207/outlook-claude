"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  Linkedin,
  Clock,
  Send,
  Calendar,
  Loader2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

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
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PASSIVE: "bg-amber-100 text-amber-700 border-amber-200",
  PLACED: "bg-blue-100 text-blue-700 border-blue-200",
  DND: "bg-red-100 text-red-700 border-red-200",
};

const submissionStatusColors: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700 border-blue-200",
  SHORTLISTED: "bg-indigo-100 text-indigo-700 border-indigo-200",
  INTERVIEW: "bg-amber-100 text-amber-700 border-amber-200",
  OFFERED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PLACED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  WITHDRAWN: "bg-gray-100 text-gray-600 border-gray-200",
};

const interviewTypeLabels: Record<string, string> = {
  PHONE_SCREEN: "Phone Screen",
  TECHNICAL: "Technical",
  ONSITE: "Onsite",
  PANEL: "Panel",
  FINAL: "Final",
};

const interviewStatusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700 border-blue-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
  NO_SHOW: "bg-red-100 text-red-700 border-red-200",
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

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {candidate.firstName} {candidate.lastName}
              </h2>
              <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
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
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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
        {candidate.linkedinUrl && (
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

          {/* Resumes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Resumes</CardTitle>
            </CardHeader>
            <CardContent>
              {candidate.resumes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No resumes uploaded yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {candidate.resumes.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {r.fileName}
                        </span>
                        {r.isPrimary && (
                          <Badge variant="secondary" className="text-xs">
                            Primary
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {(r.fileSize / 1024).toFixed(0)} KB
                      </span>
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
          <CardContent className="p-0">
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
          <CardContent className="p-0">
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
