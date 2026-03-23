import { memo, useState } from "react";
import { BaseActionNode } from "../../base-action-node";
import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { Send } from "lucide-react";
import CustomDialog from "../../CutomDialog";
import { getNodeDescription } from "@/lib/node-validation";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";

const telegramSchema = z.object({
  chatId: z.string().min(1, "Chat ID is required"),
  botToken: z.string().min(1, "Bot Token is required"),
  messageTemplate: z.string().optional(),
});

type TelegramNodeData = z.infer<typeof telegramSchema> & {
  [key: string]: unknown;
};

type TelegramNodeType = Node<TelegramNodeData>;

export const TelegramActionNode = memo((props: NodeProps<TelegramNodeType>) => {
  const { setNodes } = useReactFlow();
  const [openDialog, setOpenDialog] = useState(false);
  const status: NodeStatus = (props.data.status as NodeStatus) || "initial";

  const requiredFields = ["chatId"];
  const baseDescription = "Send market summary to a Telegram chat";
  const description = getNodeDescription(
    baseDescription,
    props.data,
    requiredFields,
  );

  const nodeData = props.data as TelegramNodeData;

  const form = useForm<z.infer<typeof telegramSchema>>({
    resolver: zodResolver(telegramSchema),
    defaultValues: {
      chatId: nodeData.chatId || "",
      botToken: nodeData.botToken || "",
      messageTemplate: nodeData.messageTemplate || "",
    },
  });

  function onSubmit(values: z.infer<typeof telegramSchema>) {
    if (!values.chatId) {
      toast.error("Chat ID is required");
      return;
    }
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === props.id
          ? { ...node, data: { ...node.data, ...values } }
          : node,
      ),
    );
    toast.success("Telegram configuration saved");
    setOpenDialog(false);
  }

  return (
    <>
      <CustomDialog
        title="Telegram Action Configuration"
        description="Configure the Telegram bot that sends market summaries"
        open={openDialog}
        onOpenChange={setOpenDialog}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                Telegram Bot Configuration
              </h3>
              <p className="text-sm text-muted-foreground">
                Set the target chat and optional bot token override.
              </p>
            </div>

            <FormField
              control={form.control}
              name="chatId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chat ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. -1001234567890" {...field} />
                  </FormControl>
                  <FormDescription>
                    The Telegram chat or channel ID where summaries will be
                    sent.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="botToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bot Token</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Leave blank to use server env variable"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Override the default bot token for this node only.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="messageTemplate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Template (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Leave blank to use the LLM-generated summary as-is"
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Wrap the summary in custom text. Use{" "}
                    <code className="text-xs">{"{{summary}}"}</code> as a
                    placeholder for the generated content.
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
        name="Telegram"
        description={description}
        icon={Send}
        status={status}
        onSettings={() => setOpenDialog(true)}
        onDoubleClick={() => setOpenDialog(true)}
      />
    </>
  );
});

TelegramActionNode.displayName = "TelegramActionNode";
