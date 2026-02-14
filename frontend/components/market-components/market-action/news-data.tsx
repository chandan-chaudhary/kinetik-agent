import { memo, useState } from "react";
import { BaseActionNode } from "../../base-action-node";
import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { Database } from "lucide-react";
import CustomDialog from "../../CutomDialog";

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

const newsDataSchema = z.object({
  provider: z.enum(["alpaca", "alphaVantage"]),
  apiKey: z.string().min(1, "API Key is required"),
});

type NewsDataNodeData = z.infer<typeof newsDataSchema> & {
  [key: string]: unknown;
};

type NewsDataNodeType = Node<NewsDataNodeData>;

export const NewsDataNode = memo((props: NodeProps<NewsDataNodeType>) => {
  const { setNodes } = useReactFlow();
  const [openDialog, setOpenDialog] = useState(false);
  const status = "initial";

  const newsNodeData = props.data as NewsDataNodeData;

  const form = useForm<z.infer<typeof newsDataSchema>>({
    resolver: zodResolver(newsDataSchema),
    defaultValues: {
      provider: newsNodeData.provider || "alphaVantage",
      apiKey: newsNodeData.apiKey || "",
    },
  });

  function onSubmit(values: z.infer<typeof newsDataSchema>) {
    console.log("News Data Config:", values, props.id);
    if (!values.apiKey || !values.provider) {
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
        title="News Data Configuration"
        description="Configure news data fetching"
        open={openDialog}
        onOpenChange={setOpenDialog}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                News data API Configuration
              </h3>
              <p className="text-sm text-muted-foreground">
                Select API provider and provide credentials to fetch news data
              </p>
            </div>

            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Provider</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select API provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="alphaVantage">
                        Alpha Vantage
                      </SelectItem>
                      <SelectItem value="alpaca">Alpaca</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the market data API provider
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your API key"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your API key for the selected provider
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
      <BaseActionNode
        {...props}
        id={props.id}
        name="News Data"
        description="Fetch news data from API"
        icon={Database}
        status={status}
        onSettings={handleSettings}
        onDoubleClick={handleSettings}
      />
    </>
  );
});

NewsDataNode.displayName = "NewsDataNode";
