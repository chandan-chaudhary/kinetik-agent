import { memo, useState } from "react";
import { BaseActionNode } from "../../base-action-node";
import { Node, NodeProps } from "@xyflow/react";
import { Database } from "lucide-react";
import SqlDialog from "../../CutomDialog";

type SqlGeneratorNodeData = {
  model: string;
  temperature: number;
  systemPrompt: string;
  maxAttempts: number;
  [key: string]: unknown;
};
type SqlGeneratorNodeType = Node<SqlGeneratorNodeData>;

export const SqlGeneratorNode = memo(
  (props: NodeProps<SqlGeneratorNodeType>) => {
    const [openDialog, setOpenDialog] = useState(false);

    const sqlNodeData = props.data as SqlGeneratorNodeData;
    const status = "initial";

    function handleSettings() {
      setOpenDialog(true);
    }
    return (
      <>
        <SqlDialog title="SQL Generator" description="Configure SQL generator here" open={openDialog} onOpenChange={setOpenDialog}>
          <div>This is where SQL Generator configuration UI will go.</div>
        </SqlDialog>
        <BaseActionNode
          {...props}
          id={props.id}
          name="SQL Generator Node"
          description="Generate SQL queries using LLM"
          icon={Database}
          status={status}
          onSettings={handleSettings}
          onDoubleClick={handleSettings}
        />
      </>
    );
  },
);

SqlGeneratorNode.displayName = "SqlGeneratorNode";
