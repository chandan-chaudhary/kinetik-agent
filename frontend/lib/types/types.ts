export type Json =
  | Record<string, unknown>
  | Array<unknown>
  | string
  | number
  | boolean
  | null;
export type DateTime = string;

export enum NodeType {
  INITIAL = "INITIAL",
  SQL_QUERY_TRIGGER = "SQL_QUERY_TRIGGER",
  LLM_NODE = "LLM_NODE",
  APPROVAL = "APPROVAL",
  CONDITION = "CONDITION",
  //action nodes
  SQL_GENERATOR_ACTION = "SQL_GENERATOR_ACTION",
  SQL_EXECUTOR_ACTION = "SQL_EXECUTOR_ACTION",
}

// Condition structure for edges
export interface EdgeCondition {
  field: string; // State field to check (e.g., "error", "approved", "retryCount")
  operator:
    | "exists"
    | "not_exists"
    | "eq"
    | "ne"
    | "gt"
    | "lt"
    | "gte"
    | "lte"
    | "contains"
    | "starts_with"
    | "ends_with";
  value?: any; // Value to compare against (not needed for exists/not_exists)
}

export interface User {
  id: string;
  [key: string]: unknown;
}

export interface Workflow {
  id?: string;
  userId: string;
  user?: User;
  name: string;
  description?: string | null;
  nodes?: Node[];
  connections?: Connection[];
  createdAt?: DateTime;
  updatedAt?: DateTime;
}

export interface Node {
  id?: string;
  workflowId: string;
  workflow?: Workflow;
  type: NodeType;
  position: Json;
  data: Json;
  outputConnections?: Connection[];
  inputConnections?: Connection[];
  createdAt?: DateTime;
  updatedAt?: DateTime;
}

export interface Connection {
  id?: string;
  workflowId: string;
  workflow?: Workflow;
  fromNodeId: string;
  fromNode?: Node;
  toNodeId: string;
  toNode?: Node;
  fromOutput?: string;
  toInput?: string;

  // Optional condition for conditional routing
  condition?: EdgeCondition | null;

  // Priority for multiple edges from same node (lower = higher priority)
  priority?: number;
  createdAt?: DateTime;
  updatedAt?: DateTime;
}
