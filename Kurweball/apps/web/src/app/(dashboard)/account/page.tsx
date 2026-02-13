"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  User,
  Phone,
  Settings,
  MailCheck,
  BadgeCheck,
  Copy,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/auth-store";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// Work ID Tab
// ---------------------------------------------------------------------------

function WorkIdTab() {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BadgeCheck className="h-5 w-5 text-primary" />
          Work ID
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Your unique work identifier used across the platform.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">User ID</Label>
            <div className="flex items-center gap-2">
              <Input
                value={user?.id || ""}
                readOnly
                className="max-w-md bg-muted font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={copyId}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Full Name</Label>
              <p className="text-sm font-medium">
                {user ? `${user.firstName} ${user.lastName}` : "-"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Role</Label>
              <Badge variant="secondary" className="text-xs capitalize">
                {user?.role?.toLowerCase() || "user"}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Email</Label>
            <p className="text-sm font-medium">{user?.email || "-"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Contact Info Tab
// ---------------------------------------------------------------------------

function ContactInfoTab() {
  const { user } = useAuthStore();
  const toast = useToast((s) => s.toast);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
    }
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    const payload: Record<string, string> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    };

    if (isAdmin && email.trim() !== user?.email) {
      payload.email = email.trim();
    }

    setSaving(true);
    try {
      await apiFetch(`/users/${user?.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      // Re-hydrate user store with updated data
      const { useAuthStore: store } = await import("@/stores/auth-store");
      await store.getState().hydrate();

      toast({ title: "Contact info updated", variant: "success" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update contact info";
      toast({ title: message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Phone className="h-5 w-5 text-primary" />
          Contact Info
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-firstName">First Name</Label>
            <Input
              id="contact-firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-lastName">Last Name</Label>
            <Input
              id="contact-lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">Email</Label>
            {isAdmin ? (
              <>
                <Input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  As an admin, you can change your login email.
                </p>
              </>
            ) : (
              <>
                <Input value={user?.email || ""} readOnly className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed here. Contact an admin if needed.
                </p>
              </>
            )}
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Account Settings Tab (Change Password)
// ---------------------------------------------------------------------------

function AccountSettingsTab() {
  const toast = useToast((s) => s.toast);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast({ title: "Password changed successfully", variant: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to change password";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="h-5 w-5 text-primary" />
          Account Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium">Change Password</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Update your login credentials. You&apos;ll need your current
              password.
            </p>
          </div>

          <form
            onSubmit={handleChangePassword}
            className="max-w-md space-y-4"
          >
            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="acc-currentPassword">Current Password</Label>
              <Input
                id="acc-currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-newPassword">New Password</Label>
              <Input
                id="acc-newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-confirmPassword">Confirm New Password</Label>
              <Input
                id="acc-confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Verify Email Tab
// ---------------------------------------------------------------------------

function VerifyEmailTab() {
  const { user } = useAuthStore();
  const toast = useToast((s) => s.toast);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSendVerification() {
    setSending(true);
    try {
      await apiFetch("/auth/send-verification-email", { method: "POST" });
      setSent(true);
      toast({
        title: "Verification email sent",
        description: "Check your inbox for the verification link.",
        variant: "success",
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to send verification email";
      toast({ title: message, variant: "error" });
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MailCheck className="h-5 w-5 text-primary" />
          Verify Email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-muted-foreground">Current Email</Label>
          <p className="text-sm font-medium">{user?.email || "-"}</p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            Click the button below to receive a verification link at your email
            address. This confirms that you own this email and enables full
            account features.
          </p>
        </div>

        {sent ? (
          <div className="flex items-center gap-2 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
            <Check className="h-4 w-4" />
            Verification email sent! Check your inbox.
          </div>
        ) : (
          <Button onClick={handleSendVerification} disabled={sending}>
            {sending ? "Sending..." : "Send Verification Email"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Account Page
// ---------------------------------------------------------------------------

const tabConfig = [
  { value: "work-id", label: "Work ID", icon: User },
  { value: "contact-info", label: "Contact Info", icon: Phone },
  { value: "account-settings", label: "Account Settings", icon: Settings },
  { value: "verify-email", label: "Verify Email", icon: MailCheck },
];

export default function AccountPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab = tabConfig.some((t) => t.value === tabParam)
    ? tabParam!
    : "work-id";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">My Account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, contact information, and security settings.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          {tabConfig.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-1.5 text-xs sm:text-sm"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">
                {tab.label.split(" ")[0]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="work-id">
          <WorkIdTab />
        </TabsContent>
        <TabsContent value="contact-info">
          <ContactInfoTab />
        </TabsContent>
        <TabsContent value="account-settings">
          <AccountSettingsTab />
        </TabsContent>
        <TabsContent value="verify-email">
          <VerifyEmailTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
