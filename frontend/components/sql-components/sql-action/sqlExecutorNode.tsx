import { memo, useState } from "react";
import { BaseActionNode } from "@/components/base-action-node";

import { Node, NodeProps } from "@xyflow/react";
import { Database } from "lucide-react";
import CustomDialog from "@/components/CutomDialog";

type SqlExecutorNodeData = {
  model: string;
  temperature: number;
  systemPrompt: string;
  maxAttempts: number;
  [key: string]: unknown;
};
type SqlExecutorNodeType = Node<SqlExecutorNodeData>;

export const SqlExecutorNode = memo((props: NodeProps<SqlExecutorNodeType>) => {
  const [openDialog, setOpenDialog] = useState(false);
  const sqlNodeData = props.data as SqlExecutorNodeData;
  const status = "initial";

  function handleSettings() {
    setOpenDialog(true);
  }
  return (
    <>
      <CustomDialog
        title="Sql Executor node"
        description="Configure executor node"
        open={openDialog}
        onOpenChange={setOpenDialog}
      >
        <div>This is where SQL Executor configuration UI will go.</div>
      </CustomDialog>
      <BaseActionNode
        {...props}
        id={props.id}
        name="SQL Executor Node"
        description="Execute queries"
        icon={Database}
        status={status}
        onSettings={handleSettings}
        onDoubleClick={handleSettings}
      />
    </>
  );
});

SqlExecutorNode.displayName = "SqlExecutorNode";
