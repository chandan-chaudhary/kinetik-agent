import { memo, type ReactNode } from "react";
import { type NodeProps, Position, useReactFlow } from "@xyflow/react";
import { BaseNode, BaseNodeContent } from "./react-flow/base-node";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { WorkFlowNode } from "@/app/(routes)/workflow/_components/workflowNode";
import { BaseHandle } from "./react-flow/base-handle";
import {
  NodeStatus,
  NodeStatusIndicator,
} from "./react-flow/node-status-indicator";

export interface BaseActionNodeProps extends NodeProps {
  name: string;
  description?: string;
  icon: LucideIcon | string;
  children?: ReactNode;
  status?: NodeStatus;
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
    status = "initial",
    onDoubleClick,
    onSettings,
  }: BaseActionNodeProps) => {
    const { setNodes, setEdges } = useReactFlow();
    function handleDelete() {
      console.log("Delete node", id);
      setNodes((currentNode) => {
        const updatedNode = currentNode.filter((node) => node.id !== id);
        return updatedNode;
      });
      setEdges((currentEdges) => {
        const updatedEdges = currentEdges.filter(
          (edge) => edge.source !== id && edge.target !== id,
        );
        return updatedEdges;
      });
    }
    return (
      <WorkFlowNode
        showToolbar={true}
        name={name}
        description={description}
        onDelete={handleDelete}
        onSettings={onSettings}
      >
        <NodeStatusIndicator status={status}>
          <BaseNode onDoubleClick={onDoubleClick} status={status}>
            <BaseNodeContent>
              {typeof Icon === "string" ? (
                <Image src={Icon} alt={name} width={24} height={24} />
              ) : (
                <Icon className="h-6 w-6 text-gray-600" />
              )}
              {children}
              <BaseHandle
                id="target-1"
                type="target"
                position={Position.Left}
              />
              <BaseHandle
                id="source-1"
                type="source"
                position={Position.Right}
              />
            </BaseNodeContent>
          </BaseNode>
        </NodeStatusIndicator>
      </WorkFlowNode>
    );
  },
);

BaseActionNode.displayName = "BaseActionNode";
