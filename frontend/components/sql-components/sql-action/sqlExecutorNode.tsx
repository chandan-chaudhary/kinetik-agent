import { memo } from "react";
import { BaseActionNode } from "../../base-action-node";
import { Node, NodeProps } from "@xyflow/react";
import { Database } from "lucide-react";

type SqlExecutorNodeData = {
  model: string;
  temperature: number;
  systemPrompt: string;
  maxAttempts: number;
  [key: string]: unknown;
};
type SqlExecutorNodeType = Node<SqlExecutorNodeData>;
// this.registerTemplate({
//   name: "SQL Executor",
//   description: "Generate SQL queries using LLM",
//   configSchema: {
//     type: "object",
//     properties: {
//       model: {
//         type: "string",
//         title: "LLM Model",
//         enum: ["gpt-4", "gpt-3.5-turbo", "claude-3-opus", "claude-3-sonnet"],
//         default: "gpt-4",
//       },
//       temperature: {
//         type: "number",
//         title: "Temperature",
//         minimum: 0,
//         maximum: 2,
//         default: 0.1,
//       },
//       systemPrompt: {
//         type: "string",
//         title: "System Prompt",
//         description: "Custom system prompt template",
//         default:
//           "You are a SQL expert. Generate SQL queries based on the user question and database schema.",
//       },
//       maxAttempts: {
//         type: "number",
//         title: "Max Attempts",
//         minimum: 1,
//         maximum: 10,
//         default: 3,
//       },
//     },
//   },
// });

export const SqlExecutorNode = memo(
  (props: NodeProps<SqlExecutorNodeType>) => {
    const sqlNodeData = props.data as SqlExecutorNodeData;

    return (
      <>
        <BaseActionNode
          {...props}
          id={props.id}
          name="SQL Executor Node"
          description="Generate SQL queries using LLM"
          icon={Database}
          onSettings={() => {}}
          onDoubleClick={() => {}}
        />
      </>
    );
  },
);

SqlExecutorNode.displayName = "SqlExecutorNode";
    