import type { NodeTypes } from "@xyflow/react";
import { InitialNode } from "../InitialNode";
import { NodeType } from "@/lib/types/types";
import { SqlGeneratorNode } from "@/components/sql-components/sql-action/sqlGeneratorNode";
import { SqlExecutorNode } from "@/components/sql-components/sql-action/sqlExecutorNode";
import { SqlQueryNode } from "@/components/sql-components/sql-trigger/sqlQueryNode";
import { LLMNode } from "@/components/llmNode/llmNode";

export const nodeComponents = {
  [NodeType.INITIAL]: InitialNode,
  [NodeType.SQL_QUERY_TRIGGER]: SqlQueryNode,
  [NodeType.LLM_NODE]: LLMNode,
  [NodeType.SQL_GENERATOR_ACTION]: SqlGeneratorNode,
  [NodeType.SQL_EXECUTOR_ACTION]: SqlExecutorNode,
} as const satisfies NodeTypes;

export type NodeComponentType = keyof typeof nodeComponents;
