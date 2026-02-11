"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type JobStatus = "Open" | "On Hold" | "Closed" | "Filled";
type JobPriority = "HOT" | "High" | "Medium" | "Low";
type JobType = "Full-Time" | "Contract" | "Contract-to-Hire";

interface Job {
  id: string;
  title: string;
  client: string;
  status: JobStatus;
  type: JobType;
  priority: JobPriority;
  location: string;
  positions: number;
}

const statusColors: Record<JobStatus, string> = {
  Open: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "On Hold": "bg-amber-100 text-amber-700 border-amber-200",
  Closed: "bg-gray-100 text-gray-600 border-gray-200",
  Filled: "bg-blue-100 text-blue-700 border-blue-200",
};

const priorityColors: Record<JobPriority, string> = {
  HOT: "bg-red-100 text-red-700 border-red-200",
  High: "bg-orange-100 text-orange-700 border-orange-200",
  Medium: "bg-blue-100 text-blue-700 border-blue-200",
  Low: "bg-gray-100 text-gray-600 border-gray-200",
};

const jobs: Job[] = [
  {
    id: "1",
    title: "Senior React Developer",
    client: "Acme Corp",
    status: "Open",
    type: "Full-Time",
    priority: "HOT",
    location: "San Francisco, CA",
    positions: 2,
  },
  {
    id: "2",
    title: "Java Backend Engineer",
    client: "TechFlow Inc",
    status: "Open",
    type: "Full-Time",
    priority: "High",
    location: "New York, NY (Remote)",
    positions: 1,
  },
  {
    id: "3",
    title: "DevOps Engineer",
    client: "CloudBase",
    status: "Open",
    type: "Contract",
    priority: "Medium",
    location: "Austin, TX",
    positions: 1,
  },
  {
    id: "4",
    title: "Product Manager",
    client: "NovaSoft",
    status: "On Hold",
    type: "Full-Time",
    priority: "Low",
    location: "Seattle, WA",
    positions: 3,
  },
  {
    id: "5",
    title: "Data Scientist",
    client: "Acme Corp",
    status: "Filled",
    type: "Contract-to-Hire",
    priority: "Medium",
    location: "Chicago, IL (Hybrid)",
    positions: 1,
  },
];

export default function JobsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Jobs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track open positions and manage job requisitions.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Add Job
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Location
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Positions
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {job.title}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {job.client}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={statusColors[job.status]}
                        variant="outline"
                      >
                        {job.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {job.type}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={priorityColors[job.priority]}
                        variant="outline"
                      >
                        {job.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {job.location}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {job.positions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
