"use client";

import { useCallback, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ColumnMappingTable } from "./column-mapping-table";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: "candidate" | "job" | "client";
  onSuccess?: () => void;
}

interface ParsedFileResult {
  fileId: string;
  fileName: string;
  columns: string[];
  sampleRows: Record<string, string>[];
  totalRows: number;
}

interface MappingSuggestion {
  sourceColumn: string;
  targetField: string;
  confidence: number;
}

interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

// ---------------------------------------------------------------------------
// Entity field definitions
// ---------------------------------------------------------------------------

const ENTITY_FIELDS: Record<
  ImportDialogProps["entityType"],
  { key: string; label: string }[]
> = {
  candidate: [
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "title", label: "Job Title" },
    { key: "currentEmployer", label: "Current Employer" },
    { key: "location", label: "Location" },
    { key: "visaStatus", label: "Visa Status" },
    { key: "linkedinUrl", label: "LinkedIn URL" },
    { key: "rate", label: "Rate" },
    { key: "availability", label: "Availability" },
    { key: "skills", label: "Skills" },
    { key: "tags", label: "Tags" },
    { key: "source", label: "Source" },
    { key: "status", label: "Status" },
  ],
  job: [
    { key: "title", label: "Job Title" },
    { key: "clientName", label: "Client Name" },
    { key: "description", label: "Description" },
    { key: "requirements", label: "Requirements" },
    { key: "location", label: "Location" },
    { key: "positionsCount", label: "Positions" },
    { key: "billRate", label: "Bill Rate" },
    { key: "payRate", label: "Pay Rate" },
    { key: "skillsRequired", label: "Required Skills" },
    { key: "jobType", label: "Job Type" },
    { key: "status", label: "Status" },
    { key: "priority", label: "Priority" },
  ],
  client: [
    { key: "name", label: "Company Name" },
    { key: "industry", label: "Industry" },
    { key: "website", label: "Website" },
    { key: "address", label: "Address" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "country", label: "Country" },
    { key: "notes", label: "Notes" },
    { key: "status", label: "Status" },
  ],
};

const ENTITY_LABELS: Record<ImportDialogProps["entityType"], string> = {
  candidate: "Candidates",
  job: "Jobs",
  client: "Clients",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImportDialog({
  open,
  onOpenChange,
  entityType,
  onSuccess,
}: ImportDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2
  const [parsedFile, setParsedFile] = useState<ParsedFileResult | null>(null);
  const [mappings, setMappings] = useState<MappingSuggestion[]>([]);

  // Step 4
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const entityFields = ENTITY_FIELDS[entityType];
  const entityLabel = ENTITY_LABELS[entityType];

  // -------------------------------------------------------------------------
  // Reset state when dialog opens/closes
  // -------------------------------------------------------------------------
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setStep(1);
        setLoading(false);
        setError(null);
        setSelectedFile(null);
        setParsedFile(null);
        setMappings([]);
        setImportResult(null);
      }
      onOpenChange(isOpen);
    },
    [onOpenChange],
  );

  // -------------------------------------------------------------------------
  // Step 1 - Upload
  // -------------------------------------------------------------------------
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("entityType", entityType);

      const response = await fetch(`${API_BASE_URL}/import/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.text();
        let message: string;
        try {
          const parsed = JSON.parse(body);
          message = parsed.message || parsed.error || body;
        } catch {
          message = body;
        }
        throw new Error(message);
      }

      const result: ParsedFileResult = await response.json();
      setParsedFile(result);
      setStep(2);
      await analyzeColumns(result);
    } catch (err) {
      console.error("[ImportDialog] Upload failed:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Step 2 - Analyze & Map
  // -------------------------------------------------------------------------
  const analyzeColumns = async (fileResult: ParsedFileResult) => {
    setLoading(true);
    setError(null);

    try {
      const suggestions = await apiFetch<MappingSuggestion[]>(
        "/import/analyze",
        {
          method: "POST",
          body: JSON.stringify({
            entityType,
            columns: fileResult.columns,
            sampleRows: fileResult.sampleRows,
          }),
        },
      );
      setMappings(suggestions);
    } catch (err) {
      console.error("[ImportDialog] Analysis failed:", err);
      // Fall back to empty mappings so the user can map manually
      setMappings(
        fileResult.columns.map((col) => ({
          sourceColumn: col,
          targetField: "",
          confidence: 0,
        })),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (index: number, targetField: string) => {
    setMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, targetField } : m)),
    );
  };

  // -------------------------------------------------------------------------
  // Step 3 - Preview
  // -------------------------------------------------------------------------
  const activeMappings = mappings.filter((m) => m.targetField);

  const previewRows = (parsedFile?.sampleRows ?? []).slice(0, 5);

  const previewHeaders = activeMappings.map((m) => {
    const field = entityFields.find((f) => f.key === m.targetField);
    return { sourceColumn: m.sourceColumn, label: field?.label ?? m.targetField };
  });

  // -------------------------------------------------------------------------
  // Step 4 - Execute Import
  // -------------------------------------------------------------------------
  const handleImport = async () => {
    if (!parsedFile) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiFetch<ImportResult>("/import/execute", {
        method: "POST",
        body: JSON.stringify({
          fileId: parsedFile.fileId,
          entityType,
          mappings: activeMappings.map((m) => ({
            sourceColumn: m.sourceColumn,
            targetField: m.targetField,
          })),
        }),
      });
      setImportResult(result);
      setStep(4);
    } catch (err) {
      console.error("[ImportDialog] Import failed:", err);
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Step descriptions
  // -------------------------------------------------------------------------
  const stepTitles: Record<number, string> = {
    1: `Import ${entityLabel}`,
    2: "Map Columns",
    3: "Preview Import",
    4: "Import Results",
  };

  const stepDescriptions: Record<number, string> = {
    1: "Upload a CSV or Excel file to get started.",
    2: "Match your file columns to the correct fields.",
    3: "Review the data before importing.",
    4: "Your import has completed.",
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{stepTitles[step]}</DialogTitle>
          <DialogDescription>{stepDescriptions[step]}</DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1 — Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 cursor-pointer hover:border-muted-foreground/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">
                  Click to select a file
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports CSV, XLSX, and XLS files
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {selectedFile && (
              <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
                <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {loading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Mapping */}
        {step === 2 && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Analyzing columns...
                </p>
              </div>
            ) : (
              <>
                <ColumnMappingTable
                  mappings={mappings}
                  sampleRows={parsedFile?.sampleRows ?? []}
                  entityFields={entityFields}
                  onMappingChange={handleMappingChange}
                />
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep(1);
                      setSelectedFile(null);
                      setParsedFile(null);
                      setMappings([]);
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={activeMappings.length === 0}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3 — Preview */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Showing first {previewRows.length} of{" "}
              <span className="font-medium text-foreground">
                {parsedFile?.totalRows ?? 0}
              </span>{" "}
              rows with{" "}
              <span className="font-medium text-foreground">
                {activeMappings.length}
              </span>{" "}
              mapped columns.
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {previewHeaders.map((h) => (
                      <TableHead key={h.sourceColumn}>{h.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={previewHeaders.length || 1}
                        className="h-20 text-center text-muted-foreground"
                      >
                        No data to preview.
                      </TableCell>
                    </TableRow>
                  ) : (
                    previewRows.map((row, rowIdx) => (
                      <TableRow key={rowIdx}>
                        {activeMappings.map((m) => (
                          <TableCell
                            key={m.sourceColumn}
                            className="max-w-[200px] truncate text-sm"
                          >
                            {row[m.sourceColumn] ?? ""}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {loading ? "Importing..." : "Import"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4 — Results */}
        {step === 4 && importResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-4">
              <CheckCircle className="h-8 w-8 text-green-500 shrink-0" />
              <div>
                <p className="font-medium">Import Complete</p>
                <p className="text-sm text-muted-foreground">
                  Your {entityLabel.toLowerCase()} have been processed.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md border p-3 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {importResult.created}
                </p>
                <Badge className="mt-1 bg-green-500/15 text-green-700 border-green-500/25 hover:bg-green-500/15">
                  Created
                </Badge>
              </div>
              <div className="rounded-md border p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {importResult.skipped}
                </p>
                <Badge className="mt-1 bg-amber-500/15 text-amber-700 border-amber-500/25 hover:bg-amber-500/15">
                  Skipped
                </Badge>
              </div>
              <div className="rounded-md border p-3 text-center">
                <p className="text-2xl font-bold text-red-600">
                  {importResult.errors.length}
                </p>
                <Badge className="mt-1 bg-red-500/15 text-red-700 border-red-500/25 hover:bg-red-500/15">
                  Errors
                </Badge>
              </div>
            </div>

            {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    Error Details
                  </p>
                  <div className="max-h-40 overflow-y-auto rounded-md border bg-muted/30 p-3 space-y-1.5">
                    {importResult.errors.map((detail, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm"
                      >
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-destructive shrink-0" />
                        <span>
                          <span className="font-medium">Row {detail.row}:</span>{" "}
                          {detail.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  handleOpenChange(false);
                  onSuccess?.();
                }}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
