"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ClientStatus = "Active" | "Prospect" | "Inactive";

interface Client {
  id: string;
  name: string;
  industry: string;
  status: ClientStatus;
  city: string;
  contactCount: number;
  jobsCount: number;
}

const statusColors: Record<ClientStatus, string> = {
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Prospect: "bg-amber-100 text-amber-700 border-amber-200",
  Inactive: "bg-gray-100 text-gray-600 border-gray-200",
};

const clients: Client[] = [
  {
    id: "1",
    name: "Acme Corp",
    industry: "Technology",
    status: "Active",
    city: "San Francisco",
    contactCount: 5,
    jobsCount: 8,
  },
  {
    id: "2",
    name: "TechFlow Inc",
    industry: "SaaS",
    status: "Active",
    city: "New York",
    contactCount: 3,
    jobsCount: 4,
  },
  {
    id: "3",
    name: "CloudBase",
    industry: "Cloud Infrastructure",
    status: "Active",
    city: "Austin",
    contactCount: 2,
    jobsCount: 6,
  },
  {
    id: "4",
    name: "NovaSoft",
    industry: "Enterprise Software",
    status: "Prospect",
    city: "Seattle",
    contactCount: 1,
    jobsCount: 2,
  },
  {
    id: "5",
    name: "DataPrime",
    industry: "Data Analytics",
    status: "Inactive",
    city: "Chicago",
    contactCount: 4,
    jobsCount: 0,
  },
];

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Clients</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your client relationships and track engagement.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Add Client
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
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Industry
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    City
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Contacts
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Jobs
                  </th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {client.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {client.industry}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={statusColors[client.status]}
                        variant="outline"
                      >
                        {client.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {client.city}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {client.contactCount}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {client.jobsCount}
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
