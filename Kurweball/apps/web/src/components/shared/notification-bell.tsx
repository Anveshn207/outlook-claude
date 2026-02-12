"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useNotificationStream } from "@/hooks/use-notification-stream";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiFetch<{ count: number }>(
        "/notifications/unread-count",
      );
      setUnreadCount(res.count);
    } catch (err) {
      console.error("[NotificationBell] Failed to fetch unread count:", err);
    }
  }, []);

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // SSE stream for real-time notifications
  useNotificationStream({
    onNotification: useCallback((notif: Record<string, unknown>) => {
      setUnreadCount((prev) => prev + 1);
      // If dropdown is open, prepend the new notification
      if (notif.id && notif.title) {
        setNotifications((prev) => [
          {
            id: notif.id as string,
            type: (notif.type as string) ?? "SYSTEM",
            title: notif.title as string,
            message: (notif.message as string) ?? "",
            isRead: false,
            link: (notif.link as string) ?? null,
            createdAt: (notif.createdAt as string) ?? new Date().toISOString(),
          },
          ...prev.slice(0, 4), // Keep max 5
        ]);
      }
    }, []),
  });

  // Fetch recent notifications when dropdown opens
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{
        data: Notification[];
        meta: { total: number };
      }>("/notifications?limit=5");
      setNotifications(res.data);
    } catch (err) {
      console.error("[NotificationBell] Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle dropdown
  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      fetchNotifications();
    }
  };

  // Click outside to close
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Mark single notification as read
  const handleMarkRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("[NotificationBell] Failed to mark read:", err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await apiFetch("/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("[NotificationBell] Failed to mark all read:", err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleToggle}
        className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-white shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleMarkAllRead}
              >
                <CheckCheck className="mr-1 h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 border-b border-border/50 px-4 py-3 last:border-0 ${
                    !n.isRead ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {n.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {n.message}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {!n.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => handleMarkRead(n.id)}
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-medium text-primary hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
