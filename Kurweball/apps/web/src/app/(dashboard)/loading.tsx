import { DataTableSkeleton } from "@/components/shared/skeletons";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
      </div>
      <DataTableSkeleton rows={8} columns={6} />
    </div>
  );
}
