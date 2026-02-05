import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EdgeCondition } from "@/lib/types/types";

interface EdgeConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceNode: string;
  targetNode: string;
  initialCondition?: EdgeCondition | null;
  initialPriority?: number;
  onSave: (config: {
    condition: EdgeCondition | null;
    priority: number;
  }) => void;
}

export function EdgeConfigDialog({
  open,
  onOpenChange,
  sourceNode,
  targetNode,
  initialCondition,
  initialPriority = 0,
  onSave,
}: EdgeConfigDialogProps) {
  const [hasCondition, setHasCondition] = useState(!!initialCondition);
  const [field, setField] = useState(initialCondition?.field || "error");
  const [operator, setOperator] = useState<EdgeCondition["operator"]>(
    initialCondition?.operator || "exists",
  );
  const [value, setValue] = useState(initialCondition?.value || "");
  const [priority, setPriority] = useState(initialPriority);

  const handleSave = () => {
    const condition = hasCondition
      ? {
          field,
          operator,
          ...(operator !== "exists" && operator !== "not_exists" && { value }),
        }
      : null;

    onSave({ condition, priority });
    onOpenChange(false);
  };

  // Common state fields users might want to check
  const commonFields = [
    { value: "error", label: "Error" },
    { value: "approved", label: "Approved" },
    { value: "sqlAttempts", label: "SQL Attempts" },
    { value: "generatedSql", label: "Generated SQL" },
    { value: "queryResult", label: "Query Result" },
  ];

  // Quick presets for common conditions
  const quickPresets = [
    {
      label: "Yes (error exists)",
      field: "error",
      operator: "exists" as const,
    },
    {
      label: "No (no error)",
      field: "error",
      operator: "not_exists" as const,
    },
    {
      label: "Approved",
      field: "approved",
      operator: "eq" as const,
      value: "true",
    },
    {
      label: "Not Approved",
      field: "approved",
      operator: "ne" as const,
      value: "true",
    },
  ];

  const applyPreset = (preset: (typeof quickPresets)[0]) => {
    setHasCondition(true);
    setField(preset.field);
    setOperator(preset.operator);
    if ("value" in preset) {
      setValue(preset.value);
    }
  };

  const needsValue = operator !== "exists" && operator !== "not_exists";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configure Edge Condition</DialogTitle>
          <DialogDescription>
            From: {sourceNode} → To: {targetNode}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quick Presets */}
          <div className="space-y-2">
            <Label>Quick Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {quickPresets.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or customize
              </span>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              type="number"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Lower number = higher priority (0 is highest)
            </p>
          </div>

          {/* Has Condition Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hasCondition"
              checked={hasCondition}
              onChange={(e) => setHasCondition(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="hasCondition">Add custom routing condition</Label>
          </div>

          {hasCondition && (
            <>
              {/* Field */}
              <div className="space-y-2">
                <Label htmlFor="field">Field to Check</Label>
                <Select value={field} onValueChange={setField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonFields.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom field...</SelectItem>
                  </SelectContent>
                </Select>
                {field === "custom" && (
                  <Input
                    placeholder="Enter field name (e.g., user.email)"
                    onChange={(e) => setField(e.target.value)}
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Supports dot notation (e.g., user.email)
                </p>
              </div>

              {/* Operator */}
              <div className="space-y-2">
                <Label htmlFor="operator">Operator</Label>
                <Select
                  value={operator}
                  onValueChange={(v) =>
                    setOperator(v as EdgeCondition["operator"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exists">Exists</SelectItem>
                    <SelectItem value="not_exists">Not Exists</SelectItem>
                    <SelectItem value="eq">Equal (==)</SelectItem>
                    <SelectItem value="ne">Not Equal (!=)</SelectItem>
                    <SelectItem value="gt">Greater Than (&gt;)</SelectItem>
                    <SelectItem value="lt">Less Than (&lt;)</SelectItem>
                    <SelectItem value="gte">
                      Greater or Equal (&gt;=)
                    </SelectItem>
                    <SelectItem value="lte">Less or Equal (&lt;=)</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="starts_with">Starts With</SelectItem>
                    <SelectItem value="ends_with">Ends With</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Value (only if operator needs it) */}
              {needsValue && (
                <div className="space-y-2">
                  <Label htmlFor="value">Value to Compare</Label>
                  <Input
                    id="value"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Enter value (e.g., true, 10, 'text')"
                  />
                  <p className="text-xs text-muted-foreground">
                    For booleans use: true or false
                  </p>
                </div>
              )}

              {/* Preview */}
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="text-xs font-mono">
                  <strong>Condition:</strong> state.{field} {operator}{" "}
                  {needsValue && value}
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Edge Config</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Example usage in your Editor.tsx:
/*
const [edgeDialog, setEdgeDialog] = useState<{
  open: boolean;
  source: string;
  target: string;
} | null>(null);

const onConnect = useCallback((params: Connection) => {
  setEdgeDialog({
    open: true,
    source: params.source,
    target: params.target,
  });
}, []);

// In your JSX:
{edgeDialog && (
  <EdgeConfigDialog
    open={edgeDialog.open}
    onOpenChange={(open) => !open && setEdgeDialog(null)}
    sourceNode={edgeDialog.source}
    targetNode={edgeDialog.target}
    onSave={(config) => {
      setEdges((eds) => addEdge({
        source: edgeDialog.source,
        target: edgeDialog.target,
        data: {
          condition: config.condition,
          priority: config.priority,
        },
      }, eds));
      setEdgeDialog(null);
    }}
  />
)}
*/
