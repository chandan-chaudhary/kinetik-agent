import { memo, useState } from "react";
import { Node, NodeProps, useReactFlow, Handle, Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import CustomDialog from "@/components/CutomDialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const conditionSchema = z.object({
  field: z.string().min(1, "Field is required"),
  operator: z.enum([
    "exists",
    "not_exists",
    "eq",
    "ne",
    "gt",
    "lt",
    "gte",
    "lte",
    "contains",
  ]),
  value: z.string().optional(),
});

type ConditionNodeData = {
  field?: string;
  operator?:
    | "exists"
    | "not_exists"
    | "eq"
    | "ne"
    | "gt"
    | "lt"
    | "gte"
    | "lte"
    | "contains";
  value?: string;
  [key: string]: unknown;
};

type ConditionNodeType = Node<ConditionNodeData>;

export const ConditionNode = memo((props: NodeProps<ConditionNodeType>) => {
  const { setNodes, setEdges } = useReactFlow();
  const [openDialog, setOpenDialog] = useState(false);
  const conditionData = props.data as ConditionNodeData;

  const form = useForm<z.infer<typeof conditionSchema>>({
    resolver: zodResolver(conditionSchema),
    defaultValues: {
      field: conditionData.field || "error",
      operator:
        (conditionData.operator as z.infer<
          typeof conditionSchema
        >["operator"]) || "exists",
      value: conditionData.value || "",
    },
  });

  function onSubmit(values: z.infer<typeof conditionSchema>) {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === props.id
          ? { ...node, data: { ...node.data, ...values } }
          : node,
      ),
    );
    setOpenDialog(false);
  }

  function handleSettings() {
    setOpenDialog(true);
  }

  function handleDelete() {
    setNodes((nodes) => nodes.filter((node) => node.id !== props.id));
    setEdges((edges) =>
      edges.filter(
        (edge) => edge.source !== props.id && edge.target !== props.id,
      ),
    );
  }

  const operator = form.watch("operator");
  const needsValue = operator !== "exists" && operator !== "not_exists";

  const displayText = conditionData.field
    ? `${conditionData.field} ${conditionData.operator || ""}`.trim()
    : "is error exist";

  return (
    <>
      <CustomDialog
        title="Condition Node"
        description="Configure the condition for branching"
        open={openDialog}
        onOpenChange={setOpenDialog}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="field"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field to Check</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="sqlAttempts">SQL Attempts</SelectItem>
                      <SelectItem value="generatedSql">
                        Generated SQL
                      </SelectItem>
                      <SelectItem value="queryResult">Query Result</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>The state field to evaluate</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="operator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operator</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select operator" />
                      </SelectTrigger>
                    </FormControl>
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
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {needsValue && (
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value to Compare</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., true, 10, 'text'" {...field} />
                    </FormControl>
                    <FormDescription>
                      The value to compare against
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Configuration</Button>
            </div>
          </form>
        </Form>
      </CustomDialog>

      {/* Diamond-shaped node container */}
      <div
        className="relative group"
        style={{ width: "120px", height: "120px" }}
        onDoubleClick={handleSettings}
      >
        {/* Settings button */}
        <button
          onClick={handleSettings}
          className="absolute -top-8 right-0 z-10 p-1 rounded bg-background border hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GitBranch className="h-4 w-4" />
        </button>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="absolute -top-8 right-10 z-10 p-1 rounded bg-background border hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ×
        </button>

        {/* Diamond shape */}
        <div
          className="absolute bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-500 shadow-md cursor-pointer hover:border-yellow-600 transition-all"
          style={{
            width: "80px",
            height: "80px",
            transform: "rotate(45deg)",
            top: "20px",
            left: "20px",
          }}
        >
          {/* Content inside diamond (rotated back) */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: "rotate(-45deg)" }}
          >
            <div className="text-center px-4">
              <GitBranch className="h-6 w-6 mx-auto mb-1 text-yellow-600" />
              <div className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 leading-tight">
                {displayText}
              </div>
            </div>
          </div>
        </div>

        {/* Connection handles - Using proper React Flow Handle components */}
        {/* Top - Input */}
        <Handle
          type="target"
          position={Position.Top}
          id="target"
          style={{
            width: "12px",
            height: "12px",
            border: "2px solid #64748b",
            background: "#fff",
          }}
        />

        {/* Left - YES output */}
        <Handle
          type="source"
          position={Position.Left}
          id="yes"
          style={{
            width: "12px",
            height: "12px",
            border: "2px solid #22c55e",
            background: "#22c55e",
          }}
        />

        {/* Right - NO output */}
        <Handle
          type="source"
          position={Position.Right}
          id="no"
          style={{
            width: "12px",
            height: "12px",
            border: "2px solid #ef4444",
            background: "#ef4444",
          }}
        />

        {/* Labels */}
        <div
          className="absolute text-xs font-semibold text-green-600"
          style={{ top: "50%", left: "-40px", transform: "translateY(-50%)" }}
        >
          yes
        </div>
        <div
          className="absolute text-xs font-semibold text-red-600"
          style={{ top: "50%", right: "-30px", transform: "translateY(-50%)" }}
        >
          no
        </div>
      </div>
    </>
  );
});

ConditionNode.displayName = "ConditionNode";
