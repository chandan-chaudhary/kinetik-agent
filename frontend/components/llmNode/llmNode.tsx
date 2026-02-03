import { memo, useState } from "react";
import { BaseActionNode } from "@/components/base-action-node";
import { Node, NodeProps } from "@xyflow/react";
import { ShipWheel } from "lucide-react";
import CustomDialog from "@/components/CutomDialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const llmNodeSchema = z.object({
  model: z.string().min(1, "Model is required"),
  temperature: z.number().min(0).max(2),
  systemPrompt: z.string().min(1, "System prompt is required"),
  maxAttempts: z.number().int().min(1, "Max attempts must be at least 1"),
});

type LLMNodeData = {
  model: string;
  temperature: number;
  systemPrompt: string;
  maxAttempts: number;
  [key: string]: unknown;
};
type LLMNodeType = Node<LLMNodeData>;

export const LLMNode = memo((props: NodeProps<LLMNodeType>) => {
  const [openDialog, setOpenDialog] = useState(false);
  const LLMNodeData = props.data as LLMNodeData;
  const status = "initial";

  const form = useForm<z.infer<typeof llmNodeSchema>>({
    resolver: zodResolver(llmNodeSchema),
    defaultValues: {
      model: LLMNodeData.model || "",
      temperature: LLMNodeData.temperature || 0.7,
      systemPrompt: LLMNodeData.systemPrompt || "",
      maxAttempts: LLMNodeData.maxAttempts || 3,
    },
  });

  function handleSettings() {
    setOpenDialog(true);
  }

  function onSubmit(values: z.infer<typeof llmNodeSchema>) {
    console.log(values);
    // TODO: Update node data with form values
    setOpenDialog(false);
  }
  return (
    <>
      <CustomDialog
        title="LLM Node"
        description="Configure LLM Node"
        open={openDialog}
        onOpenChange={setOpenDialog}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., gpt-4" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temperature</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="systemPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter system prompt..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxAttempts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Attempts</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Form>
      </CustomDialog>
      <BaseActionNode
        {...props}
        id={props.id}
        name="LLM Node"
        description="Add llm to use in entire flow"
        icon={ShipWheel}
        status={status}
        onSettings={handleSettings}
        onDoubleClick={handleSettings}
      />
    </>
  );
});

LLMNode.displayName = "LLMNode";
