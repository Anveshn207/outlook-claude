"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export interface SelectOption {
  label: string;
  value: string;
  color?: string;
}

export type CustomFieldType =
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "SELECT"
  | "MULTI_SELECT"
  | "CHECKBOX"
  | "URL"
  | "EMAIL"
  | "PHONE"
  | "CURRENCY";

export interface CustomFieldDef {
  id: string;
  entityType: string;
  fieldName: string;
  fieldKey: string;
  fieldType: CustomFieldType;
  options: SelectOption[] | null;
  isRequired: boolean;
  isFilterable: boolean;
  isVisibleInList: boolean;
  displayOrder: number;
}

export function useCustomFields(entityType: string) {
  const [fields, setFields] = useState<CustomFieldDef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch<CustomFieldDef[]>(`/custom-fields?entityType=${entityType}`)
      .then((data) => {
        if (!cancelled) setFields(data);
      })
      .catch((err) => {
        console.error("[useCustomFields] Failed to load:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entityType]);

  return { fields, loading };
}
