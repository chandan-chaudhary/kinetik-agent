"use client";
import { useState, useMemo } from "react";
import { NodeTemplate } from "@/lib/types/workflow.types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NodeConfigPanelProps {
  open: boolean;
  template: NodeTemplate | null;
  initialConfig?: Record<string, any>;
  onClose: () => void;
  onSave: (config: Record<string, any>) => void;
}

export function NodeConfigPanel({
  open,
  template,
  initialConfig,
  onClose,
  onSave,
}: NodeConfigPanelProps) {
  const buildInitialConfig = (
    initial: Record<string, any> | undefined,
    tmpl: NodeTemplate | null,
  ) => {
    if (initial) return JSON.parse(JSON.stringify(initial));
    const schema = tmpl?.configSchema;
    if (!schema) return {};
    const props = schema.properties || {};
    const result: Record<string, any> = {};
    Object.keys(props).forEach((key) => {
      const s = props[key] as Record<string, any>;
      if (s.default !== undefined) result[key] = s.default;
      else if (s.type === "array") result[key] = [];
      else if (s.type === "boolean") result[key] = false;
      else if (s.type === "number") result[key] = 0;
      else result[key] = "";
    });
    return result;
  };

  const initial = useMemo(
    () => buildInitialConfig(initialConfig, template),
    [initialConfig, template],
  );

  const [config, setConfig] = useState<Record<string, any>>(initial);
  console.log(config, "in node config");

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  if (!template) return null;

  const renderField = (key: string, schema: Record<string, any>) => {
    const value = config[key] ?? schema.default ?? "";

    // Array field (for trading symbols, types, etc.)
    if (schema.type === "array" && schema.items?.enum) {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>{schema.title || key}</Label>
          <Select
            value={value[0] || ""}
            onValueChange={(newValue) =>
              setConfig({ ...config, [key]: [newValue] })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${schema.title || key}`} />
            </SelectTrigger>
            <SelectContent>
              {schema.items.enum.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {schema.description && (
            <p className="text-xs text-gray-500">{schema.description}</p>
          )}
        </div>
      );
    }

    // String with enum (dropdown)
    if (schema.type === "string" && schema.enum) {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>{schema.title || key}</Label>
          <Select
            value={value}
            onValueChange={(newValue) =>
              setConfig({ ...config, [key]: newValue })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${schema.title || key}`} />
            </SelectTrigger>
            <SelectContent>
              {schema.enum.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {schema.description && (
            <p className="text-xs text-gray-500">{schema.description}</p>
          )}
        </div>
      );
    }

    // Number input
    if (schema.type === "number") {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>{schema.title || key}</Label>
          <Input
            id={key}
            type="number"
            value={value}
            min={schema.minimum}
            max={schema.maximum}
            onChange={(e) =>
              setConfig({
                ...config,
                [key]: e.target.value === "" ? 0 : Number(e.target.value),
              })
            }
          />
          {schema.description && (
            <p className="text-xs text-gray-500">{schema.description}</p>
          )}
        </div>
      );
    }

    // Boolean checkbox
    if (schema.type === "boolean") {
      return (
        <div key={key} className="flex items-center space-x-2">
          <input
            id={key}
            type="checkbox"
            checked={value}
            onChange={(e) => setConfig({ ...config, [key]: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor={key}>{schema.title || key}</Label>
          {schema.description && (
            <p className="text-xs text-gray-500">{schema.description}</p>
          )}
        </div>
      );
    }

    // Default: text input
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key}>{schema.title || key}</Label>
        <Input
          id={key}
          type="text"
          value={value}
          onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
        />
        {schema.description && (
          <p className="text-xs text-gray-500">{schema.description}</p>
        )}
      </div>
    );
  };

  const configSchema = template.configSchema;
  const properties = configSchema?.properties || {};

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {template.icon} {template.name}
          </SheetTitle>
          <SheetDescription>{template.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {Object.keys(properties).map((key) =>
            renderField(key, properties[key]),
          )}
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
