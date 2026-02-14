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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const llmNodeSchema = z.object({
  model: z.enum([
    "gpt-4",
    "gpt-3.5-turbo",
    "claude-3-opus",
    "claude-3-sonnet",
    "claude-3-haiku",
  ]),
  temperature: z.number().min(0).max(2),
  systemPrompt: z.string().min(1, "System prompt is required"),
  maxAttempts: z.number().int().min(1, "Max attempts must be at least 1"),
});

type LLMNodeData = z.infer<typeof llmNodeSchema> & {
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
      model: LLMNodeData.model || "gpt-4",
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">
                        GPT-3.5 Turbo
                      </SelectItem>
                      <SelectItem value="claude-3-opus">
                        Claude 3 Opus
                      </SelectItem>
                      <SelectItem value="claude-3-sonnet">
                        Claude 3 Sonnet
                      </SelectItem>
                      <SelectItem value="claude-3-haiku">
                        Claude 3 Haiku
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Choose the LLM model to use</FormDescription>
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
