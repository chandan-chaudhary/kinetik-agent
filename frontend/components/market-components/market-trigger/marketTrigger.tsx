import { memo, useState } from "react";
import { BaseTriggerNode } from "@/components/base-trigger-node";
import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { SearchCodeIcon } from "lucide-react";
import CustomDialog from "@/components/CutomDialog";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const schemaConfigSchema = z.object({
  ticker: z
    .string()
    .min(1, "Ticker is required")
    .regex(
      /^[A-Z]+\/[A-Z]+$/,
      "Ticker must be in format SYMBOL/BASE (e.g., ETH/USD)",
    ),
  type: z.enum(["crypto", "stock", "forex", "commodity"]),
});

type SchemaNodeData = z.infer<typeof schemaConfigSchema> & {
  [key: string]: unknown;
};

type SchemaNodeType = Node<SchemaNodeData>;

export const MarketTriggerNode = memo((props: NodeProps<SchemaNodeType>) => {
  const { setNodes } = useReactFlow();
  const [openDialog, setOpenDialog] = useState(false);
  const status = "initial";

  const schemaNodeData = props.data as SchemaNodeData;

  const form = useForm<z.infer<typeof schemaConfigSchema>>({
    resolver: zodResolver(schemaConfigSchema),
    defaultValues: {
      type: schemaNodeData.type || "crypto",
      ticker: schemaNodeData.ticker || "",
    },
  });

  function onSubmit(values: z.infer<typeof schemaConfigSchema>) {
    console.log("Market Trigger Config:", values, props.id);
    if (!values.ticker || !values.type) {
      toast.error("Please fill in all required fields");
      return;
    }
    // TODO: Update node data with form values
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
        title="Market Trigger Configuration"
        description="Configure market data trigger"
        open={openDialog}
        onOpenChange={setOpenDialog}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Market Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Configure the market data trigger parameters
              </p>
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Market Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select market type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="forex">Forex</SelectItem>
                      <SelectItem value="commodity">Commodity</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the type of market for this trigger
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ticker"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticker Symbol</FormLabel>
                  <FormControl>
                    <Input placeholder="ETH/USD" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the ticker symbol in SYMBOL/BASE format (e.g.,
                    ETH/USD, AAPL/USD)
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
        name="Market Trigger"
        description="Trigger on market data changes"
        icon={SearchCodeIcon}
        status={status}
        onSettings={handleSettings}
        onDoubleClick={handleSettings}
      />
    </>
  );
});

MarketTriggerNode.displayName = "MarketTriggerNode";
