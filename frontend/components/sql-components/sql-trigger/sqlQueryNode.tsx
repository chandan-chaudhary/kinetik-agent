import { memo, useState } from "react";
import { BaseTriggerNode } from "@/components/base-trigger-node";
import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { Database } from "lucide-react";
import CustomDialog from "@/components/CutomDialog";
import { toast } from "sonner";
import {
  validateRequiredFields,
  getNodeDescription,
} from "@/lib/node-validation";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schemaConfigSchema = z.object({
  databaseUrl: z
    .string()
    .min(1, "Database URL is required")
    .refine(
      (val) => val.startsWith("postgresql://"),
      "Must be a valid PostgreSQL connection string",
    ),
});

type SchemaNodeData = z.infer<typeof schemaConfigSchema> & {
  [key: string]: unknown;
};

type SchemaNodeType = Node<SchemaNodeData>;

export const SqlQueryNode = memo((props: NodeProps<SchemaNodeType>) => {
  const { setNodes } = useReactFlow();
  const [openDialog, setOpenDialog] = useState(false);
  const status = 'initial';

  const requiredFields = ["databaseUrl"];
  const baseDescription = "Fetch database schema";
  const description = getNodeDescription(
    baseDescription,
    props.data,
    requiredFields,
  );

  const schemaNodeData = props.data as SchemaNodeData;

  const form = useForm<z.infer<typeof schemaConfigSchema>>({
    resolver: zodResolver(schemaConfigSchema),
    defaultValues: {
      databaseUrl: schemaNodeData.databaseUrl || "",
    },
  });

  function onSubmit(values: z.infer<typeof schemaConfigSchema>) {
    console.log("Schema Node Config:", values, props.id);

    // Validate required fields
    const validation = validateRequiredFields(values, [
      { field: "databaseUrl", label: "Database URL" },
    ]);

    if (!validation.isValid) {
      toast.error(
        `Please fill in all required fields: ${validation.missingFields.join(", ")}`,
      );
      return;
    }

    // Update node data with form values
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

  return (
    <>
      <CustomDialog
        title="Sql query node"
        description="Configure query node"
        open={openDialog}
        onOpenChange={setOpenDialog}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Database Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Configure the database connection for schema introspection
              </p>
            </div>

            <FormField
              control={form.control}
              name="databaseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="postgresql://user:password@host:5432/database"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Format: postgresql://user:password@host:port/database
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
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
      <BaseTriggerNode
        {...props}
        id={props.id}
        name="Schema Node"
        description={description}
        icon={Database}
        status={status}
        onSettings={handleSettings}
        onDoubleClick={handleSettings}
      />
    </>
  );
});

SqlQueryNode.displayName = "SqlQueryNode";
