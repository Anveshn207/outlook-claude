"use client";

import { Badge } from "@/components/ui/badge";
import type { CustomFieldDef } from "@/hooks/use-custom-fields";

interface CustomFieldDisplayProps {
  field: CustomFieldDef;
  value: unknown;
}

export function CustomFieldDisplay({ field, value }: CustomFieldDisplayProps) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">-</span>;
  }

  switch (field.fieldType) {
    case "CHECKBOX":
      return <span>{value ? "Yes" : "No"}</span>;
    case "CURRENCY":
      return (
        <span>
          $
          {Number(value).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      );
    case "DATE":
      return <span>{new Date(String(value)).toLocaleDateString()}</span>;
    case "URL": {
      const url = String(value);
      if (!/^https?:\/\//i.test(url)) {
        return <span className="text-sm text-muted-foreground">{url}</span>;
      }
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          {url}
        </a>
      );
    }
    case "EMAIL":
      return (
        <a href={`mailto:${value}`} className="text-primary hover:underline">
          {String(value)}
        </a>
      );
    case "MULTI_SELECT":
      if (Array.isArray(value)) {
        return (
          <div className="flex flex-wrap gap-1">
            {value.map((v) => (
              <Badge key={String(v)} variant="secondary" className="text-xs">
                {String(v)}
              </Badge>
            ))}
          </div>
        );
      }
      return <span>{String(value)}</span>;
    case "SELECT": {
      if (Array.isArray(field.options)) {
        const opt = field.options.find((o) =>
          typeof o === "string" ? o === value : o.value === value
        );
        const label = opt
          ? typeof opt === "string"
            ? opt
            : opt.label
          : String(value);
        return <span>{label}</span>;
      }
      return <span>{String(value)}</span>;
    }
    default:
      return <span>{String(value)}</span>;
  }
}
