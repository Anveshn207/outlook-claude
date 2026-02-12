"use client";

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

interface ColumnMappingTableProps {
  mappings: { sourceColumn: string; targetField: string; confidence: number }[];
  sampleRows: Record<string, string>[];
  entityFields: { key: string; label: string }[];
  onMappingChange: (index: number, targetField: string) => void;
}

function truncate(value: string, maxLength: number): string {
  if (!value) return "";
  return value.length > maxLength ? value.slice(0, maxLength) + "..." : value;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 0.8) {
    return (
      <Badge className="bg-green-500/15 text-green-700 border-green-500/25 hover:bg-green-500/15">
        High
      </Badge>
    );
  }
  if (confidence >= 0.5) {
    return (
      <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/25 hover:bg-amber-500/15">
        Medium
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-500/15 text-gray-500 border-gray-500/25 hover:bg-gray-500/15">
      Low
    </Badge>
  );
}

export function ColumnMappingTable({
  mappings,
  sampleRows,
  entityFields,
  onMappingChange,
}: ColumnMappingTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Source Column</TableHead>
            <TableHead>Sample Data</TableHead>
            <TableHead>Maps To</TableHead>
            <TableHead className="w-[100px]">Confidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mappings.map((mapping, index) => {
            const samples = sampleRows
              .slice(0, 2)
              .map((row) => row[mapping.sourceColumn] ?? "")
              .filter(Boolean);

            return (
              <TableRow key={mapping.sourceColumn}>
                <TableCell className="font-semibold">
                  {mapping.sourceColumn}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs max-w-[200px]">
                  {samples.length > 0 ? (
                    <div className="space-y-0.5">
                      {samples.map((sample, i) => (
                        <div key={i} className="truncate">
                          {truncate(sample, 50)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="italic">No data</span>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={mapping.targetField || "__skip__"}
                    onValueChange={(value) =>
                      onMappingChange(index, value === "__skip__" ? "" : value)
                    }
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select field..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__skip__">
                        <span className="text-muted-foreground">Skip</span>
                      </SelectItem>
                      {entityFields.map((field) => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <ConfidenceBadge confidence={mapping.confidence} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
