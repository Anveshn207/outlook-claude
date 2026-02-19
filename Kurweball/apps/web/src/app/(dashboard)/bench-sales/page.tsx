"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  Filter,
  Columns3,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/hooks/use-permissions";
import { apiFetch } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BenchSalesRecord {
  id: string;
  name: string | null;
  consultant: string;
  vendor: string | null;
  client: string | null;
  jobDuties: string | null;
  recruiter: string | null;
  batch: string | null;
  position: string | null;
  resume: string | null;
  cloud: string | null;
  startTime: string | null;
  endTime: string | null;
  interviewKind: string | null;
  rating: string | null;
  mentorsReview: string | null;
  status: string | null;
  interviewType: string | null;
  comments: string | null;
  duration: string | null;
  submissionBy: string | null;
  uniqueSubmissionId: string | null;
  codingRequired: string | null;
  interviewerName: string | null;
  notes: string | null;
  vendorEmail: string | null;
  vendorPhone: string | null;
  projectDuration: string | null;
  submissionType: string | null;
  mentorsEmail: string | null;
  vendorContactName: string | null;
  billingRate: string | null;
  workLocation: string | null;
  vendorScreening: string | null;
  submissionDate: string | null;
  createdAt: string;
}

interface FilterOptions {
  statuses: string[];
  consultants: string[];
  vendors: string[];
  clients: string[];
  submissionTypes: string[];
}

interface ColumnDef {
  key: keyof BenchSalesRecord;
  header: string;
  defaultVisible: boolean;
}

// ─── Form field definitions for the Add dialog ──────────────────────────────

interface FormFieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "date";
  required?: boolean;
  placeholder?: string;
}

const FORM_FIELDS: FormFieldDef[] = [
  { key: "consultant", label: "Consultant", type: "text", required: true, placeholder: "Consultant name" },
  { key: "vendor", label: "Vendor", type: "text", placeholder: "Vendor company" },
  { key: "client", label: "Client", type: "text", placeholder: "Client company" },
  { key: "position", label: "Position", type: "text", placeholder: "e.g. Senior Developer" },
  { key: "status", label: "Status", type: "text", placeholder: "e.g. Submitted, Selected, Rejected" },
  { key: "interviewType", label: "Interview Type", type: "text", placeholder: "e.g. Phone, Video + Coding" },
  { key: "billingRate", label: "Billing Rate", type: "text", placeholder: "e.g. $65/hr" },
  { key: "workLocation", label: "Work Location", type: "text", placeholder: "e.g. Remote, Onsite - Dallas" },
  { key: "submissionDate", label: "Submission Date", type: "date" },
  { key: "submissionBy", label: "Submission By", type: "text", placeholder: "Who submitted" },
  { key: "submissionType", label: "Submission Type", type: "text", placeholder: "e.g. Consultant, Recruiter" },
  { key: "name", label: "Name", type: "text", placeholder: "Record name / identifier" },
  { key: "recruiter", label: "Recruiter", type: "text", placeholder: "Recruiter name" },
  { key: "batch", label: "Batch", type: "text", placeholder: "Batch name" },
  { key: "cloud", label: "Cloud", type: "text", placeholder: "e.g. Salesforce, AWS" },
  { key: "startTime", label: "Start Time", type: "date" },
  { key: "endTime", label: "End Time", type: "date" },
  { key: "interviewKind", label: "Interview Kind", type: "text", placeholder: "e.g. Client Round" },
  { key: "rating", label: "Rating", type: "text", placeholder: "Rating" },
  { key: "mentorsReview", label: "Mentor's Review", type: "text", placeholder: "Review notes" },
  { key: "duration", label: "Duration", type: "text", placeholder: "e.g. 60 Minutes" },
  { key: "codingRequired", label: "Coding Required?", type: "text", placeholder: "Yes / No" },
  { key: "interviewerName", label: "Interviewer Name", type: "text", placeholder: "Interviewer(s)" },
  { key: "vendorEmail", label: "Vendor Email", type: "text", placeholder: "vendor@example.com" },
  { key: "vendorPhone", label: "Vendor Phone", type: "text", placeholder: "Phone number" },
  { key: "vendorContactName", label: "Vendor Contact Name", type: "text", placeholder: "Contact person" },
  { key: "projectDuration", label: "Project Duration", type: "text", placeholder: "e.g. 6 months" },
  { key: "mentorsEmail", label: "Mentor's Email", type: "text", placeholder: "mentor@example.com" },
  { key: "jobDuties", label: "Job Duties", type: "textarea", placeholder: "Describe responsibilities..." },
  { key: "comments", label: "Comments", type: "textarea", placeholder: "Additional comments..." },
  { key: "notes", label: "Notes", type: "textarea", placeholder: "Notes..." },
  { key: "resume", label: "Resume", type: "text", placeholder: "Resume URL or filename" },
  { key: "uniqueSubmissionId", label: "Unique Submission ID", type: "text", placeholder: "Unique ID" },
  { key: "vendorScreening", label: "Vendor Screening", type: "text", placeholder: "Screening details" },
];

// ─── Column Definitions ──────────────────────────────────────────────────────

const ALL_COLUMNS: ColumnDef[] = [
  { key: "consultant", header: "Consultant", defaultVisible: true },
  { key: "vendor", header: "Vendor", defaultVisible: true },
  { key: "client", header: "Client", defaultVisible: true },
  { key: "position", header: "Position", defaultVisible: true },
  { key: "status", header: "Status", defaultVisible: true },
  { key: "interviewType", header: "Interview Type", defaultVisible: true },
  { key: "billingRate", header: "Billing Rate", defaultVisible: true },
  { key: "workLocation", header: "Work Location", defaultVisible: true },
  { key: "submissionDate", header: "Submission Date", defaultVisible: true },
  { key: "submissionBy", header: "Submission By", defaultVisible: false },
  { key: "submissionType", header: "Submission Type", defaultVisible: false },
  { key: "name", header: "Name", defaultVisible: false },
  { key: "recruiter", header: "Recruiter", defaultVisible: false },
  { key: "batch", header: "Batch", defaultVisible: false },
  { key: "cloud", header: "Cloud", defaultVisible: false },
  { key: "startTime", header: "Start Time", defaultVisible: false },
  { key: "endTime", header: "End Time", defaultVisible: false },
  { key: "interviewKind", header: "Interview Kind", defaultVisible: false },
  { key: "rating", header: "Rating", defaultVisible: false },
  { key: "mentorsReview", header: "Mentor's Review", defaultVisible: false },
  { key: "comments", header: "Comments", defaultVisible: false },
  { key: "duration", header: "Duration", defaultVisible: false },
  { key: "jobDuties", header: "Job Duties", defaultVisible: false },
  { key: "resume", header: "Resume", defaultVisible: false },
  { key: "uniqueSubmissionId", header: "Unique Submission ID", defaultVisible: false },
  { key: "codingRequired", header: "Coding Required?", defaultVisible: false },
  { key: "interviewerName", header: "Interviewer Name", defaultVisible: false },
  { key: "notes", header: "Notes", defaultVisible: false },
  { key: "vendorEmail", header: "Vendor Email", defaultVisible: false },
  { key: "vendorPhone", header: "Vendor Phone", defaultVisible: false },
  { key: "projectDuration", header: "Project Duration", defaultVisible: false },
  { key: "mentorsEmail", header: "Mentor's Email", defaultVisible: false },
  { key: "vendorContactName", header: "Vendor Contact Name", defaultVisible: false },
  { key: "vendorScreening", header: "Vendor Screening", defaultVisible: false },
];

const statusColors: Record<string, string> = {
  "Submitted": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  "Selected": "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  "Rejected": "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  "Interview Scheduled": "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  "Pending": "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
};

function getStatusColor(status: string | null) {
  if (!status) return "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
  for (const [key, color] of Object.entries(statusColors)) {
    if (status.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function truncate(text: string | null, max = 40) {
  if (!text) return "—";
  return text.length > max ? text.slice(0, max) + "..." : text;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BenchSalesPage() {
  const { can } = usePermissions();
  const [data, setData] = useState<BenchSalesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Add record dialog
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Filters
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    statuses: [], consultants: [], vendors: [], clients: [], submissionTypes: [],
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [consultantFilter, setConsultantFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    const defaults = new Set<string>();
    ALL_COLUMNS.forEach((c) => {
      if (c.defaultVisible) defaults.add(c.key);
    });
    return defaults;
  });

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch filter options
  const refreshFilters = useCallback(() => {
    apiFetch<FilterOptions>("/bench-sales/filters")
      .then(setFilterOptions)
      .catch((err) => console.error("[BenchSales] Failed to fetch filters:", err));
  }, []);

  useEffect(() => {
    refreshFilters();
  }, [refreshFilters]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "25",
        sortBy,
        sortOrder,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);
      if (consultantFilter) params.set("consultant", consultantFilter);
      if (vendorFilter) params.set("vendor", vendorFilter);
      if (clientFilter) params.set("client", clientFilter);

      const json = await apiFetch<{ data: BenchSalesRecord[]; meta: { total: number; totalPages: number } }>(`/bench-sales?${params}`);
      setData(json.data);
      setTotal(json.meta.total);
      setTotalPages(json.meta.totalPages);
    } catch (err) {
      console.error("[BenchSales] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, sortBy, sortOrder, statusFilter, consultantFilter, vendorFilter, clientFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, consultantFilter, vendorFilter, clientFilter]);

  const activeFilterCount = [statusFilter, consultantFilter, vendorFilter, clientFilter].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter("");
    setConsultantFilter("");
    setVendorFilter("");
    setClientFilter("");
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === data.length) setSelected(new Set());
    else setSelected(new Set(data.map((d) => d.id)));
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} records? This cannot be undone.`)) return;
    try {
      await apiFetch("/bench-sales/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      setSelected(new Set());
      fetchData();
      refreshFilters();
    } catch (err) {
      console.error("[BenchSales] Bulk delete error:", err);
    }
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  // ─── Create Record ─────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!formData.consultant?.trim()) return;
    setCreating(true);
    try {
      await apiFetch("/bench-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setShowCreate(false);
      setFormData({});
      fetchData();
      refreshFilters();
    } catch (err) {
      console.error("[BenchSales] Create error:", err);
    } finally {
      setCreating(false);
    }
  };

  const visibleColumnDefs = useMemo(
    () => ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)),
    [visibleColumns],
  );

  const renderCell = (record: BenchSalesRecord, col: ColumnDef) => {
    const val = record[col.key];
    if (col.key === "status") {
      return (
        <Badge variant="outline" className={`text-xs ${getStatusColor(val as string)}`}>
          {val || "—"}
        </Badge>
      );
    }
    if (col.key === "submissionDate" || col.key === "startTime" || col.key === "endTime") {
      return <span className="text-xs whitespace-nowrap">{formatDate(val as string)}</span>;
    }
    if (col.key === "resume" && val) {
      const match = (val as string).match(/\((https?:\/\/[^)]+)\)/);
      if (match) {
        return (
          <a href={match[1]} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            View
          </a>
        );
      }
      return <span className="text-xs">{truncate(val as string, 20)}</span>;
    }
    return <span className="text-xs">{truncate(val as string)}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bench Sales</h1>
            <p className="text-sm text-muted-foreground">{total} submissions</p>
          </div>
        </div>
        {can("bench-sales:create") && (
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Record
          </Button>
        )}
      </div>

      {/* Toolbar: Search + Filters + Column Visibility */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search consultant, vendor, client, position..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Filter toggle */}
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1.5"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {/* Column visibility */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Columns3 className="h-4 w-4" />
                  Columns
                  <Badge variant="secondary" className="ml-1 text-[10px]">
                    {visibleColumns.size}/{ALL_COLUMNS.length}
                  </Badge>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 max-h-80 overflow-y-auto p-3" align="end">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">Toggle columns</p>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setVisibleColumns(new Set(ALL_COLUMNS.map((c) => c.key)))}
                    >
                      All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        const defaults = new Set<string>();
                        ALL_COLUMNS.forEach((c) => { if (c.defaultVisible) defaults.add(c.key); });
                        setVisibleColumns(defaults);
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  {ALL_COLUMNS.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={visibleColumns.has(col.key)}
                        onCheckedChange={() => toggleColumn(col.key)}
                      />
                      <span className="text-sm">{col.header}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Bulk actions */}
            {selected.size > 0 && can("bench-sales:delete") && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-1.5">
                <Trash2 className="h-4 w-4" />
                Delete ({selected.size})
              </Button>
            )}
          </div>

          {/* Filter dropdowns */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-3">
              <FilterSelect label="Status" value={statusFilter} options={filterOptions.statuses} onChange={setStatusFilter} />
              <FilterSelect label="Consultant" value={consultantFilter} options={filterOptions.consultants} onChange={setConsultantFilter} />
              <FilterSelect label="Vendor" value={vendorFilter} options={filterOptions.vendors} onChange={setVendorFilter} />
              <FilterSelect label="Client" value={clientFilter} options={filterOptions.clients} onChange={setClientFilter} />
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                  <X className="h-3.5 w-3.5" />
                  Clear all
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table with horizontal scroll */}
      <Card>
        <div className="overflow-x-auto scrollbar-thin">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 sticky left-0 bg-background z-10">
                  <Checkbox
                    checked={data.length > 0 && selected.size === data.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                {visibleColumnDefs.map((col) => (
                  <TableHead
                    key={col.key}
                    className="whitespace-nowrap cursor-pointer hover:bg-muted/50 select-none min-w-[120px]"
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {sortBy === col.key ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="sticky left-0 bg-background"><Skeleton className="h-4 w-4" /></TableCell>
                    {visibleColumnDefs.map((col) => (
                      <TableCell key={col.key}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumnDefs.length + 1} className="h-32 text-center text-muted-foreground">
                    No bench sales records found. Click &quot;Add Record&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((record) => (
                  <TableRow
                    key={record.id}
                    className={selected.has(record.id) ? "bg-muted/50" : ""}
                  >
                    <TableCell className="sticky left-0 bg-background z-10">
                      <Checkbox
                        checked={selected.has(record.id)}
                        onCheckedChange={() => toggleSelect(record.id)}
                      />
                    </TableCell>
                    {visibleColumnDefs.map((col) => (
                      <TableCell key={col.key} className="max-w-[250px]">
                        {renderCell(record, col)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(1)}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ─── Add Record Dialog ──────────────────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Bench Sales Record</DialogTitle>
            <DialogDescription>
              Fill in the details below. Only Consultant is required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {FORM_FIELDS.map((field) => (
              <div
                key={field.key}
                className={field.type === "textarea" ? "col-span-2" : ""}
              >
                <Label htmlFor={field.key} className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.key}
                    placeholder={field.placeholder}
                    value={formData[field.key] || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    className="mt-1.5"
                    rows={3}
                  />
                ) : field.type === "date" ? (
                  <Input
                    id={field.key}
                    type="datetime-local"
                    value={formData[field.key] || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    className="mt-1.5"
                  />
                ) : (
                  <Input
                    id={field.key}
                    placeholder={field.placeholder}
                    value={formData[field.key] || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    className="mt-1.5"
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !formData.consultant?.trim()}
            >
              {creating ? "Adding..." : "Add Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Filter Select Component ─────────────────────────────────────────────────

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
}) {
  return (
    <Select value={value || "all"} onValueChange={(v) => onChange(v === "all" ? "" : v)}>
      <SelectTrigger className="w-[160px] h-8 text-xs">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label}s</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {truncate(opt, 30)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
