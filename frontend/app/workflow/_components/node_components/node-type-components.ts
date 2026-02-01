import type { NodeTypes } from "@xyflow/react";
import { InitialNode } from "../InitialNode";
import { NodeType } from "@/lib/types/types";
import { SqlGeneratorNode } from "@/components/sql-components/sql-action/sqlGeneratorNode";
import { SqltriggerNode } from "@/components/sql-components/sql-trigger/sqlTriggerNode";
import { SqlExecutorNode } from "@/components/sql-components/sql-action/sqlExecutorNode";

export const nodeComponents = {
  [NodeType.INITIAL]: InitialNode,
  [NodeType.SQL_QUERY_TRIGGER]: SqltriggerNode,
  [NodeType.SQL_GENERATOR_ACTION]: SqlGeneratorNode,
  [NodeType.SQL_EXECUTOR_ACTION]: SqlExecutorNode,
} as const satisfies NodeTypes;

export type NodeComponentType = keyof typeof nodeComponents;
