"use client";

import { useCallback, useState } from "react";
import { Plus, CheckCircle2, AlertTriangle, ShieldAlert, Trash2 } from "lucide-react";
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
import { usePermissions } from "@/hooks/use-permissions";
import { ExportDropdown } from "@/components/shared/export-dropdown";

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: string;
  status: string;
  entityType: string | null;
  entityId: string | null;
  assignedTo: { id: string; firstName: string; lastName: string };
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
  completedAt: string | null;
}

const priorityColors: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  LOW: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  IN_PROGRESS: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function TasksPage() {
  const { can } = usePermissions();
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchTasks = useCallback(
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
      if (priorityFilter && priorityFilter !== "all")
        query.set("priority", priorityFilter);

      const res = await apiFetch<{
        data: TaskRow[];
        meta: { total: number };
      }>(`/tasks?${query}`);
      return { data: res.data, total: res.meta.total };
    },
    [statusFilter, priorityFilter],
  );

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    const form = new FormData(e.currentTarget);
    try {
      await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description") || undefined,
          assignedToId: user?.id,
          dueDate: form.get("dueDate") || undefined,
          priority: form.get("priority") || "MEDIUM",
        }),
      });
      setShowCreate(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("[TasksPage] Create failed:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleComplete = async (taskId: string) => {
    try {
      await apiFetch(`/tasks/${taskId}/complete`, { method: "PATCH" });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("[TasksPage] Complete failed:", err);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) return;
    try {
      await apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("[TasksPage] Delete failed:", err);
    }
  };

  if (!can("tasks:read")) {
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

  const columns: Column<TaskRow>[] = [
    {
      key: "title",
      header: "Task",
      sortable: true,
      render: (t) => (
        <div>
          <span className="font-medium text-foreground">{t.title}</span>
          {t.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {t.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (t) => (
        <Badge className={statusColors[t.status] ?? ""} variant="outline">
          {statusLabels[t.status] ?? t.status}
        </Badge>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      render: (t) => (
        <Badge className={priorityColors[t.priority] ?? ""} variant="outline">
          {t.priority}
        </Badge>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      sortable: true,
      render: (t) => {
        if (!t.dueDate) return <span className="text-muted-foreground">-</span>;
        const due = new Date(t.dueDate);
        const now = new Date();
        const isOverdue = due < now && t.status !== "COMPLETED" && t.status !== "CANCELLED";
        return (
          <span className={isOverdue ? "flex items-center gap-1 text-red-600 font-medium dark:text-red-400" : "text-muted-foreground"}>
            {isOverdue && <AlertTriangle className="h-3 w-3" />}
            {due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        );
      },
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      render: (t) => (
        <span className="text-muted-foreground">
          {t.assignedTo.firstName} {t.assignedTo.lastName}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (t) => (
        <div className="flex items-center gap-1">
          {t.status !== "COMPLETED" && t.status !== "CANCELLED" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              onClick={(e) => {
                e.stopPropagation();
                handleComplete(t.id);
              }}
            >
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              Done
            </Button>
          )}
          {can("tasks:delete") && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(t.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tasks</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage follow-ups, deadlines, and action items.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {can("import-export:read") && (
            <ExportDropdown
              entity="tasks"
              filters={{ status: statusFilter, search: searchTerm }}
            />
          )}
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      <DataTable
        key={refreshKey}
        columns={columns}
        fetchData={fetchTasks}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search tasks..."
        keyExtractor={(t) => t.id}
        emptyMessage="No tasks found. Create your first task to get started."
        toolbar={
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Add a new task or follow-up item.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" name="dueDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    name="priority"
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  >
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
