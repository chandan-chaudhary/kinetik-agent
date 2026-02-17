import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { actionNode, NodeTypeOptions, triggerNode } from "./NodeRegistry";
import Image from "next/image";
import { Separator } from "@radix-ui/react-select";
import { useReactFlow } from "@xyflow/react";
import { NodeType } from "@/lib/types/types";
import { toast } from "sonner";
import { useCallback } from "react";
import { ObjectId } from "bson";

export interface NodeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export default function NodeSelector({
  open,
  onOpenChange,
  children,
}: NodeSelectorProps) {
  const { setNodes, getNodes, screenToFlowPosition } = useReactFlow();
  const handleAddNode = useCallback(
    (selection: NodeTypeOptions) => {
      if (selection.type === NodeType.SQL_QUERY_TRIGGER) {
        const nodes = getNodes();
        const SQLNodeExists = nodes.some(
          (node) => node.type === NodeType.SQL_QUERY_TRIGGER,
        );
        if (SQLNodeExists) {
          toast.error("Only one SQL Trigger Node is allowed in the workflow.");
          return;
        }
      }

      setNodes((nodes) => {
        const hasInitialNode = nodes.some(
          (node) => node.type === NodeType.INITIAL,
        );

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const position = screenToFlowPosition({
          x: centerX + (Math.random() - 0.5) * 200,
          y: centerY + (Math.random() - 0.5) * 200,
        });
        const newNode = {
          id: new ObjectId().toString(),
          type: selection.type,
          position,
          data: {
            // type: selection.type,
            // label: selection.label,
            // description: selection.description,
          },
        };
        if (hasInitialNode) {
          return [newNode];
        }
        return [...nodes, newNode];
      });
      onOpenChange(false);
    },
    [getNodes, screenToFlowPosition, setNodes, onOpenChange],
  );
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto p-1">
        <SheetHeader>
          <SheetTitle>Select Trigger Node for Workflow</SheetTitle>
          <SheetDescription>
            Choose a trigger node type to add to your workflow.
          </SheetDescription>
        </SheetHeader>
        <div>
          {triggerNode.map((node: NodeTypeOptions) => {
            const Icon = node.icon;
            return (
              <div
                key={node.type}
                className="p-4 mb-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => handleAddNode(node)}
              >
                <div>
                  {typeof Icon === "string" ? (
                    <Image src={Icon} alt={node.label} width={24} height={24} />
                  ) : (
                    <Icon className="h-6 w-6 text-gray-600" />
                  )}
                </div>
                <h3 className="text-lg font-medium">{node.label}</h3>
                <p className="text-sm text-gray-500">{node.description}</p>
              </div>
            );
          })}
        </div>
        <Separator />
        <SheetHeader>
          <SheetTitle>Select Action Node for Workflow</SheetTitle>
          <SheetDescription>
            Choose an action node type to add to your workflow.
          </SheetDescription>
        </SheetHeader>
        <div>
          {actionNode.map((node: NodeTypeOptions) => {
            const Icon = node.icon;
            return (
              <div
                key={node.type}
                className="p-4 mb-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => handleAddNode(node)}
              >
                <div>
                  {typeof Icon === "string" ? (
                    <Image src={Icon} alt={node.label} width={24} height={24} />
                  ) : (
                    <Icon className="h-6 w-6 text-gray-600" />
                  )}
                </div>
                <h3 className="text-lg font-medium">{node.label}</h3>
                <p className="text-sm text-gray-500">{node.description}</p>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
