"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff } from "lucide-react";
import type { CredentialType } from "@/hooks/useCredentials";

export type CredentialFormState = {
  name: string;
  type: CredentialType;
  provider: string;
  model: string;
  apiKey: string;
  metadataText: string;
  isActive: "true" | "false";
};

export const TYPE_OPTIONS: CredentialType[] = [
  "LLM",
  "MARKET",
  "DATABASE",
  "OTHER",
];

export function CredentialForm({
  form,
  setForm,
  isEdit,
}: {
  form: CredentialFormState;
  setForm: (updater: CredentialFormState) => void;
  isEdit: boolean;
}) {
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2 sm:col-span-2">
        <Label>Name</Label>
        <Input
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Primary Groq"
        />
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <Select
          value={form.type}
          onValueChange={(value) =>
            setForm({ ...form, type: value as CredentialType })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
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

      <div className="space-y-2">
        <Label>Provider</Label>
        <Input
          value={form.provider}
          onChange={(event) =>
            setForm({ ...form, provider: event.target.value })
          }
          placeholder="groq / google / alpaca"
        />
      </div>

      <div className="space-y-2">
        <Label>Model (optional)</Label>
        <Input
          value={form.model}
          onChange={(event) => setForm({ ...form, model: event.target.value })}
          placeholder="llama-3.3-70b-versatile"
        />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label>{isEdit ? "API Key (optional)" : "API Key"}</Label>
        <div className="relative">
          <Input
            value={form.apiKey}
            onChange={(event) =>
              setForm({ ...form, apiKey: event.target.value })
            }
            type={showApiKey ? "text" : "password"}
            placeholder={
              isEdit ? "Leave empty to keep existing" : "Enter API key"
            }
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowApiKey((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showApiKey ? "Hide API key" : "Show API key"}
          >
            {showApiKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label>Metadata JSON (optional)</Label>
        <Textarea
          value={form.metadataText}
          onChange={(event) =>
            setForm({ ...form, metadataText: event.target.value })
          }
          className="min-h-[120px] font-mono text-xs"
          placeholder='{"region": "us-east-1"}'
        />
      </div>
    </div>
  );
}
