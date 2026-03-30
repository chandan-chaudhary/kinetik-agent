"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";
import type { CredentialType } from "@/hooks/useCredentials";
import {
  CREDENTIAL_DEFINITIONS,
  getCredentialDef,
  type CredentialField,
} from "@/lib/credential-types";

export type CredentialFormState = {
  name: string;
  type: CredentialType;
  data: Record<string, unknown>;
  isActive: "true" | "false";
};

export function CredentialForm({
  form,
  setForm,
  isEdit,
}: {
  form: CredentialFormState;
  setForm: React.Dispatch<React.SetStateAction<CredentialFormState>>;
  isEdit: boolean;
}) {
  const def = getCredentialDef(form.type);
  console.log(form, 'in form data');
  

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="My Prod Database"
        />
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <Select
          value={form.type}
          onValueChange={(v) =>
            setForm({ ...form, type: v as CredentialType, data: {} })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CREDENTIAL_DEFINITIONS.map((d) => (
              <SelectItem key={d.type} value={d.type}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={form.isActive}
          onValueChange={(value) =>
            setForm({ ...form, isActive: value as "true" | "false" })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {def?.fields.map((field) => (
        <DynamicField
          key={field.key}
          field={field}
          value={(form.data?.[field.key] as unknown) ?? field.default ?? ""}
          onChange={(val) =>
            setForm((prev) => ({
              ...prev,
              data: { ...prev.data, [field.key]: val },
            }))
          }
          isEdit={isEdit}
        />
      ))}
    </div>
  );
}

function DynamicField({
  field,
  value,
  onChange,
  isEdit,
}: {
  field: CredentialField;
  value: unknown;
  onChange: (val: unknown) => void;
  isEdit: boolean;
}) {
  const [show, setShow] = useState(false);

  if (field.type === "select") {
    return (
      <div className="space-y-2">
        <Label>
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${field.label}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.type === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          id={field.key}
        />
        <Label htmlFor={field.key}>{field.label}</Label>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="relative">
        {/** number fields convert to string for input while keeping stored value numeric */}
        {(() => {
          const inputValue =
            field.type === "number"
              ? typeof value === "number"
                ? String(value)
                : value === undefined
                  ? ""
                  : String(value)
              : typeof value === "string"
                ? value
                : "";

          return (
            <Input
              type={field.type === "password" && !show ? "password" : "text"}
              value={inputValue}
              onChange={(e) =>
                onChange(
                  field.type === "number"
                    ? Number(e.target.value)
                    : e.target.value,
                )
              }
              placeholder={field.placeholder}
              disabled={isEdit && field.type === "password" && !value}
            />
          );
        })()}
        {field.type === "password" && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-label={show ? "Hide" : "Show"}
          >
            {show ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {field.hint && (
        <p className="text-xs text-muted-foreground">{field.hint}</p>
      )}
    </div>
  );
}
