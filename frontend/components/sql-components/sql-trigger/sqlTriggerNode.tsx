import { memo, useState } from "react";
import { Node, NodeProps } from "@xyflow/react";
import { Database } from "lucide-react";
import { BaseTriggerNode } from "@/components/base-trigger-node";
import SqlDialog from "../../CutomDialog";

type SqltriggerNodeData = {
  connectionString: string;
  includeViews: boolean;
  [key: string]: unknown;
};
type SqltriggerNodeType = Node<SqltriggerNodeData>;

//  this.registerTemplate({
//       id: 'sql-schema',
//       domain: 'sql',
//       type: 'schema',
//       fullType: 'sql.schema',
//       name: 'Database Schema',
//       description: 'Fetch database schema information',
//       kind: 'action',
//       icon: '🗄️',
//       configSchema: {
//         type: 'object',
//         properties: {
//           connectionString: {
//             type: 'string',
//             title: 'Connection String',
//             description: 'PostgreSQL connection string',
//           },
//           includeViews: {
//             type: 'boolean',
//             title: 'Include Views',
//             default: false,
//           },
//         },
//         required: ['connectionString'],
//       },

//     });
export const SqltriggerNode = memo((props: NodeProps<SqltriggerNodeType>) => {
  const [openDialog, setOpenDialog] = useState(false);
  const status = "loading";
  const sqlNodeData = props.data as SqltriggerNodeData;
  const description = sqlNodeData.connectionString
    ? `Connection: ${sqlNodeData.connectionString}, Include Views: ${
        sqlNodeData.includeViews ? "Yes" : "No"
      }`
    : "Not configured";

  function handleSettings() {
    setOpenDialog(true);
  }
  return (
    <>
      <SqlDialog title="sql tigger NOde" description="trigger cinfig" open={openDialog} onOpenChange={setOpenDialog} />
      <BaseTriggerNode
        {...props}
        id={props.id}
        name="SQL Query Node"
        description={description}
        icon={Database}
        status={status}
        onSettings={handleSettings}
        onDoubleClick={handleSettings}
      />
    </>
  );
});

SqltriggerNode.displayName = "SqltriggerNode";
