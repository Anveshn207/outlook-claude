"use client";

import { useState } from "react";
import { Users, Briefcase, Building2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImportDialog } from "@/components/shared/import-dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EntityType = "candidate" | "job" | "client";

interface ImportCard {
  entity: EntityType;
  title: string;
  description: string;
  icon: typeof Users;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const importCards: ImportCard[] = [
  {
    entity: "candidate",
    title: "Import Candidates",
    description:
      "Upload a CSV or Excel file with candidate data. AI will automatically map your columns.",
    icon: Users,
  },
  {
    entity: "job",
    title: "Import Jobs",
    description:
      "Upload a CSV or Excel file with job data. AI will automatically map your columns.",
    icon: Briefcase,
  },
  {
    entity: "client",
    title: "Import Clients",
    description:
      "Upload a CSV or Excel file with client data. AI will automatically map your columns.",
    icon: Building2,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImportPage() {
  const [selectedEntity, setSelectedEntity] = useState<EntityType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleImportClick(entity: EntityType) {
    setSelectedEntity(entity);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Import Data</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bulk import candidates, jobs, or clients from spreadsheet files.
        </p>
      </div>

      {/* Import Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {importCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.entity} className="flex flex-col">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <p className="text-xs text-muted-foreground">
                  Accepts: .csv, .xlsx, .xls
                </p>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleImportClick(card.entity)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Import Dialog */}
      <ImportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entityType={selectedEntity || "candidate"}
      />
    </div>
  );
}
