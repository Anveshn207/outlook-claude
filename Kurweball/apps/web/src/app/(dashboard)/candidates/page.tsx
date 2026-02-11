"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type CandidateStatus = "Active" | "Passive" | "Placed" | "DND";

interface Candidate {
  id: string;
  name: string;
  email: string;
  status: CandidateStatus;
  source: string;
  location: string;
  skills: string[];
}

const statusColors: Record<CandidateStatus, string> = {
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Passive: "bg-amber-100 text-amber-700 border-amber-200",
  Placed: "bg-blue-100 text-blue-700 border-blue-200",
  DND: "bg-red-100 text-red-700 border-red-200",
};

const candidates: Candidate[] = [
  {
    id: "1",
    name: "Sarah Chen",
    email: "sarah.chen@email.com",
    status: "Active",
    source: "LinkedIn",
    location: "San Francisco, CA",
    skills: ["React", "TypeScript", "Node.js"],
  },
  {
    id: "2",
    name: "James Wilson",
    email: "james.w@email.com",
    status: "Active",
    source: "Referral",
    location: "New York, NY",
    skills: ["Java", "Spring Boot", "AWS"],
  },
  {
    id: "3",
    name: "Maria Garcia",
    email: "m.garcia@email.com",
    status: "Passive",
    source: "Indeed",
    location: "Austin, TX",
    skills: ["Python", "Django", "PostgreSQL"],
  },
  {
    id: "4",
    name: "David Park",
    email: "david.park@email.com",
    status: "Placed",
    source: "LinkedIn",
    location: "Seattle, WA",
    skills: ["Go", "Kubernetes", "Docker"],
  },
  {
    id: "5",
    name: "Emily Johnson",
    email: "emily.j@email.com",
    status: "Active",
    source: "Career Fair",
    location: "Chicago, IL",
    skills: ["React", "Next.js", "Tailwind"],
  },
  {
    id: "6",
    name: "Michael Brown",
    email: "m.brown@email.com",
    status: "DND",
    source: "LinkedIn",
    location: "Denver, CO",
    skills: ["C#", ".NET", "Azure"],
  },
  {
    id: "7",
    name: "Lisa Zhang",
    email: "lisa.z@email.com",
    status: "Active",
    source: "Referral",
    location: "Los Angeles, CA",
    skills: ["Python", "ML", "TensorFlow"],
  },
  {
    id: "8",
    name: "Robert Taylor",
    email: "r.taylor@email.com",
    status: "Passive",
    source: "Job Board",
    location: "Boston, MA",
    skills: ["Java", "Microservices", "Kafka"],
  },
  {
    id: "9",
    name: "Amanda Lee",
    email: "amanda.lee@email.com",
    status: "Active",
    source: "LinkedIn",
    location: "Portland, OR",
    skills: ["Ruby", "Rails", "PostgreSQL"],
  },
  {
    id: "10",
    name: "Chris Martinez",
    email: "chris.m@email.com",
    status: "Active",
    source: "Indeed",
    location: "Miami, FL",
    skills: ["TypeScript", "Angular", "Firebase"],
  },
];

export default function CandidatesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Candidates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your candidate pool and track their status.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Add Candidate
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
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Skills
                  </th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr
                    key={candidate.id}
                    className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {candidate.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {candidate.email}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={statusColors[candidate.status]}
                        variant="outline"
                      >
                        {candidate.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {candidate.source}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {candidate.location}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {candidate.skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
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
