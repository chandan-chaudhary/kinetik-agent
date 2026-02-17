import type { NodeProps } from "@xyflow/react";
import { PlaceholderNode } from "@/components/react-flow/placeholder-node";
import { PlusIcon } from "lucide-react";
import { memo, useState } from "react";
import { WorkFlowNode } from "./workflowNode";
import NodeSelector from "./node_components/NodeSelector";

export const InitialNode = memo((props: NodeProps) => {
  const [selectorOpen, setSelectorOpen] = useState(false);

  return (
    <NodeSelector open={selectorOpen} onOpenChange={setSelectorOpen}>
      <WorkFlowNode
        showToolbar={true}
        name="Initial Node"
        description="Start creating your workflow"
      >
        <PlaceholderNode {...props} onClick={() => setSelectorOpen(true)}>
          <div className="flex flex-col items-center justify-center">
            <PlusIcon className=" h-4 w-4 text-gray-400" />
          </div>
        </PlaceholderNode>
      </WorkFlowNode>
    </NodeSelector>
  );
});

InitialNode.displayName = "InitialNode";
