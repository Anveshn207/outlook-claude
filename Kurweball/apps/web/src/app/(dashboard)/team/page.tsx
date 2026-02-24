"use client";

import { useCallback, useState, useEffect } from "react";
import { Shield, UserPlus, ShieldAlert, Copy, Trash2, Clock } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, Column } from "@/components/shared/data-table";
import { apiFetch } from "@/lib/api";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { ExportDropdown } from "@/components/shared/export-dropdown";

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  avatarUrl: string | null;
}

interface InviteRow {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
  createdBy: { firstName: string; lastName: string };
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  RECRUITER: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  MANAGER: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  VIEWER: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800",
};

export default function TeamPage() {
  const { can } = usePermissions();
  const toast = useToast((s) => s.toast);
  const [showInvite, setShowInvite] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [inviting, setInviting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Invites state
  const [invites, setInvites] = useState<InviteRow[]>([]);

  // Edit form state
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editRole, setEditRole] = useState("RECRUITER");
  const [editActive, setEditActive] = useState("true");

  if (!can("users:read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          You don&apos;t have permission to access team management.
        </p>
      </div>
    );
  }

  // Fetch pending invites
  const fetchInvites = useCallback(async () => {
    try {
      const data = await apiFetch<InviteRow[]>("/invites");
      setInvites(data);
    } catch (err) {
      console.error("[TeamPage] Failed to fetch invites:", err);
    }
  }, []);

  const canReadUsers = can("users:read");
  useEffect(() => {
    if (canReadUsers) {
      fetchInvites();
    }
  }, [fetchInvites, canReadUsers]);

  const fetchUsers = useCallback(
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

      const res = await apiFetch<{
        data: UserRow[];
        meta: { total: number };
      }>(`/users?${query}`);
      return { data: res.data, total: res.meta.total };
    },
    [],
  );

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInviting(true);
    const form = new FormData(e.currentTarget);
    try {
      const invite = await apiFetch<InviteRow>("/invites", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          role: form.get("role") || "RECRUITER",
        }),
      });
      setShowInvite(false);

      // Build the invite link
      const baseUrl = window.location.origin;
      const inviteLink = `${baseUrl}/register?token=${invite.token}`;
      await navigator.clipboard.writeText(inviteLink);
      toast({
        title: "Invite created",
        description: "Invite link copied to clipboard.",
        variant: "success",
      });
      fetchInvites();
    } catch (err) {
      console.error("[TeamPage] Invite failed:", err);
      toast({
        title: "Failed to send invite",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteInvite = async (id: string) => {
    try {
      await apiFetch(`/invites/${id}`, { method: "DELETE" });
      toast({ title: "Invite deleted", variant: "success" });
      fetchInvites();
    } catch (err) {
      console.error("[TeamPage] Delete invite failed:", err);
      toast({
        title: "Failed to delete invite",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    }
  };

  const handleCopyLink = async (token: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/register?token=${token}`;
    await navigator.clipboard.writeText(link);
    toast({ title: "Invite link copied", variant: "success" });
  };

  const openEditDialog = (row: UserRow) => {
    setEditingUser(row);
    setEditFirstName(row.firstName);
    setEditLastName(row.lastName);
    setEditRole(row.role);
    setEditActive(row.isActive ? "true" : "false");
    setShowEdit(true);
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    setUpdating(true);
    try {
      await apiFetch(`/users/${editingUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          firstName: editFirstName,
          lastName: editLastName,
          role: editRole,
          isActive: editActive === "true",
        }),
      });
      setShowEdit(false);
      setEditingUser(null);
      setRefreshKey((k) => k + 1);
      toast({ title: "User updated", variant: "success" });
    } catch (err) {
      console.error("[TeamPage] Edit failed:", err);
      toast({
        title: "Failed to update user",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setUpdating(false);
    }
  };

  const pendingInvites = invites.filter(
    (i) => !i.usedAt && new Date(i.expiresAt) > new Date(),
  );

  const columns: Column<UserRow>[] = [
    {
      key: "firstName",
      header: "Name",
      sortable: true,
      render: (u) => (
        <span className="font-medium text-foreground">
          {u.firstName} {u.lastName}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      render: (u) => (
        <span className="text-muted-foreground">{u.email}</span>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (u) => (
        <Badge className={roleColors[u.role] ?? ""} variant="outline">
          <Shield className="mr-1 h-3 w-3" />
          {u.role}
        </Badge>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (u) => (
        <Badge
          className={
            u.isActive
              ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
              : "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
          }
          variant="outline"
        >
          {u.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      sortable: true,
      render: (u) => (
        <span className="text-muted-foreground">
          {new Date(u.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    ...(can("users:update")
      ? [
          {
            key: "actions" as const,
            header: "",
            render: (u: UserRow) => (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  openEditDialog(u);
                }}
              >
                Edit
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Team</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your team members and their access levels.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {can("import-export:read") && <ExportDropdown entity="users" />}
          {can("users:create") && (
            <Button onClick={() => setShowInvite(true)}>
              <UserPlus className="h-4 w-4" />
              Invite User
            </Button>
          )}
        </div>
      </div>

      {/* Pending Invites */}
      {can("users:create") && pendingInvites.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Invites ({pendingInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">
                        {invite.email}
                      </span>
                      <Badge
                        className={`ml-2 ${roleColors[invite.role] ?? ""}`}
                        variant="outline"
                      >
                        {invite.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="mr-2 text-xs text-muted-foreground">
                      Expires{" "}
                      {new Date(invite.expiresAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleCopyLink(invite.token)}
                      title="Copy invite link"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteInvite(invite.id)}
                      title="Delete invite"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        key={refreshKey}
        columns={columns}
        fetchData={fetchUsers}
        searchPlaceholder="Search team members..."
        keyExtractor={(u) => u.id}
        emptyMessage="No team members found. Invite your first team member to get started."
      />

      {/* Invite User Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Send an invite link to add a new team member.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email *</Label>
                <Input
                  id="invite-email"
                  name="email"
                  type="email"
                  required
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <select
                  id="invite-role"
                  name="role"
                  defaultValue="RECRUITER"
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="RECRUITER">Recruiter</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInvite(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={inviting}>
                {inviting ? "Creating..." : "Create Invite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={showEdit}
        onOpenChange={(open) => {
          setShowEdit(open);
          if (!open) setEditingUser(null);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update team member details and permissions.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleEdit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="text-sm font-medium">{editingUser.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-firstName">First Name</Label>
                    <Input
                      id="edit-firstName"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-lastName">Last Name</Label>
                    <Input
                      id="edit-lastName"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select value={editRole} onValueChange={setEditRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="RECRUITER">Recruiter</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-active">Status</Label>
                  <Select value={editActive} onValueChange={setEditActive}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEdit(false);
                    setEditingUser(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
