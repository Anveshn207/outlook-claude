"use client";

import { useCallback, useState } from "react";
import { Download, FileSpreadsheet, FileText, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api";

type ExportEntity = "candidates" | "jobs" | "clients" | "submissions" | "interviews" | "tasks" | "bench-sales" | "users";
type ExportFormat = "csv" | "xlsx" | "docx";

interface ExportDropdownProps {
  entity: ExportEntity;
  filters?: Record<string, string>;
}

const FORMAT_CONFIG: Record<
  ExportFormat,
  { label: string; extension: string; icon: typeof File; mime: string }
> = {
  csv: {
    label: "CSV (.csv)",
    extension: "csv",
    icon: FileText,
    mime: "text/csv",
  },
  xlsx: {
    label: "Excel (.xlsx)",
    extension: "xlsx",
    icon: FileSpreadsheet,
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  docx: {
    label: "Word (.docx)",
    extension: "docx",
    icon: File,
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
};

export function ExportDropdown({ entity, filters }: ExportDropdownProps) {
  const [loadingFormat, setLoadingFormat] = useState<ExportFormat | null>(null);
  const toast = useToast((s) => s.toast);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setLoadingFormat(format);

      try {
        const params = new URLSearchParams({ format });
        const appliedFilters: string[] = [];
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== "all") {
              params.set(key, value);
              appliedFilters.push(`${key}=${value}`);
            }
          });
        }
        const url = `${API_BASE_URL}/export/${entity}?${params}`;
        console.log(`[ExportDropdown] Exporting: ${url}, filters:`, appliedFilters);

        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();
          let message: string;
          try {
            const parsed = JSON.parse(errorText);
            message = parsed.message || parsed.error || errorText;
          } catch {
            message = errorText;
          }
          throw new Error(
            `Export failed (${response.status}): ${message}`,
          );
        }

        const blob = await response.blob();
        const config = FORMAT_CONFIG[format];
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `${entity}-${timestamp}.${config.extension}`;

        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);

        toast({
          title: `Exported ${entity} as ${config.extension.toUpperCase()}`,
          description: appliedFilters.length > 0
            ? `Filters: ${appliedFilters.join(", ")}`
            : "No filters applied — exported all records",
          variant: "success",
        });
      } catch (error) {
        console.error(
          `[ExportDropdown] Failed to export ${entity} as ${format}:`,
          error instanceof Error ? error.message : error,
        );
        toast({
          title: "Export failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "error",
        });
      } finally {
        setLoadingFormat(null);
      }
    },
    [entity, filters, toast],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loadingFormat !== null}>
          {loadingFormat ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.entries(FORMAT_CONFIG) as [ExportFormat, (typeof FORMAT_CONFIG)[ExportFormat]][]).map(
          ([format, config]) => {
            const Icon = config.icon;
            const isLoading = loadingFormat === format;

            return (
              <DropdownMenuItem
                key={format}
                disabled={loadingFormat !== null}
                onClick={() => handleExport(format)}
                className="cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                {config.label}
              </DropdownMenuItem>
            );
          },
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
