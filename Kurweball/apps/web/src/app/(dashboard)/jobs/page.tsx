"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, Trash2 } from "lucide-react";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { ImportDialog } from "@/components/shared/import-dialog";
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
import { CustomFieldInput } from "@/components/shared/custom-field-input";
import { CustomFieldDisplay } from "@/components/shared/custom-field-display";
import { useCustomFields } from "@/hooks/use-custom-fields";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

interface Job {
  id: string;
  title: string;
  status: string;
  jobType: string;
  priority: string;
  location: string | null;
  positionsCount: number;
  customData?: Record<string, unknown>;
  client: { id: string; name: string };
  _count: { submissions: number };
}

interface ClientOption {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ON_HOLD: "bg-amber-100 text-amber-700 border-amber-200",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
  FILLED: "bg-blue-100 text-blue-700 border-blue-200",
};

const priorityColors: Record<string, string> = {
  HOT: "bg-red-100 text-red-700 border-red-200",
  NORMAL: "bg-blue-100 text-blue-700 border-blue-200",
  LOW: "bg-gray-100 text-gray-600 border-gray-200",
};

const jobTypeLabels: Record<string, string> = {
  FULLTIME: "Full-Time",
  CONTRACT: "Contract",
  C2H: "Contract-to-Hire",
};

export default function JobsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [customValues, setCustomValues] = useState<Record<string, unknown>>({});
  const { fields: customFields } = useCustomFields("job");
  const [showImport, setShowImport] = useState(false);
  const { can } = usePermissions();
  const toast = useToast((s) => s.toast);
  const [clients, setClients] = useState<ClientOption[]>([]);

  useEffect(() => {
    apiFetch<{ data: ClientOption[] }>("/clients?limit=100")
      .then((res) => setClients(res.data))
      .catch((err) => console.error("[JobsPage] Failed to load clients:", err));
  }, []);

  const fetchJobs = useCallback(
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
      if (params.search) query.set("search", params.search);
      if (params.sortBy) query.set("sortBy", params.sortBy);
      if (params.sortOrder) query.set("sortOrder", params.sortOrder);
      if (statusFilter && statusFilter !== "all")
        query.set("status", statusFilter);

      const res = await apiFetch<{ data: Job[]; meta: { total: number } }>(
        `/jobs?${query}`,
      );
      return { data: res.data, total: res.meta.total };
    },
    [statusFilter],
  );

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    const form = new FormData(e.currentTarget);
    try {
      const customData: Record<string, unknown> = {};
      customFields.forEach((cf) => {
        const val = customValues[cf.fieldKey];
        if (val !== undefined && val !== null && val !== "") {
          customData[cf.fieldKey] = val;
        }
      });
      await apiFetch("/jobs", {
        method: "POST",
        body: JSON.stringify({
          title: form.get("title"),
          clientId: form.get("clientId"),
          description: form.get("description") || undefined,
          location: form.get("location") || undefined,
          jobType: form.get("jobType") || undefined,
          priority: form.get("priority") || undefined,
          positionsCount: Number(form.get("positionsCount")) || 1,
          ...(Object.keys(customData).length > 0 && { customData }),
        }),
      });
      setShowCreate(false);
      setCustomValues({});
      setRefreshKey((k) => k + 1);
      toast({ title: "Job created successfully", variant: "success" });
    } catch (err) {
      console.error("[JobsPage] Create failed:", err);
      toast({
        title: "Failed to create job",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setCreating(false);
    }
  };

  const columns: Column<Job>[] = useMemo(() => {
    const base: Column<Job>[] = [
      {
        key: "title",
        header: "Title",
        sortable: true,
        render: (j) => (
          <span className="font-medium text-foreground">{j.title}</span>
        ),
      },
      {
        key: "client",
        header: "Client",
        render: (j) => (
          <span className="text-muted-foreground">{j.client.name}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (j) => (
          <Badge className={statusColors[j.status] ?? ""} variant="outline">
            {j.status.replace("_", " ")}
          </Badge>
        ),
      },
      {
        key: "jobType",
        header: "Type",
        render: (j) => (
          <span className="text-muted-foreground">
            {jobTypeLabels[j.jobType] ?? j.jobType}
          </span>
        ),
      },
      {
        key: "priority",
        header: "Priority",
        sortable: true,
        render: (j) => (
          <Badge className={priorityColors[j.priority] ?? ""} variant="outline">
            {j.priority}
          </Badge>
        ),
      },
      {
        key: "location",
        header: "Location",
        hideOnMobile: true,
        render: (j) => (
          <span className="text-muted-foreground">{j.location ?? "-"}</span>
        ),
      },
      {
        key: "positionsCount",
        header: "Positions",
        className: "text-right",
        render: (j) => (
          <span className="font-medium text-foreground">{j.positionsCount}</span>
        ),
      },
      {
        key: "submissions",
        header: "Submissions",
        className: "text-right",
        render: (j) => (
          <span className="font-medium text-foreground">
            {j._count.submissions}
          </span>
        ),
      },
    ];

    const dynamicCols: Column<Job>[] = customFields
      .filter((cf) => cf.isVisibleInList)
      .map((cf) => ({
        key: `cf_${cf.fieldKey}`,
        header: cf.fieldName,
        render: (j: Job) => (
          <CustomFieldDisplay field={cf} value={j.customData?.[cf.fieldKey]} />
        ),
      }));

    return [...base, ...dynamicCols];
  }, [customFields]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Jobs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track open positions and manage job requisitions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {can("import-export:read") && <ExportDropdown entity="jobs" />}
          {can("import-export:create") && (
            <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
              <Upload className="h-4 w-4" />
              Import
            </Button>
          )}
          {can("jobs:create") && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Add Job
            </Button>
          )}
        </div>
      </div>

      <DataTable
        key={refreshKey}
        columns={columns}
        fetchData={fetchJobs}
        searchPlaceholder="Search jobs..."
        keyExtractor={(j) => j.id}
        onRowClick={(j) => router.push(`/jobs/${j.id}`)}
        emptyMessage="No jobs found. Create your first job to get started."
        selectable={can("jobs:update")}
        bulkActions={[
          {
            label: "Set Open",
            onClick: async (ids) => {
              await apiFetch("/jobs/bulk-status", {
                method: "PATCH",
                body: JSON.stringify({ ids, status: "OPEN" }),
              });
              toast({ title: `${ids.length} job(s) set to Open`, variant: "success" });
            },
          },
          {
            label: "Set On Hold",
            onClick: async (ids) => {
              await apiFetch("/jobs/bulk-status", {
                method: "PATCH",
                body: JSON.stringify({ ids, status: "ON_HOLD" }),
              });
              toast({ title: `${ids.length} job(s) set to On Hold`, variant: "success" });
            },
          },
          {
            label: "Set Closed",
            onClick: async (ids) => {
              await apiFetch("/jobs/bulk-status", {
                method: "PATCH",
                body: JSON.stringify({ ids, status: "CLOSED" }),
              });
              toast({ title: `${ids.length} job(s) set to Closed`, variant: "success" });
            },
          },
          ...(can("jobs:delete")
            ? [
                {
                  label: "Delete",
                  icon: <Trash2 className="mr-1 h-3 w-3" />,
                  variant: "destructive" as const,
                  confirmTitle: "Delete jobs?",
                  confirmDescription:
                    "This will permanently delete the selected jobs. This action cannot be undone.",
                  onClick: async (ids: string[]) => {
                    await apiFetch("/jobs/bulk", {
                      method: "DELETE",
                      body: JSON.stringify({ ids }),
                    });
                    toast({ title: `${ids.length} job(s) deleted`, variant: "success" });
                  },
                },
              ]
            : []),
        ]}
        toolbar={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="ON_HOLD">On Hold</SelectItem>
              <SelectItem value="FILLED">Filled</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Job</DialogTitle>
            <DialogDescription>
              Create a new job requisition.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientId">Client *</Label>
                <select
                  id="clientId"
                  name="clientId"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="">Select a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobType">Type</Label>
                  <select
                    id="jobType"
                    name="jobType"
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  >
                    <option value="FULLTIME">Full-Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="C2H">Contract-to-Hire</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    name="priority"
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HOT">Hot</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="positionsCount">Positions</Label>
                  <Input
                    id="positionsCount"
                    name="positionsCount"
                    type="number"
                    min="1"
                    defaultValue="1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
              {customFields.length > 0 && (
                <div className="border-t border-border pt-4">
                  <p className="mb-3 text-xs font-medium uppercase text-muted-foreground">Custom Fields</p>
                  <div className="grid gap-4">
                    {customFields.map((cf) => (
                      <CustomFieldInput
                        key={cf.id}
                        field={cf}
                        value={customValues[cf.fieldKey]}
                        onChange={(key, val) =>
                          setCustomValues((prev) => ({ ...prev, [key]: val }))
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create Job"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        entityType="job"
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
