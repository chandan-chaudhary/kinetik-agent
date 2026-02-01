import { memo } from "react";
import { BaseActionNode } from "../../base-action-node";
import { Node, NodeProps } from "@xyflow/react";
import { Database } from "lucide-react";

type SqlGeneratorNodeData = {
  model: string;
  temperature: number;
  systemPrompt: string;
  maxAttempts: number;
  [key: string]: unknown;
};
type SqlGeneratorNodeType = Node<SqlGeneratorNodeData>;
// this.registerTemplate({
//   name: "SQL Generator",
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

export const SqlGeneratorNode = memo(
  (props: NodeProps<SqlGeneratorNodeType>) => {
    const sqlNodeData = props.data as SqlGeneratorNodeData;

    return (
      <>
        <BaseActionNode
          {...props}
          id={props.id}
          name="SQL Generator Node"
          description="Generate SQL queries using LLM"
          icon={Database}
          onSettings={() => {}}
          onDoubleClick={() => {}}
        />
      </>
    );
  },
);

SqlGeneratorNode.displayName = "SqlGeneratorNode";
