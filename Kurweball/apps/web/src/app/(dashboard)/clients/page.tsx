"use client";

import { useCallback, useMemo, useState } from "react";
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
import { DataTable, Column } from "@/components/shared/data-table";
import { CustomFieldInput } from "@/components/shared/custom-field-input";
import { CustomFieldDisplay } from "@/components/shared/custom-field-display";
import { useCustomFields } from "@/hooks/use-custom-fields";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

interface Client {
  id: string;
  name: string;
  industry: string | null;
  status: string;
  city: string | null;
  state: string | null;
  website: string | null;
  customData?: Record<string, unknown>;
  _count: { contacts: number; jobs: number };
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PROSPECT: "bg-amber-100 text-amber-700 border-amber-200",
  INACTIVE: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function ClientsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showImport, setShowImport] = useState(false);
  const [customValues, setCustomValues] = useState<Record<string, unknown>>({});
  const { fields: customFields } = useCustomFields("client");
  const { can } = usePermissions();
  const toast = useToast((s) => s.toast);

  const fetchClients = useCallback(
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
        data: Client[];
        meta: { total: number };
      }>(`/clients?${query}`);
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
      await apiFetch("/clients", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          industry: form.get("industry") || undefined,
          website: form.get("website") || undefined,
          city: form.get("city") || undefined,
          state: form.get("state") || undefined,
          country: form.get("country") || undefined,
          status: form.get("status") || undefined,
          ...(Object.keys(customData).length > 0 && { customData }),
        }),
      });
      setShowCreate(false);
      setCustomValues({});
      setRefreshKey((k) => k + 1);
      toast({ title: "Client created successfully", variant: "success" });
    } catch (err) {
      console.error("[ClientsPage] Create failed:", err);
      toast({
        title: "Failed to create client",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setCreating(false);
    }
  };

  const columns: Column<Client>[] = useMemo(() => {
    const base: Column<Client>[] = [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (c) => (
          <span className="font-medium text-foreground">{c.name}</span>
        ),
      },
      {
        key: "industry",
        header: "Industry",
        render: (c) => (
          <span className="text-muted-foreground">{c.industry ?? "-"}</span>
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
        key: "city",
        header: "Location",
        render: (c) => (
          <span className="text-muted-foreground">
            {[c.city, c.state].filter(Boolean).join(", ") || "-"}
          </span>
        ),
      },
      {
        key: "contacts",
        header: "Contacts",
        className: "text-right",
        render: (c) => (
          <span className="font-medium text-foreground">
            {c._count.contacts}
          </span>
        ),
      },
      {
        key: "jobs",
        header: "Jobs",
        className: "text-right",
        render: (c) => (
          <span className="font-medium text-foreground">{c._count.jobs}</span>
        ),
      },
    ];

    const dynamicCols: Column<Client>[] = customFields
      .filter((cf) => cf.isVisibleInList)
      .map((cf) => ({
        key: `cf_${cf.fieldKey}`,
        header: cf.fieldName,
        render: (c: Client) => (
          <CustomFieldDisplay field={cf} value={c.customData?.[cf.fieldKey]} />
        ),
      }));

    return [...base, ...dynamicCols];
  }, [customFields]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Clients</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your client relationships and track engagement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {can("import-export:read") && <ExportDropdown entity="clients" />}
          {can("import-export:create") && (
            <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
              <Upload className="h-4 w-4" />
              Import
            </Button>
          )}
          {can("clients:create") && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          )}
        </div>
      </div>

      <DataTable
        key={refreshKey}
        columns={columns}
        fetchData={fetchClients}
        searchPlaceholder="Search clients..."
        keyExtractor={(c) => c.id}
        onRowClick={(c) => router.push(`/clients/${c.id}`)}
        emptyMessage="No clients found. Add your first client to get started."
        selectable={can("clients:update")}
        bulkActions={[
          {
            label: "Set Active",
            onClick: async (ids) => {
              await apiFetch("/clients/bulk-status", {
                method: "PATCH",
                body: JSON.stringify({ ids, status: "ACTIVE" }),
              });
              toast({ title: `${ids.length} client(s) set to Active`, variant: "success" });
            },
          },
          {
            label: "Set Inactive",
            onClick: async (ids) => {
              await apiFetch("/clients/bulk-status", {
                method: "PATCH",
                body: JSON.stringify({ ids, status: "INACTIVE" }),
              });
              toast({ title: `${ids.length} client(s) set to Inactive`, variant: "success" });
            },
          },
          ...(can("clients:delete")
            ? [
                {
                  label: "Delete",
                  icon: <Trash2 className="mr-1 h-3 w-3" />,
                  variant: "destructive" as const,
                  confirmTitle: "Delete clients?",
                  confirmDescription:
                    "This will permanently delete the selected clients. This action cannot be undone.",
                  onClick: async (ids: string[]) => {
                    await apiFetch("/clients/bulk", {
                      method: "DELETE",
                      body: JSON.stringify({ ids }),
                    });
                    toast({ title: `${ids.length} client(s) deleted`, variant: "success" });
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
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PROSPECT">Prospect</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Client</DialogTitle>
            <DialogDescription>
              Create a new client record.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input id="industry" name="industry" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" name="website" placeholder="https://" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" name="country" defaultValue="US" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PROSPECT">Prospect</option>
                  <option value="INACTIVE">Inactive</option>
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
                {creating ? "Creating..." : "Create Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        entityType="client"
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
