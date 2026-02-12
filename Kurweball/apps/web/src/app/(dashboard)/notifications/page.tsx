"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, Column } from "@/components/shared/data-table";
import { apiFetch } from "@/lib/api";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

const typeColors: Record<string, string> = {
  INTERVIEW_SCHEDULED: "bg-blue-100 text-blue-700 border-blue-200",
  TASK_ASSIGNED: "bg-amber-100 text-amber-700 border-amber-200",
  STAGE_CHANGE: "bg-purple-100 text-purple-700 border-purple-200",
  SYSTEM: "bg-gray-100 text-gray-600 border-gray-200",
  APPLICATION_RECEIVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANDIDATE_UPDATE: "bg-cyan-100 text-cyan-700 border-cyan-200",
  REMINDER: "bg-orange-100 text-orange-700 border-orange-200",
};

const typeLabels: Record<string, string> = {
  INTERVIEW_SCHEDULED: "Interview",
  TASK_ASSIGNED: "Task",
  STAGE_CHANGE: "Stage Change",
  SYSTEM: "System",
  APPLICATION_RECEIVED: "Application",
  CANDIDATE_UPDATE: "Candidate",
  REMINDER: "Reminder",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NotificationsPage() {
  const [readFilter, setReadFilter] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchNotifications = useCallback(
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
      if (readFilter === "unread") query.set("isRead", "false");
      if (readFilter === "read") query.set("isRead", "true");

      const res = await apiFetch<{
        data: NotificationRow[];
        meta: { total: number };
      }>(`/notifications?${query}`);
      return { data: res.data, total: res.meta.total };
    },
    [readFilter],
  );

  const handleMarkAllRead = async () => {
    try {
      await apiFetch("/notifications/read-all", { method: "PATCH" });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("[NotificationsPage] Mark all read failed:", err);
    }
  };

  const columns: Column<NotificationRow>[] = [
    {
      key: "type",
      header: "Type",
      render: (n) => (
        <Badge
          className={typeColors[n.type] ?? "bg-gray-100 text-gray-600 border-gray-200"}
          variant="outline"
        >
          {typeLabels[n.type] ?? n.type}
        </Badge>
      ),
    },
    {
      key: "title",
      header: "Title",
      sortable: true,
      render: (n) => (
        <span className="font-medium text-foreground">{n.title}</span>
      ),
    },
    {
      key: "message",
      header: "Message",
      render: (n) => (
        <p className="line-clamp-1 max-w-xs text-sm text-muted-foreground">
          {n.message}
        </p>
      ),
    },
    {
      key: "isRead",
      header: "Status",
      render: (n) => (
        <Badge
          className={
            n.isRead
              ? "bg-gray-100 text-gray-600 border-gray-200"
              : "bg-blue-100 text-blue-700 border-blue-200"
          }
          variant="outline"
        >
          {n.isRead ? "Read" : "Unread"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      sortable: true,
      render: (n) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(n.createdAt)}
        </span>
      ),
    },
    {
      key: "link",
      header: "",
      render: (n) =>
        n.link ? (
          <Link
            href={n.link}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            View
          </Link>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage all your notifications.
          </p>
        </div>
        <Button variant="outline" onClick={handleMarkAllRead}>
          <CheckCheck className="h-4 w-4" />
          Mark All Read
        </Button>
      </div>

      <DataTable
        key={refreshKey}
        columns={columns}
        fetchData={fetchNotifications}
        searchPlaceholder="Search notifications..."
        keyExtractor={(n) => n.id}
        emptyMessage="No notifications found."
        toolbar={
          <div className="flex gap-2">
            <Select value={readFilter} onValueChange={setReadFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  );
}
