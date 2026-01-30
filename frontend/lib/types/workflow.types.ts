/* eslint-disable @typescript-eslint/no-explicit-any */
// Node template types from backend
export interface NodeTemplate {
  id: string;
  domain: string;
  type: string;
  fullType: string;
  name: string;
  description: string;
  kind: "trigger" | "action";
  icon?: string;
  configSchema: Record<string, any>;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  defaultConfig?: Record<string, any>;
}

export interface NodeTemplatesGrouped {
  [domain: string]: NodeTemplate[];
}

// Frontend workflow types
export interface WorkflowNodeConfig {
  id: string;
  type: string; // fullType from template
  position: { x: number; y: number };
  config: Record<string, any>;
  // label?: string;
}

export interface WorkflowEdgeConfig {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface WorkflowDefinition {
  id?: string;
  name: string;
  description?: string;
  // domain: WorkflowDomain;
  nodes: WorkflowNodeConfig[];
  edges: WorkflowEdgeConfig[];
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    author?: string;
    tags?: string[];
  };
}

// React Flow node data type
// export type NodeData = {
//   kind: "action" | "trigger";
//   label: string;
//   type: string;
//   icon?: string;
//   config: Record<string, any>;
//   template: NodeTemplate;
// };

/**
 * Frontend workflow types matching backend schema
 */

export enum WorkflowDomain {
  SQL = "sql",
  TRADING = "trading",
  DOCUMENT = "document",
  AGENT = "agent",
  LLM = "llm",
  MIXED = "mixed",
}

export enum ExecutionStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

// export interface WorkflowNode {
//   id: string;
//   type: string; // e.g., 'sql.generator', 'trading.binance'
//   position: {
//     x: number;
//     y: number;
//   };
//   config: Record<string, any>;
// }

// export interface WorkflowEdge {
//   id: string;
//   source: string;
//   target: string;
//   condition?: string;
// }

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface NodeCatalog {
  [domain: string]: NodeTemplate[];
}
