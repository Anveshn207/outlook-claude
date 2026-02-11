"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
  skills: string[];
  customData?: Record<string, unknown>;
  createdBy: { id: string; firstName: string; lastName: string };
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PASSIVE: "bg-amber-100 text-amber-700 border-amber-200",
  PLACED: "bg-blue-100 text-blue-700 border-blue-200",
  DND: "bg-red-100 text-red-700 border-red-200",
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
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [customValues, setCustomValues] = useState<Record<string, unknown>>({});
  const { fields: customFields } = useCustomFields("candidate");

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

      const res = await apiFetch<{
        data: Candidate[];
        meta: { total: number };
      }>(`/candidates?${query}`);
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
    } catch (err) {
      console.error("[CandidatesPage] Create failed:", err);
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
          <span className="font-medium text-foreground">
            {c.firstName} {c.lastName}
          </span>
        ),
      },
      {
        key: "email",
        header: "Email",
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Candidates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your candidate pool and track their status.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Add Candidate
        </Button>
      </div>

      <DataTable
        key={refreshKey}
        columns={columns}
        fetchData={fetchCandidates}
        searchPlaceholder="Search candidates..."
        keyExtractor={(c) => c.id}
        onRowClick={(c) => router.push(`/candidates/${c.id}`)}
        emptyMessage="No candidates found. Add your first candidate to get started."
        toolbar={
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
    </div>
  );
}
