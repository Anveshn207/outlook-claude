"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  Loader2,
  Plus,
  Briefcase,
  Star,
  Calendar,
  StickyNote,
  Users,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";

// --- Types ---

interface ContactRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  isPrimary: boolean;
}

interface JobRow {
  id: string;
  title: string;
  status: string;
  jobType: string;
  createdAt: string;
}

interface ClientDetail {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  status: string;
  notes: string | null;
  customData: Record<string, unknown> | null;
  contacts: ContactRow[];
  jobs: JobRow[];
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
  _count: { jobs: number; contacts: number };
}

// --- Status colors ---

const clientStatusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-gray-100 text-gray-600 border-gray-200",
  PROSPECT: "bg-amber-100 text-amber-700 border-amber-200",
};

const jobStatusColors: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
  ON_HOLD: "bg-amber-100 text-amber-700 border-amber-200",
  FILLED: "bg-blue-100 text-blue-700 border-blue-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

const jobTypeLabels: Record<string, string> = {
  FULL_TIME: "Full-Time",
  PART_TIME: "Part-Time",
  CONTRACT: "Contract",
  CONTRACT_TO_HIRE: "Contract to Hire",
  INTERNSHIP: "Internship",
};

// --- Page component ---

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);

  // Add Contact form state
  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    isPrimary: false,
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<ClientDetail>(`/clients/${params.id}`);
        setClient(data);
      } catch (err) {
        console.error("[ClientDetail] Load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function handleAddContact(e: FormEvent) {
    e.preventDefault();
    if (!contactForm.firstName.trim() || !contactForm.lastName.trim()) return;

    setContactSubmitting(true);
    try {
      const newContact = await apiFetch<ContactRow>(
        `/clients/${params.id}/contacts`,
        {
          method: "POST",
          body: JSON.stringify({
            firstName: contactForm.firstName.trim(),
            lastName: contactForm.lastName.trim(),
            email: contactForm.email.trim() || null,
            phone: contactForm.phone.trim() || null,
            title: contactForm.title.trim() || null,
            isPrimary: contactForm.isPrimary,
          }),
        },
      );
      setClient((prev) =>
        prev
          ? {
              ...prev,
              contacts: [...prev.contacts, newContact],
              _count: { ...prev._count, contacts: prev._count.contacts + 1 },
            }
          : prev,
      );
      setContactForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        title: "",
        isPrimary: false,
      });
      setContactDialogOpen(false);
    } catch (err) {
      console.error("[ClientDetail] Add contact failed:", err);
    } finally {
      setContactSubmitting(false);
    }
  }

  // --- Loading state ---
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // --- Not found ---
  if (!client) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <p className="text-muted-foreground">Client not found.</p>
      </div>
    );
  }

  const addressParts = [client.address, client.city, client.state, client.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => router.push("/clients")}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Clients
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {client.name}
              </h2>
              <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                {client.industry && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {client.industry}
                  </span>
                )}
                {client._count.jobs > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {client._count.jobs} job{client._count.jobs !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Badge
            className={clientStatusColors[client.status] ?? ""}
            variant="outline"
          >
            {client.status}
          </Badge>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contacts card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                Contacts ({client.contacts.length})
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setContactDialogOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Contact
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {client.contacts.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  No contacts yet. Add the first contact for this client.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="w-[80px]">Primary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">
                          {contact.firstName} {contact.lastName}
                        </TableCell>
                        <TableCell>
                          {contact.email ? (
                            <a
                              href={`mailto:${contact.email}`}
                              className="flex items-center gap-1.5 text-primary hover:underline"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              {contact.email}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.phone ? (
                            <span className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              {contact.phone}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.title ?? (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.isPrimary && (
                            <Badge
                              variant="secondary"
                              className="bg-amber-100 text-amber-700 border-amber-200"
                            >
                              <Star className="mr-1 h-3 w-3" />
                              Primary
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Jobs card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Jobs ({client.jobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {client.jobs.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  No jobs linked to this client yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.jobs.map((job) => (
                      <TableRow
                        key={job.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/jobs/${job.id}`)}
                      >
                        <TableCell>
                          <Link
                            href={`/jobs/${job.id}`}
                            className="font-medium text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {job.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={jobStatusColors[job.status] ?? ""}
                            variant="outline"
                          >
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {jobTypeLabels[job.jobType] ?? job.jobType}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column (1/3) — Info sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <DetailRow label="Status">
                <Badge
                  className={clientStatusColors[client.status] ?? ""}
                  variant="outline"
                >
                  {client.status}
                </Badge>
              </DetailRow>

              <DetailRow label="Industry">
                <span className="font-medium text-foreground">
                  {client.industry ?? "-"}
                </span>
              </DetailRow>

              <DetailRow label="Website">
                {client.website ? (
                  <a
                    href={
                      client.website.startsWith("http")
                        ? client.website
                        : `https://${client.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {client.website.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  <span className="font-medium text-foreground">-</span>
                )}
              </DetailRow>

              <DetailRow label="Address">
                {addressParts ? (
                  <span className="flex items-start gap-1.5 text-right font-medium text-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {addressParts}
                  </span>
                ) : (
                  <span className="font-medium text-foreground">-</span>
                )}
              </DetailRow>

              {client.notes && (
                <div className="border-t border-border pt-4">
                  <div className="mb-2 flex items-center gap-1.5 text-muted-foreground">
                    <StickyNote className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium uppercase">Notes</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-foreground">
                    {client.notes}
                  </p>
                </div>
              )}

              <div className="border-t border-border pt-4">
                <DetailRow label="Created">
                  <span className="font-medium text-foreground">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </span>
                </DetailRow>
                <div className="mt-3">
                  <DetailRow label="Created By">
                    <span className="font-medium text-foreground">
                      {client.createdBy.firstName} {client.createdBy.lastName}
                    </span>
                  </DetailRow>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
            <DialogDescription>
              Add a new contact for {client.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddContact}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-firstName">First Name *</Label>
                  <Input
                    id="contact-firstName"
                    value={contactForm.firstName}
                    onChange={(e) =>
                      setContactForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-lastName">Last Name *</Label>
                  <Input
                    id="contact-lastName"
                    value={contactForm.lastName}
                    onChange={(e) =>
                      setContactForm((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="john.doe@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Phone</Label>
                <Input
                  id="contact-phone"
                  value={contactForm.phone}
                  onChange={(e) =>
                    setContactForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-title">Job Title</Label>
                <Input
                  id="contact-title"
                  value={contactForm.title}
                  onChange={(e) =>
                    setContactForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Hiring Manager"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="contact-isPrimary"
                  type="checkbox"
                  checked={contactForm.isPrimary}
                  onChange={(e) =>
                    setContactForm((prev) => ({
                      ...prev,
                      isPrimary: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="contact-isPrimary" className="text-sm">
                  Primary contact
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setContactDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={contactSubmitting}>
                {contactSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Contact
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Helper component ---

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
