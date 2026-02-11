"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

interface PipelineCandidate {
  id: string;
  name: string;
  title: string;
  date: string;
}

interface PipelineStage {
  name: string;
  color: string;
  bgColor: string;
  candidates: PipelineCandidate[];
}

const jobOptions = [
  "Senior React Developer",
  "Java Backend Engineer",
];

const pipelineData: Record<string, PipelineStage[]> = {
  "Senior React Developer": [
    {
      name: "Sourced",
      color: "bg-slate-500",
      bgColor: "bg-slate-50",
      candidates: [
        { id: "1", name: "Sarah Chen", title: "Frontend Engineer", date: "Feb 8" },
        { id: "2", name: "Lisa Zhang", title: "React Developer", date: "Feb 7" },
        { id: "3", name: "Chris Martinez", title: "Full Stack Dev", date: "Feb 6" },
      ],
    },
    {
      name: "Submitted",
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      candidates: [
        { id: "4", name: "Emily Johnson", title: "Senior Frontend", date: "Feb 5" },
        { id: "5", name: "Amanda Lee", title: "UI Engineer", date: "Feb 4" },
      ],
    },
    {
      name: "Shortlisted",
      color: "bg-indigo-500",
      bgColor: "bg-indigo-50",
      candidates: [
        { id: "6", name: "Robert Taylor", title: "Lead Frontend", date: "Feb 3" },
        { id: "7", name: "Michael Brown", title: "React Architect", date: "Feb 2" },
      ],
    },
    {
      name: "Interview",
      color: "bg-amber-500",
      bgColor: "bg-amber-50",
      candidates: [
        { id: "8", name: "Maria Garcia", title: "Senior React Dev", date: "Feb 1" },
      ],
    },
    {
      name: "Offered",
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50",
      candidates: [
        { id: "9", name: "James Wilson", title: "Staff Engineer", date: "Jan 30" },
      ],
    },
    {
      name: "Placed",
      color: "bg-green-600",
      bgColor: "bg-green-50",
      candidates: [],
    },
    {
      name: "Rejected",
      color: "bg-red-500",
      bgColor: "bg-red-50",
      candidates: [
        { id: "10", name: "David Park", title: "Junior React Dev", date: "Jan 28" },
      ],
    },
  ],
  "Java Backend Engineer": [
    {
      name: "Sourced",
      color: "bg-slate-500",
      bgColor: "bg-slate-50",
      candidates: [
        { id: "11", name: "Alex Reeves", title: "Java Developer", date: "Feb 9" },
        { id: "12", name: "Nina Patel", title: "Backend Engineer", date: "Feb 8" },
      ],
    },
    {
      name: "Submitted",
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      candidates: [
        { id: "13", name: "Tom Fischer", title: "Senior Java Dev", date: "Feb 6" },
      ],
    },
    {
      name: "Shortlisted",
      color: "bg-indigo-500",
      bgColor: "bg-indigo-50",
      candidates: [
        { id: "14", name: "Rachel Kim", title: "Java Architect", date: "Feb 4" },
        { id: "15", name: "Steve Adams", title: "Spring Boot Dev", date: "Feb 3" },
      ],
    },
    {
      name: "Interview",
      color: "bg-amber-500",
      bgColor: "bg-amber-50",
      candidates: [
        { id: "16", name: "Laura White", title: "Backend Lead", date: "Feb 1" },
        { id: "17", name: "Kevin Nguyen", title: "Java Engineer", date: "Jan 31" },
      ],
    },
    {
      name: "Offered",
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50",
      candidates: [],
    },
    {
      name: "Placed",
      color: "bg-green-600",
      bgColor: "bg-green-50",
      candidates: [
        { id: "18", name: "Derek Collins", title: "Sr Java Dev", date: "Jan 25" },
      ],
    },
    {
      name: "Rejected",
      color: "bg-red-500",
      bgColor: "bg-red-50",
      candidates: [
        { id: "19", name: "Olivia Hart", title: "Junior Backend", date: "Jan 29" },
      ],
    },
  ],
};

export default function PipelinePage() {
  const [selectedJob, setSelectedJob] = useState(jobOptions[0]);
  const stages = pipelineData[selectedJob] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pipeline</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track candidates through the hiring stages.
          </p>
        </div>

        {/* Job selector */}
        <div className="relative">
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="h-10 w-full appearance-none rounded-md border border-input bg-white py-2 pl-3 pr-10 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:w-72"
          >
            {jobOptions.map((job) => (
              <option key={job} value={job}>
                {job}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.name} className="flex w-64 shrink-0 flex-col">
            {/* Column header */}
            <div className={`flex items-center gap-2 rounded-t-lg px-3 py-2.5 ${stage.bgColor}`}>
              <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
              <span className="text-sm font-semibold text-foreground">
                {stage.name}
              </span>
              <span className="ml-auto rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {stage.candidates.length}
              </span>
            </div>

            {/* Cards area */}
            <div className="flex flex-1 flex-col gap-2 rounded-b-lg border border-t-0 border-border bg-muted/30 p-2">
              {stage.candidates.length === 0 && (
                <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-border">
                  <p className="text-xs text-muted-foreground">No candidates</p>
                </div>
              )}
              {stage.candidates.map((candidate) => (
                <Card
                  key={candidate.id}
                  className="cursor-default transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-3">
                    <p className="text-sm font-medium text-foreground">
                      {candidate.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {candidate.title}
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground/70">
                      {candidate.date}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
