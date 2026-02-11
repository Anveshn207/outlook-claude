"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomFieldDef } from "@/hooks/use-custom-fields";

interface CustomFieldInputProps {
  field: CustomFieldDef;
  value?: unknown;
  onChange?: (fieldKey: string, value: unknown) => void;
}

export function CustomFieldInput({ field, value, onChange }: CustomFieldInputProps) {
  const handleChange = (val: unknown) => {
    onChange?.(field.fieldKey, val);
  };

  const id = `cf_${field.fieldKey}`;

  if (field.fieldType === "CHECKBOX") {
    return (
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          checked={!!value}
          onChange={(e) => handleChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor={id} className="text-sm font-normal">
          {field.fieldName}
        </Label>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {field.fieldName}
        {field.isRequired && " *"}
      </Label>
      {renderInput()}
    </div>
  );

  function renderInput() {
    switch (field.fieldType) {
      case "TEXT":
        return (
          <Input
            id={id}
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => handleChange(e.target.value)}
            required={field.isRequired}
          />
        );
      case "NUMBER":
        return (
          <Input
            id={id}
            type="number"
            value={(value as string) ?? ""}
            onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : null)}
            required={field.isRequired}
          />
        );
      case "DATE":
        return (
          <Input
            id={id}
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => handleChange(e.target.value)}
            required={field.isRequired}
          />
        );
      case "SELECT":
        return (
          <select
            id={id}
            value={(value as string) ?? ""}
            onChange={(e) => handleChange(e.target.value)}
            required={field.isRequired}
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          >
            <option value="">Select...</option>
            {Array.isArray(field.options) &&
              field.options.map((opt) => {
                const optValue = typeof opt === "string" ? opt : opt.value;
                const optLabel = typeof opt === "string" ? opt : opt.label;
                return (
                  <option key={optValue} value={optValue}>
                    {optLabel}
                  </option>
                );
              })}
          </select>
        );
      case "MULTI_SELECT": {
        const selected = Array.isArray(value) ? (value as string[]) : [];
        return (
          <div className="space-y-1.5">
            {Array.isArray(field.options) &&
              field.options.map((opt) => {
                const optValue = typeof opt === "string" ? opt : opt.value;
                const optLabel = typeof opt === "string" ? opt : opt.label;
                return (
                  <label key={optValue} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selected.includes(optValue)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...selected, optValue]
                          : selected.filter((v) => v !== optValue);
                        handleChange(next);
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    {optLabel}
                  </label>
                );
              })}
          </div>
        );
      }
      case "URL":
        return (
          <Input
            id={id}
            type="url"
            placeholder="https://"
            value={(value as string) ?? ""}
            onChange={(e) => handleChange(e.target.value)}
            required={field.isRequired}
          />
        );
      case "EMAIL":
        return (
          <Input
            id={id}
            type="email"
            value={(value as string) ?? ""}
            onChange={(e) => handleChange(e.target.value)}
            required={field.isRequired}
          />
        );
      case "PHONE":
        return (
          <Input
            id={id}
            type="tel"
            value={(value as string) ?? ""}
            onChange={(e) => handleChange(e.target.value)}
            required={field.isRequired}
          />
        );
      case "CURRENCY":
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              id={id}
              type="number"
              step="0.01"
              className="pl-7"
              value={(value as string) ?? ""}
              onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : null)}
              required={field.isRequired}
            />
          </div>
        );
      default:
        return (
          <Input
            id={id}
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
    }
  }
}
