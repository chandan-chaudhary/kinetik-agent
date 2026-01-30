import type { NodeProps } from "@xyflow/react";
import { PlaceholderNode } from "@/components/react-flow/placeholder-node";
import { PlusIcon } from "lucide-react";
import { memo } from "react";
import { WorkFlowNode } from "./workflowNode";

export const InitialNode = memo((props: NodeProps) => {
  return (
    <WorkFlowNode showToolbar={true} name="Initial Node" description="Start creating your workflow">
      <PlaceholderNode {...props} onClick={() => {}}>
        <div className="flex flex-col items-center justify-center">
          <PlusIcon className=" h-4 w-4 text-gray-400" />
        </div>
      </PlaceholderNode>
    </WorkFlowNode>
  );
});

InitialNode.displayName = "InitialNode";
