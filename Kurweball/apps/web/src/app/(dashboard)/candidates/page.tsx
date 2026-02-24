"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, Trash2, Linkedin } from "lucide-react";
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
import { DataTable, Column } from "@/components/shared/data-table";
import { CustomFieldInput } from "@/components/shared/custom-field-input";
import { CustomFieldDisplay } from "@/components/shared/custom-field-display";
import { useCustomFields } from "@/hooks/use-custom-fields";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

interface Candidate {
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
  linkedinUrl: string | null;
  skills: string[];
  customData?: Record<string, unknown>;
  createdBy: { id: string; firstName: string; lastName: string };
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  PASSIVE: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  PLACED: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  DND: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

const sourceLabels: Record<string, string> = {
  REFERRAL: "Referral",
  LINKEDIN: "LinkedIn",
  JOBBOARD: "Job Board",
  DIRECT: "Direct",
  OTHER: "Other",
};

export default function CandidatesPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [linkedinFilter, setLinkedinFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [creating, setCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [customValues, setCustomValues] = useState<Record<string, unknown>>({});
  const { fields: customFields } = useCustomFields("candidate");
  const { can } = usePermissions();
  const toast = useToast((s) => s.toast);

  const fetchCandidates = useCallback(
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
      if (linkedinFilter === "yes")
        query.set("hasLinkedin", "true");

      const res = await apiFetch<{
        data: Candidate[];
        meta: { total: number };
      }>(`/candidates?${query}`);
      return { data: res.data, total: res.meta.total };
    },
    [statusFilter, linkedinFilter],
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
      await apiFetch("/candidates", {
        method: "POST",
        body: JSON.stringify({
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          email: form.get("email") || undefined,
          phone: form.get("phone") || undefined,
          title: form.get("title") || undefined,
          location: form.get("location") || undefined,
          source: form.get("source") || undefined,
          ...(Object.keys(customData).length > 0 && { customData }),
        }),
      });
      setShowCreate(false);
      setCustomValues({});
      setRefreshKey((k) => k + 1);
      toast({ title: "Candidate created successfully", variant: "success" });
    } catch (err) {
      console.error("[CandidatesPage] Create failed:", err);
      toast({
        title: "Failed to create candidate",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setCreating(false);
    }
  };

  const columns: Column<Candidate>[] = useMemo(() => {
    const base: Column<Candidate>[] = [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (c) => (
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">
              {c.firstName} {c.lastName}
            </span>
            {c.linkedinUrl && (
              <a
                href={c.linkedinUrl.startsWith("http") ? c.linkedinUrl : `https://${c.linkedinUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[#0A66C2] hover:text-[#004182] dark:text-[#71b7fb] dark:hover:text-[#9ecbff] shrink-0"
                title="View LinkedIn Profile"
              >
                <Linkedin className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        ),
      },
      {
        key: "email",
        header: "Email",
        hideOnMobile: true,
        render: (c) => (
          <span className="text-muted-foreground">{c.email ?? "-"}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (c) => (
          <Badge className={statusColors[c.status] ?? ""} variant="outline">
            {c.status}
          </Badge>
        ),
      },
      {
        key: "source",
        header: "Source",
        render: (c) => (
          <span className="text-muted-foreground">
            {sourceLabels[c.source] ?? c.source}
          </span>
        ),
      },
      {
        key: "title",
        header: "Title",
        render: (c) => (
          <span className="text-muted-foreground">{c.title ?? "-"}</span>
        ),
      },
      {
        key: "location",
        header: "Location",
        hideOnMobile: true,
        render: (c) => (
          <span className="text-muted-foreground">{c.location ?? "-"}</span>
        ),
      },
      {
        key: "skills",
        header: "Skills",
        render: (c) => (
          <div className="flex flex-wrap gap-1">
            {c.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {c.skills.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{c.skills.length - 3}
              </Badge>
            )}
          </div>
        ),
      },
    ];

    const dynamicCols: Column<Candidate>[] = customFields
      .filter((cf) => cf.isVisibleInList)
      .map((cf) => ({
        key: `cf_${cf.fieldKey}`,
        header: cf.fieldName,
        render: (c: Candidate) => (
          <CustomFieldDisplay field={cf} value={c.customData?.[cf.fieldKey]} />
        ),
      }));

    return [...base, ...dynamicCols];
  }, [customFields]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Candidates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your candidate pool and track their status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {can("import-export:read") && (
            <ExportDropdown
              entity="candidates"
              filters={{ status: statusFilter, hasLinkedin: linkedinFilter === "yes" ? "true" : "" }}
            />
          )}
          {can("import-export:create") && (
            <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
              <Upload className="h-4 w-4" />
              Import
            </Button>
          )}
          {can("candidates:create") && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Add Candidate
            </Button>
          )}
        </div>
      </div>

      <DataTable
        key={refreshKey}
        columns={columns}
        fetchData={fetchCandidates}
        searchPlaceholder="Search candidates..."
        keyExtractor={(c) => c.id}
        onRowClick={(c) => router.push(`/candidates/${c.id}`)}
        emptyMessage="No candidates found. Add your first candidate to get started."
        selectable={can("candidates:update")}
        bulkActions={[
          {
            label: "Set Active",
            onClick: async (ids) => {
              await apiFetch("/candidates/bulk-status", {
                method: "PATCH",
                body: JSON.stringify({ ids, status: "ACTIVE" }),
              });
              toast({ title: `${ids.length} candidate(s) set to Active`, variant: "success" });
            },
          },
          {
            label: "Set Passive",
            onClick: async (ids) => {
              await apiFetch("/candidates/bulk-status", {
                method: "PATCH",
                body: JSON.stringify({ ids, status: "PASSIVE" }),
              });
              toast({ title: `${ids.length} candidate(s) set to Passive`, variant: "success" });
            },
          },
          {
            label: "Set DND",
            onClick: async (ids) => {
              await apiFetch("/candidates/bulk-status", {
                method: "PATCH",
                body: JSON.stringify({ ids, status: "DND" }),
              });
              toast({ title: `${ids.length} candidate(s) set to DND`, variant: "success" });
            },
          },
          ...(can("candidates:delete")
            ? [
                {
                  label: "Delete",
                  icon: <Trash2 className="mr-1 h-3 w-3" />,
                  variant: "destructive" as const,
                  confirmTitle: "Delete candidates?",
                  confirmDescription:
                    "This will permanently delete the selected candidates. This action cannot be undone.",
                  onClick: async (ids: string[]) => {
                    await apiFetch("/candidates/bulk", {
                      method: "DELETE",
                      body: JSON.stringify({ ids }),
                    });
                    toast({ title: `${ids.length} candidate(s) deleted`, variant: "success" });
                  },
                },
              ]
            : []),
        ]}
        toolbar={
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PASSIVE">Passive</SelectItem>
                <SelectItem value="DND">DND</SelectItem>
                <SelectItem value="PLACED">Placed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={linkedinFilter} onValueChange={setLinkedinFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="LinkedIn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Candidates</SelectItem>
                <SelectItem value="yes">Has LinkedIn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Candidate</DialogTitle>
            <DialogDescription>
              Create a new candidate record.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" name="firstName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" name="lastName" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input id="title" name="title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <select
                  id="source"
                  name="source"
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="OTHER">Other</option>
                  <option value="LINKEDIN">LinkedIn</option>
                  <option value="REFERRAL">Referral</option>
                  <option value="JOBBOARD">Job Board</option>
                  <option value="DIRECT">Direct</option>
                </select>
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
                {creating ? "Creating..." : "Create Candidate"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        entityType="candidate"
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
