import type { NodeTypes } from "@xyflow/react";
import { InitialNode } from "../InitialNode";
import { NodeType } from "@/lib/types/types";
import { SqlGeneratorNode } from "@/components/sql-components/sql-action/sqlGeneratorNode";
import { SqlExecutorNode } from "@/components/sql-components/sql-action/sqlExecutorNode";
import { SqlQueryNode } from "@/components/sql-components/sql-trigger/sqlQueryNode";
import { LLMNode } from "@/components/llmNode/llmNode";
import { ApprovalNode } from "@/components/approvalNode/approvalNode";
import { ConditionNode } from "@/components/conditionalNode/conditionalNode";
import { AssetDataNode } from "@/components/market-components/market-action/asset-data";
import { NewsDataNode } from "@/components/market-components/market-action/news-data";
import { MarketTriggerNode } from "@/components/market-components/market-trigger/marketTrigger";

export const nodeComponents = {
  [NodeType.INITIAL]: InitialNode,
  [NodeType.SQL_QUERY_TRIGGER]: SqlQueryNode,
  [NodeType.MARKET_RESEARCH_TRIGGER]: MarketTriggerNode, // Reusing SQL Query Node for market research trigger for now
  [NodeType.LLM_NODE]: LLMNode,
  [NodeType.CONDITION]: ConditionNode,
  [NodeType.APPROVAL]: ApprovalNode,
  [NodeType.SQL_GENERATOR_ACTION]: SqlGeneratorNode,
  [NodeType.SQL_EXECUTOR_ACTION]: SqlExecutorNode,
  [NodeType.ASSET_DATA_ACTION]: AssetDataNode,
  [NodeType.NEWS_DATA_ACTION]: NewsDataNode,
  
} as const satisfies NodeTypes;

export type NodeComponentType = keyof typeof nodeComponents;
