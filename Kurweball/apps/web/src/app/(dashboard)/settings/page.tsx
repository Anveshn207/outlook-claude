"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { usePermissions } from "@/hooks/use-permissions";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

const tabs = [
  { id: "custom-fields", label: "Custom Fields" },
  { id: "pipeline-stages", label: "Pipeline Stages" },
  { id: "users", label: "Users" },
  { id: "general", label: "General" },
];

const ENTITY_TYPES = ["candidate", "job", "client", "submission"] as const;
type EntityType = (typeof ENTITY_TYPES)[number];

const FIELD_TYPES = [
  "TEXT",
  "NUMBER",
  "DATE",
  "SELECT",
  "MULTI_SELECT",
  "CHECKBOX",
  "URL",
  "EMAIL",
  "PHONE",
  "CURRENCY",
] as const;
type _FieldType = (typeof FIELD_TYPES)[number];

interface CustomFieldDef {
  id: string;
  entityType: string;
  fieldName: string;
  fieldKey: string;
  fieldType: string;
  options: unknown[] | null;
  isRequired: boolean;
  isFilterable: boolean;
  isVisibleInList: boolean;
  displayOrder: number;
  createdAt: string;
}

interface FieldFormData {
  fieldName: string;
  fieldKey: string;
  entityType: string;
  fieldType: string;
  options: string[];
  isRequired: boolean;
  isFilterable: boolean;
  isVisibleInList: boolean;
  displayOrder: number;
}

const fieldTypeColors: Record<string, string> = {
  TEXT: "bg-gray-100 text-gray-600 border-gray-200",
  NUMBER: "bg-indigo-100 text-indigo-700 border-indigo-200",
  DATE: "bg-cyan-100 text-cyan-700 border-cyan-200",
  SELECT: "bg-purple-100 text-purple-700 border-purple-200",
  MULTI_SELECT: "bg-violet-100 text-violet-700 border-violet-200",
  CHECKBOX: "bg-orange-100 text-orange-700 border-orange-200",
  URL: "bg-blue-100 text-blue-700 border-blue-200",
  EMAIL: "bg-teal-100 text-teal-700 border-teal-200",
  PHONE: "bg-lime-100 text-lime-700 border-lime-200",
  CURRENCY: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

const emptyForm: FieldFormData = {
  fieldName: "",
  fieldKey: "",
  entityType: "candidate",
  fieldType: "TEXT",
  options: [],
  isRequired: false,
  isFilterable: false,
  isVisibleInList: false,
  displayOrder: 0,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState("custom-fields");

  // Custom fields state
  const [entityFilter, setEntityFilter] = useState<EntityType>("candidate");
  const [fields, setFields] = useState<CustomFieldDef[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDef | null>(null);
  const [form, setForm] = useState<FieldFormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Options editor state
  const [newOption, setNewOption] = useState("");

  // ---------- Data fetching ----------

  const fetchFields = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<CustomFieldDef[]>(
        `/custom-fields?entityType=${entityFilter}`,
      );
      setFields(data);
    } catch (err) {
      console.error("[Settings] Failed to fetch custom fields:", err);
      setFields([]);
    } finally {
      setLoading(false);
    }
  }, [entityFilter]);

  useEffect(() => {
    if (activeTab === "custom-fields") {
      fetchFields();
    }
  }, [activeTab, fetchFields]);

  // ---------- Form helpers ----------

  function openAddDialog() {
    setEditingField(null);
    setForm({ ...emptyForm, entityType: entityFilter });
    setSlugManuallyEdited(false);
    setNewOption("");
    setDialogOpen(true);
  }

  function openEditDialog(field: CustomFieldDef) {
    setEditingField(field);
    setForm({
      fieldName: field.fieldName,
      fieldKey: field.fieldKey,
      entityType: field.entityType,
      fieldType: field.fieldType,
      options: Array.isArray(field.options)
        ? (field.options as string[])
        : [],
      isRequired: field.isRequired,
      isFilterable: field.isFilterable,
      isVisibleInList: field.isVisibleInList,
      displayOrder: field.displayOrder,
    });
    setSlugManuallyEdited(true); // don't auto-slug when editing
    setNewOption("");
    setDialogOpen(true);
  }

  function handleFieldNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      fieldName: value,
      fieldKey: slugManuallyEdited ? prev.fieldKey : slugify(value),
    }));
  }

  function handleFieldKeyChange(value: string) {
    setSlugManuallyEdited(true);
    setForm((prev) => ({ ...prev, fieldKey: value }));
  }

  function addOption() {
    const trimmed = newOption.trim();
    if (!trimmed) return;
    if (form.options.includes(trimmed)) return;
    setForm((prev) => ({ ...prev, options: [...prev.options, trimmed] }));
    setNewOption("");
  }

  function removeOption(idx: number) {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== idx),
    }));
  }

  // ---------- CRUD ----------

  async function handleSave() {
    if (!form.fieldName.trim() || !form.fieldKey.trim()) return;
    setSaving(true);
    try {
      const payload = {
        fieldName: form.fieldName.trim(),
        fieldKey: form.fieldKey.trim(),
        entityType: form.entityType,
        fieldType: form.fieldType,
        options:
          form.fieldType === "SELECT" || form.fieldType === "MULTI_SELECT"
            ? form.options
            : null,
        isRequired: form.isRequired,
        isFilterable: form.isFilterable,
        isVisibleInList: form.isVisibleInList,
        displayOrder: form.displayOrder,
      };

      if (editingField) {
        await apiFetch(`/custom-fields/${editingField.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(`/custom-fields`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setDialogOpen(false);
      await fetchFields();
    } catch (err) {
      console.error("[Settings] Failed to save custom field:", err);
      alert(err instanceof Error ? err.message : "Failed to save custom field");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(field: CustomFieldDef) {
    if (
      !window.confirm(
        `Delete custom field "${field.fieldName}"? This cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await apiFetch(`/custom-fields/${field.id}`, { method: "DELETE" });
      await fetchFields();
    } catch (err) {
      console.error("[Settings] Failed to delete custom field:", err);
      alert(
        err instanceof Error ? err.message : "Failed to delete custom field",
      );
    }
  }

  // ---------- Render helpers ----------

  const showOptionsEditor =
    form.fieldType === "SELECT" || form.fieldType === "MULTI_SELECT";

  if (!can("settings:read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          You don&apos;t have permission to access settings.
        </p>
      </div>
    );
  }

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

      {/* ================================================================= */}
      {/* CUSTOM FIELDS TAB                                                  */}
      {/* ================================================================= */}
      {activeTab === "custom-fields" && (
        <div className="space-y-4">
          {/* Top bar: description + entity filter + add button */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Define custom fields to capture additional data on candidates,
              jobs, clients, and submissions.
            </p>
            <div className="flex items-center gap-3">
              <Select
                value={entityFilter}
                onValueChange={(v) => setEntityFilter(v as EntityType)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((et) => (
                    <SelectItem key={et} value={et}>
                      {et.charAt(0).toUpperCase() + et.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {can("custom-fields:create") && (
                <Button onClick={openAddDialog}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Custom Field
                </Button>
              )}
            </div>
          </div>

          {/* Table */}
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
                        Key
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
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Visible in List
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Order
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          Loading...
                        </td>
                      </tr>
                    )}
                    {!loading && fields.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          No custom fields defined for{" "}
                          {entityFilter.charAt(0).toUpperCase() +
                            entityFilter.slice(1)}
                          .
                        </td>
                      </tr>
                    )}
                    {!loading &&
                      fields.map((field) => (
                        <tr
                          key={field.id}
                          className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/30"
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            {field.fieldName}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            {field.fieldKey}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={
                                fieldTypeColors[field.fieldType] ??
                                "bg-gray-100 text-gray-600 border-gray-200"
                              }
                              variant="outline"
                            >
                              {field.fieldType}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground capitalize">
                            {field.entityType}
                          </td>
                          <td className="px-4 py-3">
                            {field.isRequired ? (
                              <Badge variant="secondary" className="text-xs">
                                Required
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">
                                Optional
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {field.isVisibleInList ? "Yes" : "No"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {field.displayOrder}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {can("custom-fields:update") && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openEditDialog(field)}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                              )}
                              {can("custom-fields:delete") && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(field)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ----------------------------------------------------------- */}
          {/* Add / Edit Dialog                                             */}
          {/* ----------------------------------------------------------- */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingField ? "Edit Custom Field" : "Add Custom Field"}
                </DialogTitle>
                <DialogDescription>
                  {editingField
                    ? "Update the custom field definition."
                    : "Create a new custom field for your entities."}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-2">
                {/* Field Name */}
                <div className="grid gap-2">
                  <Label htmlFor="cf-fieldName">
                    Field Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cf-fieldName"
                    value={form.fieldName}
                    onChange={(e) => handleFieldNameChange(e.target.value)}
                    placeholder="e.g. Visa Status"
                  />
                </div>

                {/* Field Key */}
                <div className="grid gap-2">
                  <Label htmlFor="cf-fieldKey">
                    Field Key <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cf-fieldKey"
                    value={form.fieldKey}
                    onChange={(e) => handleFieldKeyChange(e.target.value)}
                    placeholder="e.g. visa_status"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-generated from field name. You can override it.
                  </p>
                </div>

                {/* Entity Type */}
                <div className="grid gap-2">
                  <Label>Entity Type</Label>
                  <Select
                    value={form.entityType}
                    onValueChange={(v) =>
                      setForm((prev) => ({ ...prev, entityType: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((et) => (
                        <SelectItem key={et} value={et}>
                          {et.charAt(0).toUpperCase() + et.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Field Type */}
                <div className="grid gap-2">
                  <Label>Field Type</Label>
                  <Select
                    value={form.fieldType}
                    onValueChange={(v) =>
                      setForm((prev) => ({ ...prev, fieldType: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((ft) => (
                        <SelectItem key={ft} value={ft}>
                          {ft.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Options editor (SELECT / MULTI_SELECT only) */}
                {showOptionsEditor && (
                  <div className="grid gap-2">
                    <Label>Options</Label>
                    <div className="space-y-2">
                      {form.options.map((opt, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm"
                        >
                          <span className="flex-1">{opt}</span>
                          <button
                            type="button"
                            onClick={() => removeOption(idx)}
                            className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          value={newOption}
                          onChange={(e) => setNewOption(e.target.value)}
                          placeholder="Add an option..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addOption();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addOption}
                          className="shrink-0"
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Toggles row */}
                <div className="grid grid-cols-3 gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.isRequired}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          isRequired: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    Required
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.isFilterable}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          isFilterable: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    Filterable
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.isVisibleInList}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          isVisibleInList: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    Visible in List
                  </label>
                </div>

                {/* Display Order */}
                <div className="grid gap-2">
                  <Label htmlFor="cf-displayOrder">Display Order</Label>
                  <Input
                    id="cf-displayOrder"
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        displayOrder: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    min={0}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={
                    saving || !form.fieldName.trim() || !form.fieldKey.trim()
                  }
                >
                  {saving
                    ? "Saving..."
                    : editingField
                      ? "Update Field"
                      : "Create Field"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* ================================================================= */}
      {/* PIPELINE STAGES TAB (unchanged)                                    */}
      {/* ================================================================= */}
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

      {/* ================================================================= */}
      {/* USERS TAB (unchanged)                                              */}
      {/* ================================================================= */}
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

      {/* ================================================================= */}
      {/* GENERAL TAB (unchanged)                                            */}
      {/* ================================================================= */}
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
