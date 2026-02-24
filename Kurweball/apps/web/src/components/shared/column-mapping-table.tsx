"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
}

interface ColumnMappingTableProps {
  mappings: ColumnMapping[];
  sampleRows: Record<string, string>[];
  entityFields: { key: string; label: string }[];
  onMappingChange: (index: number, targetField: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(value: string, maxLength: number): string {
  if (!value) return "";
  return value.length > maxLength ? value.slice(0, maxLength) + "..." : value;
}

function isAutoMatched(mapping: ColumnMapping): boolean {
  return !!mapping.targetField && mapping.confidence >= 0.5;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 0.8) {
    return (
      <Badge className="bg-green-500/15 text-green-700 border-green-500/25 hover:bg-green-500/15 dark:text-green-400 dark:border-green-500/30 text-xs">
        High
      </Badge>
    );
  }
  if (confidence >= 0.5) {
    return (
      <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/25 hover:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30 text-xs">
        Medium
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-500/15 text-gray-500 border-gray-500/25 hover:bg-gray-500/15 dark:text-gray-400 dark:border-gray-500/30 text-xs">
      Low
    </Badge>
  );
}

function SampleDataCells({
  sourceColumn,
  sampleRows,
  count,
}: {
  sourceColumn: string;
  sampleRows: Record<string, string>[];
  count: number;
}) {
  const samples = sampleRows
    .slice(0, count)
    .map((row) => row[sourceColumn] ?? "")
    .filter(Boolean);

  if (samples.length === 0) {
    return <span className="italic text-muted-foreground/60">No data</span>;
  }

  return (
    <div className="space-y-0.5">
      {samples.map((sample, i) => (
        <div
          key={i}
          className="truncate font-mono text-xs text-muted-foreground/80"
        >
          {truncate(sample, 50)}
        </div>
      ))}
    </div>
  );
}

function FieldSelect({
  value,
  entityFields,
  takenFields,
  currentMappingIndex,
  mappings,
  onMappingChange,
}: {
  value: string;
  entityFields: { key: string; label: string }[];
  takenFields: Set<string>;
  currentMappingIndex: number;
  mappings: ColumnMapping[];
  onMappingChange: (index: number, targetField: string) => void;
}) {
  return (
    <Select
      value={value || "__skip__"}
      onValueChange={(v) =>
        onMappingChange(currentMappingIndex, v === "__skip__" ? "" : v)
      }
    >
      <SelectTrigger className="w-[200px] h-9 text-sm">
        <SelectValue placeholder="Select field..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__skip__">
          <span className="text-muted-foreground">-- Skip this column --</span>
        </SelectItem>
        {entityFields.map((field) => {
          const isTaken =
            takenFields.has(field.key) &&
            mappings[currentMappingIndex]?.targetField !== field.key;
          return (
            <SelectItem
              key={field.key}
              value={field.key}
              disabled={isTaken}
            >
              <span className={isTaken ? "text-muted-foreground" : ""}>
                {field.label}
                {isTaken && (
                  <span className="ml-1.5 text-xs opacity-60">
                    (already mapped)
                  </span>
                )}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ColumnMappingTable({
  mappings,
  sampleRows,
  entityFields,
  onMappingChange,
}: ColumnMappingTableProps) {
  // Split mappings into matched and unmatched, preserving original indices
  const { matched, unmatched, takenFields, unmappedEntityFields } =
    useMemo(() => {
      const matchedList: { mapping: ColumnMapping; originalIndex: number }[] =
        [];
      const unmatchedList: {
        mapping: ColumnMapping;
        originalIndex: number;
      }[] = [];
      const taken = new Set<string>();

      mappings.forEach((m, i) => {
        if (m.targetField) {
          taken.add(m.targetField);
        }
        if (isAutoMatched(m)) {
          matchedList.push({ mapping: m, originalIndex: i });
        } else {
          unmatchedList.push({ mapping: m, originalIndex: i });
        }
      });

      const unmappedFields = entityFields.filter(
        (f) => !taken.has(f.key),
      );

      return {
        matched: matchedList,
        unmatched: unmatchedList,
        takenFields: taken,
        unmappedEntityFields: unmappedFields,
      };
    }, [mappings, entityFields]);

  const totalColumns = mappings.length;
  const matchedCount = matched.length;
  const progressPercent =
    totalColumns > 0 ? Math.round((matchedCount / totalColumns) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* ----------------------------------------------------------------- */}
      {/* Section A: Auto-Matched Fields                                    */}
      {/* ----------------------------------------------------------------- */}
      {matched.length > 0 && (
        <div className="rounded-lg border border-green-500/30 overflow-hidden">
          {/* Section header */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border-b border-green-500/20">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
            <span className="text-sm font-semibold text-green-700 dark:text-green-400">
              Auto-Matched Fields
            </span>
            <Badge className="ml-auto bg-green-500/15 text-green-700 border-green-500/25 hover:bg-green-500/15 dark:text-green-400 text-xs">
              {matched.length} matched
            </Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-green-500/5 hover:bg-green-500/5">
                <TableHead className="w-[180px]">Source Column</TableHead>
                <TableHead className="w-[32px] px-0" />
                <TableHead className="w-[200px]">Maps To</TableHead>
                <TableHead>Sample Data</TableHead>
                <TableHead className="w-[90px] text-center">
                  Confidence
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matched.map(({ mapping, originalIndex }) => (
                  <TableRow
                    key={mapping.sourceColumn}
                    className="border-l-2 border-l-green-500/40"
                  >
                    <TableCell className="font-medium text-sm">
                      {mapping.sourceColumn}
                    </TableCell>
                    <TableCell className="px-0 text-center">
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </TableCell>
                    <TableCell>
                      <FieldSelect
                        value={mapping.targetField}
                        entityFields={entityFields}
                        takenFields={takenFields}
                        currentMappingIndex={originalIndex}
                        mappings={mappings}
                        onMappingChange={onMappingChange}
                      />
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <SampleDataCells
                        sourceColumn={mapping.sourceColumn}
                        sampleRows={sampleRows}
                        count={2}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <ConfidenceBadge confidence={mapping.confidence} />
                    </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Section B: Needs Your Input                                       */}
      {/* ----------------------------------------------------------------- */}
      {unmatched.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 overflow-hidden">
          {/* Section header */}
          <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                Needs Your Input
              </span>
              <Badge className="ml-auto bg-amber-500/15 text-amber-700 border-amber-500/25 hover:bg-amber-500/15 dark:text-amber-400 text-xs">
                {unmatched.length} unmatched
              </Badge>
            </div>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-1 ml-6">
              These columns couldn&apos;t be auto-matched. Select the correct
              field or skip them.
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-amber-500/5 hover:bg-amber-500/5">
                <TableHead className="w-[180px]">Source Column</TableHead>
                <TableHead className="w-[200px]">Maps To</TableHead>
                <TableHead>Sample Data</TableHead>
                <TableHead className="w-[90px] text-center">
                  Confidence
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unmatched.map(({ mapping, originalIndex }) => (
                <TableRow
                  key={mapping.sourceColumn}
                  className="border-l-2 border-l-amber-500/40"
                >
                  <TableCell className="font-medium text-sm">
                    {mapping.sourceColumn}
                  </TableCell>
                  <TableCell>
                    <FieldSelect
                      value={mapping.targetField}
                      entityFields={entityFields}
                      takenFields={takenFields}
                      currentMappingIndex={originalIndex}
                      mappings={mappings}
                      onMappingChange={onMappingChange}
                    />
                  </TableCell>
                  <TableCell className="max-w-[240px]">
                    <SampleDataCells
                      sourceColumn={mapping.sourceColumn}
                      sampleRows={sampleRows}
                      count={3}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <ConfidenceBadge confidence={mapping.confidence} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Summary Bar                                                       */}
      {/* ----------------------------------------------------------------- */}
      <div className="rounded-lg border bg-muted/30 px-4 py-3 space-y-2.5">
        {/* Progress row */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium whitespace-nowrap">
            {matchedCount} of {totalColumns} columns matched
          </span>
          {/* Mini progress bar */}
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progressPercent === 100
                  ? "bg-green-500"
                  : progressPercent >= 50
                    ? "bg-amber-500"
                    : "bg-gray-400"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-medium tabular-nums">
            {progressPercent}%
          </span>
        </div>

        {/* Unmapped entity fields */}
        {unmappedEntityFields.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">
              Unmapped fields:
            </span>
            {unmappedEntityFields.map((f) => (
              <Badge
                key={f.key}
                variant="outline"
                className="text-xs font-normal py-0 h-5"
              >
                {f.label}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
