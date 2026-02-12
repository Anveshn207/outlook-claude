"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  className?: string;
  hideOnMobile?: boolean;
}

export interface BulkAction {
  label: string;
  icon?: ReactNode;
  variant?: "default" | "destructive";
  onClick: (selectedIds: string[]) => Promise<void> | void;
  confirmTitle?: string;
  confirmDescription?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  fetchData: (params: {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) => Promise<{ data: T[]; total: number }>;
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
  pageSize?: number;
  toolbar?: ReactNode;
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
  selectable?: boolean;
  bulkActions?: BulkAction[];
}

export function DataTable<T>({
  columns,
  fetchData,
  searchPlaceholder = "Search...",
  onRowClick,
  pageSize = 25,
  toolbar,
  emptyMessage = "No results found.",
  keyExtractor,
  selectable = false,
  bulkActions = [],
}: DataTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(pageSize);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchData({
        page,
        limit,
        search: debouncedSearch || undefined,
        sortBy,
        sortOrder,
      });
      setData(result.data);
      setTotal(result.total);
    } catch (err) {
      console.error("[DataTable] Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchData, page, limit, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset to page 1 and clear selection when search changes
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [debouncedSearch]);

  // Clear selection on page/sort change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, sortBy, sortOrder]);

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(columnKey);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // Selection handlers
  const allOnPageSelected =
    data.length > 0 && data.every((item) => selectedIds.has(keyExtractor(item)));

  const toggleAll = () => {
    if (allOnPageSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map((item) => keyExtractor(item))));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkAction = async (action: BulkAction) => {
    if (action.confirmTitle) {
      setConfirmAction(action);
      return;
    }
    await executeBulkAction(action);
  };

  const executeBulkAction = async (action: BulkAction) => {
    setBulkLoading(true);
    try {
      await action.onClick(Array.from(selectedIds));
      setSelectedIds(new Set());
      await loadData();
    } catch (err) {
      console.error("[DataTable] Bulk action failed:", err);
    } finally {
      setBulkLoading(false);
      setConfirmAction(null);
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortBy !== columnKey) {
      return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 text-muted-foreground/50" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1 inline h-3.5 w-3.5 text-primary" />
    ) : (
      <ArrowDown className="ml-1 inline h-3.5 w-3.5 text-primary" />
    );
  };

  const showBulkBar = selectable && selectedIds.size > 0 && bulkActions.length > 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {toolbar}
      </div>

      {/* Bulk action bar */}
      {showBulkBar && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
          <span className="text-sm font-medium text-primary">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            {bulkActions.map((action) => (
              <Button
                key={action.label}
                size="sm"
                variant={action.variant === "destructive" ? "destructive" : "outline"}
                onClick={() => handleBulkAction(action)}
                disabled={bulkLoading}
                className="h-7 text-xs"
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto h-7 text-xs"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {selectable && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allOnPageSelected && data.length > 0}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                )}
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={`${col.className ?? ""} ${col.hideOnMobile ? "hidden sm:table-cell" : ""}`}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        className="inline-flex items-center font-medium hover:text-foreground"
                        onClick={() => handleSort(col.key)}
                      >
                        {col.header}
                        <SortIcon columnKey={col.key} />
                      </button>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skel-${i}`}>
                    {selectable && (
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={col.hideOnMobile ? "hidden sm:table-cell" : ""}
                      >
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => {
                  const id = keyExtractor(item);
                  const isSelected = selectedIds.has(id);
                  return (
                    <TableRow
                      key={id}
                      className={`${onRowClick ? "cursor-pointer" : ""} ${isSelected ? "bg-primary/5" : ""}`}
                      onClick={() => onRowClick?.(item)}
                    >
                      {selectable && (
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleOne(id)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select row`}
                          />
                        </TableCell>
                      )}
                      {columns.map((col) => (
                        <TableCell
                          key={col.key}
                          className={`${col.className ?? ""} ${col.hideOnMobile ? "hidden sm:table-cell" : ""}`}
                        >
                          {col.render
                            ? col.render(item)
                            : String((item as Record<string, unknown>)[col.key] ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of{" "}
            {total}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for destructive bulk actions */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.confirmTitle ?? "Are you sure?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.confirmDescription ??
                `This action will affect ${selectedIds.size} selected item(s). This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmAction && executeBulkAction(confirmAction)}
              disabled={bulkLoading}
              className={
                confirmAction?.variant === "destructive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {bulkLoading ? "Processing..." : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
