"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "custom-fields", label: "Custom Fields" },
  { id: "pipeline-stages", label: "Pipeline Stages" },
  { id: "users", label: "Users" },
  { id: "general", label: "General" },
];

type FieldType = "select" | "url" | "currency" | "text";

interface CustomField {
  id: string;
  name: string;
  type: FieldType;
  entity: string;
  required: boolean;
}

const fieldTypeColors: Record<FieldType, string> = {
  select: "bg-purple-100 text-purple-700 border-purple-200",
  url: "bg-blue-100 text-blue-700 border-blue-200",
  currency: "bg-emerald-100 text-emerald-700 border-emerald-200",
  text: "bg-gray-100 text-gray-600 border-gray-200",
};

const customFields: CustomField[] = [
  {
    id: "1",
    name: "Visa Status",
    type: "select",
    entity: "Candidate",
    required: true,
  },
  {
    id: "2",
    name: "LinkedIn URL",
    type: "url",
    entity: "Candidate",
    required: false,
  },
  {
    id: "3",
    name: "Rate",
    type: "currency",
    entity: "Job",
    required: true,
  },
  {
    id: "4",
    name: "Availability",
    type: "text",
    entity: "Candidate",
    required: false,
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("custom-fields");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your recruiting platform preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "custom-fields" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Define custom fields to capture additional data on candidates, jobs,
              and clients.
            </p>
            <Button>
              <Plus className="h-4 w-4" />
              Add Custom Field
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Field Name
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Entity
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Required
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {customFields.map((field) => (
                      <tr
                        key={field.id}
                        className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {field.name}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={fieldTypeColors[field.type]}
                            variant="outline"
                          >
                            {field.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {field.entity}
                        </td>
                        <td className="px-4 py-3">
                          {field.required ? (
                            <Badge variant="secondary" className="text-xs">
                              Required
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Optional</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "pipeline-stages" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline Stages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
              <p className="text-sm text-muted-foreground">
                Pipeline stage configuration coming soon
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "users" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
              <p className="text-sm text-muted-foreground">
                User management coming soon
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "general" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
              <p className="text-sm text-muted-foreground">
                General settings coming soon
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
