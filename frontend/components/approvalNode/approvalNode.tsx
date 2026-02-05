import { memo } from "react";
import { BaseActionNode } from "@/components/base-action-node";
import { Node, NodeProps } from "@xyflow/react";
import { CheckCircle2 } from "lucide-react";

type ApprovalNodeData = {
  [key: string]: unknown;
};
type ApprovalNodeType = Node<ApprovalNodeData>;

export const ApprovalNode = memo((props: NodeProps<ApprovalNodeType>) => {
  const status = "initial";

  return (
    <BaseActionNode
      {...props}
      id={props.id}
      name="Approval"
      description="Human-in-the-loop approval checkpoint"
      icon={CheckCircle2}
      status={status}
    />
  );
});

ApprovalNode.displayName = "ApprovalNode";
