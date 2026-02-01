import { memo, type ReactNode } from "react";
import { type NodeProps, Position } from "@xyflow/react";
import { BaseNode, BaseNodeContent } from "./react-flow/base-node";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { WorkFlowNode } from "@/app/workflow/_components/workflowNode";
import { BaseHandle } from "./react-flow/base-handle";

export interface BaseActionNodeProps extends NodeProps {
  name: string;
  description?: string;
  icon: LucideIcon | string;
  children?: ReactNode;
  //   status?: "idle" | "running" | "error" | "success";
  onSettings?: () => void;
  onDoubleClick?: () => void;
}
export const BaseActionNode = memo(
  ({
    id,
    name,
    description,
    icon: Icon,
    children,
    onDoubleClick,
    onSettings,
  }: BaseActionNodeProps) => {
    function handleDelete() {
      console.log("Delete node", id);
    }
    return (
      <WorkFlowNode
        showToolbar={true}
        name={name}
        description={description}
        onDelete={handleDelete}
        onSettings={onSettings}
      >
        <BaseNode onDoubleClick={onDoubleClick}>
          <BaseNodeContent>
            {typeof Icon === "string" ? (
              <Image src={Icon} alt={name} width={24} height={24} />
            ) : (
              <Icon className="h-6 w-6 text-gray-600" />
            )}
            {children}
            <BaseHandle id="target-1" type="target" position={Position.Left} />
            <BaseHandle id="source-1" type="source" position={Position.Right} />
          </BaseNodeContent>
        </BaseNode>
      </WorkFlowNode>
    );
  },
);

BaseActionNode.displayName = "BaseActionNode";
