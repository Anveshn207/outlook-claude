"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Flame,
  Layers,
  Loader2,
  MapPin,
  Phone,
  Mail,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, Column } from "@/components/shared/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { useCustomFields } from "@/hooks/use-custom-fields";
import { CustomFieldDisplay } from "@/components/shared/custom-field-display";

// --- Types ---

interface JobDetail {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  location: string | null;
  jobType: string;
  status: string;
  positionsCount: number;
  billRate: string | null;
  payRate: string | null;
  priority: string;
  skillsRequired: string[];
  customData: Record<string, unknown> | null;
  client: { id: string; name: string };
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    title: string | null;
  } | null;
  pipelineTemplate: {
    id: string;
    name: string;
    stages: { id: string; name: string; order: number }[];
  } | null;
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
  _count: { submissions: number };
}

interface SubmissionRow {
  id: string;
  status: string;
  submittedAt: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
  };
  currentStage: string | null;
}

// --- Constants ---

const statusColors: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800",
  ON_HOLD: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  FILLED: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
};

const priorityColors: Record<string, string> = {
  HOT: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  NORMAL: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  LOW: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800",
};

const jobTypeLabels: Record<string, string> = {
  FULLTIME: "Full-Time",
  CONTRACT: "Contract",
  C2H: "Contract-to-Hire",
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

// --- Component ---

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRequirements, setEditRequirements] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editJobType, setEditJobType] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editPositionsCount, setEditPositionsCount] = useState("1");
  const [editBillRate, setEditBillRate] = useState("");
  const [editPayRate, setEditPayRate] = useState("");
  const { fields: customFields } = useCustomFields("job");

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<JobDetail>(`/jobs/${params.id}`);
        setJob(data);
        populateEditForm(data);
      } catch (err) {
        console.error("[JobDetail] Load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  function populateEditForm(data: JobDetail) {
    setEditTitle(data.title);
    setEditDescription(data.description ?? "");
    setEditRequirements(data.requirements ?? "");
    setEditLocation(data.location ?? "");
    setEditJobType(data.jobType);
    setEditStatus(data.status);
    setEditPriority(data.priority);
    setEditPositionsCount(String(data.positionsCount));
    setEditBillRate(data.billRate ?? "");
    setEditPayRate(data.payRate ?? "");
  }

  async function handleSave() {
    if (!job) return;
    setSaving(true);
    try {
      const updated = await apiFetch<JobDetail>(`/jobs/${job.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: editTitle,
          description: editDescription || null,
          requirements: editRequirements || null,
          location: editLocation || null,
          jobType: editJobType,
          status: editStatus,
          priority: editPriority,
          positionsCount: Number(editPositionsCount) || 1,
          billRate: editBillRate || null,
          payRate: editPayRate || null,
        }),
      });
      setJob(updated);
      setEditing(false);
    } catch (err) {
      console.error("[JobDetail] Save failed:", err);
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    if (job) populateEditForm(job);
    setEditing(false);
  }

  const fetchSubmissions = useCallback(
    async (fetchParams: {
      page: number;
      limit: number;
      search?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }) => {
      const query = new URLSearchParams();
      query.set("jobId", String(params.id));
      query.set("page", String(fetchParams.page));
      query.set("limit", String(fetchParams.limit));
      if (fetchParams.search) query.set("search", fetchParams.search);
      if (fetchParams.sortBy) query.set("sortBy", fetchParams.sortBy);
      if (fetchParams.sortOrder) query.set("sortOrder", fetchParams.sortOrder);

      const res = await apiFetch<{
        data: SubmissionRow[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>(`/submissions?${query}`);
      return { data: res.data, total: res.meta.total };
    },
    [params.id],
  );

  const submissionColumns: Column<SubmissionRow>[] = [
    {
      key: "candidate",
      header: "Candidate",
      render: (s) => (
        <span className="font-medium text-foreground">
          {s.candidate.firstName} {s.candidate.lastName}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (s) => (
        <Badge
          className={submissionStatusColors[s.status] ?? ""}
          variant="outline"
        >
          {s.status}
        </Badge>
      ),
    },
    {
      key: "currentStage",
      header: "Stage",
      render: (s) => (
        <span className="text-muted-foreground">
          {s.currentStage ?? "-"}
        </span>
      ),
    },
    {
      key: "submittedAt",
      header: "Submitted",
      sortable: true,
      render: (s) => (
        <span className="text-muted-foreground">
          {new Date(s.submittedAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  // --- Loading state ---

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // --- Not found state ---

  if (!job) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <p className="text-muted-foreground">Job not found.</p>
      </div>
    );
  }

  // --- Main render ---

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => router.push("/jobs")}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-foreground">
                {job.title}
              </h2>
              <Badge
                className={statusColors[job.status] ?? ""}
                variant="outline"
              >
                {job.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {job.client.name}
              </span>
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {jobTypeLabels[job.jobType] ?? job.jobType}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Edit className="h-4 w-4" /> Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Job Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  Description
                </p>
                {editing ? (
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={5}
                    placeholder="Job description..."
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm text-foreground">
                    {job.description || "No description provided."}
                  </p>
                )}
              </div>

              {/* Requirements */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  Requirements
                </p>
                {editing ? (
                  <Textarea
                    value={editRequirements}
                    onChange={(e) => setEditRequirements(e.target.value)}
                    rows={5}
                    placeholder="Job requirements..."
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm text-foreground">
                    {job.requirements || "No requirements specified."}
                  </p>
                )}
              </div>

              {/* Inline edit fields */}
              {editing && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="e.g. Remote, New York, NY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={editJobType} onValueChange={setEditJobType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULLTIME">Full-Time</SelectItem>
                        <SelectItem value="CONTRACT">Contract</SelectItem>
                        <SelectItem value="C2H">Contract-to-Hire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="ON_HOLD">On Hold</SelectItem>
                        <SelectItem value="FILLED">Filled</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={editPriority} onValueChange={setEditPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HOT">Hot</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Positions</Label>
                    <Input
                      type="number"
                      min="1"
                      value={editPositionsCount}
                      onChange={(e) => setEditPositionsCount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bill Rate</Label>
                    <Input
                      value={editBillRate}
                      onChange={(e) => setEditBillRate(e.target.value)}
                      placeholder="e.g. 150"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pay Rate</Label>
                    <Input
                      value={editPayRate}
                      onChange={(e) => setEditPayRate(e.target.value)}
                      placeholder="e.g. 120"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Required Skills</CardTitle>
            </CardHeader>
            <CardContent>
              {job.skillsRequired.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {job.skillsRequired.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No skills specified.
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
                      value={job.customData?.[cf.fieldKey]}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right sidebar (1/3) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {/* Status */}
              <DetailRow
                icon={<Layers className="h-4 w-4" />}
                label="Status"
                value={
                  <Badge
                    className={statusColors[job.status] ?? ""}
                    variant="outline"
                  >
                    {job.status.replace("_", " ")}
                  </Badge>
                }
              />

              {/* Priority */}
              <DetailRow
                icon={<Flame className="h-4 w-4" />}
                label="Priority"
                value={
                  <Badge
                    className={priorityColors[job.priority] ?? ""}
                    variant="outline"
                  >
                    {job.priority}
                  </Badge>
                }
              />

              {/* Client */}
              <DetailRow
                icon={<Building2 className="h-4 w-4" />}
                label="Client"
                value={
                  <span className="font-medium">{job.client.name}</span>
                }
              />

              {/* Contact */}
              <div className="space-y-1">
                <DetailRow
                  icon={<User className="h-4 w-4" />}
                  label="Contact"
                  value={
                    job.contact ? (
                      <span className="font-medium">
                        {job.contact.firstName} {job.contact.lastName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )
                  }
                />
                {job.contact && (
                  <div className="ml-8 space-y-0.5 text-xs text-muted-foreground">
                    {job.contact.title && <p>{job.contact.title}</p>}
                    {job.contact.email && (
                      <p className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {job.contact.email}
                      </p>
                    )}
                    {job.contact.phone && (
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {job.contact.phone}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Positions */}
              <DetailRow
                icon={<Users className="h-4 w-4" />}
                label="Positions"
                value={
                  <span className="font-medium">{job.positionsCount}</span>
                }
              />

              {/* Pay Rate */}
              <DetailRow
                icon={<DollarSign className="h-4 w-4" />}
                label="Pay Rate"
                value={
                  <span className="font-medium">
                    {job.payRate ? `$${job.payRate}/hr` : "-"}
                  </span>
                }
              />

              {/* Bill Rate */}
              <DetailRow
                icon={<DollarSign className="h-4 w-4" />}
                label="Bill Rate"
                value={
                  <span className="font-medium">
                    {job.billRate ? `$${job.billRate}/hr` : "-"}
                  </span>
                }
              />

              {/* Pipeline Template */}
              <DetailRow
                icon={<Layers className="h-4 w-4" />}
                label="Pipeline"
                value={
                  job.pipelineTemplate ? (
                    <span className="font-medium">
                      {job.pipelineTemplate.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )
                }
              />

              {/* Pipeline Stages */}
              {job.pipelineTemplate &&
                job.pipelineTemplate.stages.length > 0 && (
                  <div className="ml-8">
                    <div className="flex flex-wrap gap-1">
                      {job.pipelineTemplate.stages
                        .sort((a, b) => a.order - b.order)
                        .map((stage) => (
                          <Badge
                            key={stage.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {stage.name}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}

              {/* Created */}
              <DetailRow
                icon={<Calendar className="h-4 w-4" />}
                label="Created"
                value={
                  <span className="font-medium">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                }
              />

              {/* Created By */}
              <DetailRow
                icon={<Clock className="h-4 w-4" />}
                label="Created By"
                value={
                  <span className="font-medium">
                    {job.createdBy.firstName} {job.createdBy.lastName}
                  </span>
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submissions section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Submissions
            {job._count.submissions > 0 && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                {job._count.submissions}
              </span>
            )}
          </h3>
        </div>

        <DataTable
          columns={submissionColumns}
          fetchData={fetchSubmissions}
          searchPlaceholder="Search submissions..."
          keyExtractor={(s) => s.id}
          emptyMessage="No submissions yet."
          pageSize={10}
          onRowClick={(s) => router.push(`/candidates/${s.candidate.id}`)}
        />
      </div>
    </div>
  );
}

// --- Helper Components ---

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <div>{value}</div>
    </div>
  );
}
